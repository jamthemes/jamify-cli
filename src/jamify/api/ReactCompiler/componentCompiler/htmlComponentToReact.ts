import path from 'path';
import {
  HtmlComponentPublicProperty,
  HtmlComponentElement,
  DynamicAttributeType,
  HtmlComponent,
  ElementAttributeDescriptor,
} from '../../../util/types/htmlComponent';
import { generateIdentifierName } from '../../ComponentRegistry/util/util';
import { fsExists, fsMkDir, fsWriteFile } from '../../../util/fs';
import ComponentRegistry from '../../ComponentRegistry';
import htmlStylesToJsx from '../jsxCompiler/htmlStylesToJsx';
import { ImportedPageAsset } from '../jsxCompiler/createImports';

function htmlAttributeToJsxProp(attribute: string) {
  const mapping: { [key: string]: string } = {
    class: 'className',
    for: 'htmlFor',
    srcset: 'srcSet',
  };
  const found = mapping[attribute];
  return found || attribute;
}

interface ComponentProperty extends HtmlComponentPublicProperty {
  propVarName: string;
}

interface ConvertPropertyValueToStringParams {
  attribute: ElementAttributeDescriptor;
  publicComponentProperties: ComponentProperty[];
}
/**
 * Given a component's attribute
 * public property value,
 * convert it to a string, which can
 * then be set as a value in JSX
 */
function convertPropertyValueToString({
  attribute,
  publicComponentProperties,
}: ConvertPropertyValueToStringParams) {
  let propertyType: 'string' | 'expression' = 'string';
  let staticValues = attribute.staticValues.join(attribute.valuesSeparator);

  const dynamicValues = attribute.dynamicValues
    .map(dynamicValue => {
      const componentProperty = publicComponentProperties.find(
        prop => prop.name === dynamicValue.publicPropertyName,
      );
      const varName = componentProperty ? componentProperty.propVarName : '';
      return dynamicValue.type === DynamicAttributeType.TOGGLE
        ? `(${varName} ? '${dynamicValue.value}' : '')`
        : `${varName}`;
    })
    .join(` + '${attribute.valuesSeparator || ''}' + `);

  if (staticValues.length > 0) {
    staticValues = `${staticValues}${
      dynamicValues.length > 0 && attribute.valuesSeparator
        ? attribute.valuesSeparator
        : ''
    }`;
    if (dynamicValues.length > 0) {
      staticValues = `'${staticValues}' + `;
    }
  }

  if (
    attribute.originalAttributeName === 'style' &&
    dynamicValues.length === 0
  ) {
    // Transform style string to JSX
    const styleJsxObj = htmlStylesToJsx(staticValues);
    staticValues = styleJsxObj;
    propertyType = 'expression';
  }

  const propertyVariableValue = `${staticValues}${dynamicValues}`;

  if (dynamicValues.length > 0) {
    propertyType = 'expression';
  }

  return {
    value: propertyVariableValue,
    type: propertyType,
  };
}

function componentElementToJSX(
  currentElement: HtmlComponentElement,
  publicComponentProperties: ComponentProperty[],
  componentRegistry: ComponentRegistry,
): string {
  const foundComponent = componentRegistry.findComponentByName(
    currentElement.tagName,
  );
  const componentName = foundComponent
    ? foundComponent.jsName
    : currentElement.tagName;

  let propertyString = currentElement.componentAttributes.reduce(
    (str, attribute) => {
      if (attribute.name === '__children__') {
        return str;
      }

      const camalizedAttributeName = generateIdentifierName({
        input: attribute.name,
      });
      const mappedAttribute = htmlAttributeToJsxProp(camalizedAttributeName);

      const {
        type: propertyType,
        value: propertyVariableValue,
      } = convertPropertyValueToString({
        attribute,
        publicComponentProperties,
      });

      let attrStr = '';
      if (propertyType === 'string') {
        attrStr = `${mappedAttribute}="${propertyVariableValue}"`;
      }

      if (propertyType === 'expression') {
        attrStr = `${mappedAttribute}={${propertyVariableValue}}`;
      }

      return `${attrStr} ${str}`;
    },
    '',
  );
  if (propertyString.length > 0) {
    propertyString = ` ${propertyString}`;
  }

  const childrenProperty = currentElement.componentAttributes.find(
    attr => attr.name === '__children__',
  );
  const stringifiedChildrenProp = childrenProperty
    ? convertPropertyValueToString({
        attribute: childrenProperty,
        publicComponentProperties,
      })
    : null;

  let renderedChildren = `{${stringifiedChildrenProp?.value}}`;

  if (!stringifiedChildrenProp) {
    renderedChildren = currentElement.children
      .map(elem => {
        if (typeof elem === 'string') {
          return elem;
        } else {
          return componentElementToJSX(
            elem,
            publicComponentProperties,
            componentRegistry,
          );
        }
      })
      .join('\n');
  }

  return `
    <${componentName}${propertyString}>
      ${renderedChildren}
    </${componentName}>
  `;
}

/**
 * Returns a list of components
 * which need to be imported
 */
function getComponentImports(
  element: HtmlComponentElement,
  componentRegistry: ComponentRegistry,
): string[] {
  const nonStringChildren = element.children.filter(
    elem => typeof elem !== 'string',
  ) as HtmlComponentElement[];
  const imports = nonStringChildren
    .map(elem => {
      const foundComponent = componentRegistry.findComponentByName(
        elem.tagName,
      );
      if (foundComponent) {
        return foundComponent.jsName;
      }
      return undefined;
    })
    .filter(Boolean) as string[];
  const childImports = nonStringChildren
    .map(elem => getComponentImports(elem, componentRegistry))
    .flat();
  return [...new Set([...imports, ...childImports])];
}

/**
 * Creates local variable
 * names for properties
 */
function createComponentProperties(
  properties: HtmlComponentPublicProperty[],
): ComponentProperty[] {
  return properties.map(prop => {
    const propVarName = generateIdentifierName({
      input: prop.name,
    });
    const localValueVarName = `${propVarName}Value`;
    return {
      ...prop,
      propVarName,
      localValueVarName,
    };
  });
}

export interface ReactComponent {
  htmlComponent: HtmlComponent;
  /**
   * Capitalized and camel-cased
   * name of the component
   */
  name: string;
  content: string;
  /**
   * Absolute path to the file
   * where the component was
   * saved
   */
  filePath: string;
}

interface HtmlComponentToReactParams {
  component: HtmlComponent;
  componentsOutFolder: string;
  /**
   * Optional function which transforms
   * JSX before being saved to file.
   * Returns the new JSX and eventual
   * assets which need to be imported
   */
  transformJsx?: (
    oldJsx: string,
  ) => Promise<{ newJsx: string; importedAssets: ImportedPageAsset[] }>;
  componentRegistry: ComponentRegistry;
}

export default async function htmlComponentToReact({
  component,
  componentRegistry,
  componentsOutFolder,
  transformJsx = str => Promise.resolve({ newJsx: str, importedAssets: [] }),
}: HtmlComponentToReactParams): Promise<ReactComponent> {
  if (!(await fsExists(componentsOutFolder))) {
    await fsMkDir(componentsOutFolder, { recursive: true });
  }

  const componentProperties = createComponentProperties(
    component.publicProperties,
  );
  let bodyJsx = componentElementToJSX(
    component.entryElement,
    componentProperties,
    componentRegistry,
  );

  const jsxTransformationResult = await transformJsx(bodyJsx);
  bodyJsx = jsxTransformationResult.newJsx;

  let destructeredProperties = componentProperties.reduce((str, prop) => {
    return `${prop.propVarName},\n${str}`;
  }, '');
  destructeredProperties = `{
    ${destructeredProperties}
  }`;

  const reactComponentName = component.jsName;
  const imports = getComponentImports(
    component.entryElement,
    componentRegistry,
  );

  let importStrings = imports
    .map(importName => `import ${importName} from './${importName}'`)
    .join('\n');

  // Add imports which may have been created during JSX transformation
  const jsxImports = jsxTransformationResult.importedAssets
    .map(
      asset =>
        `import ${asset.importIdentifier} from '${asset.relativeImportPath}'`,
    )
    .join('\n');
  importStrings = `${importStrings}\n${jsxImports}`;

  const reactComponentContent = `
    import React from 'react';
    import { Link } from "gatsby"
    ${importStrings}

    export default function ${reactComponentName}(${destructeredProperties}) {
      return (
        ${bodyJsx}
      );
    }
  `;

  const fileName = `${reactComponentName}.js`;
  const fullOutPath = path.join(componentsOutFolder, fileName);

  await fsWriteFile(fullOutPath, reactComponentContent);

  return {
    filePath: fullOutPath,
    content: reactComponentContent,
    htmlComponent: component,
    name: reactComponentName,
  };
}

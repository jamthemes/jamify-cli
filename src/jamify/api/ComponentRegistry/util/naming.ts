import { generateIdentifierName } from './util';
import {
  DynamicAttributeType,
  HtmlComponent,
} from '../../../util/types/htmlComponent';

interface GetPublicAttributeNameOptions {
  dynamicAttributeType: DynamicAttributeType;
  domPropertyName: string;
  domTagName: string;
  dynamicValue?: string;
  componentName: string;
}

interface IdentifierDescriptor {
  identifier: string;
  type: 'component' | 'property';
  componentName: string;
}

function camelCase(indentifier: string) {
  let out = '';
  const splitted = indentifier.split(/[^a-zA-Z0-9]/).filter(Boolean);
  splitted.forEach(function(el, idx) {
    const add = el.toLowerCase();
    const str1 = add[0].toUpperCase();
    const str2 = add.slice(1);
    out += idx === 0 ? add : str1 + str2;
  });
  return out;
}

function capitalize(str: string) {
  return `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`;
}

/**
 * adds random char at the beginning if
 * identifier starts with number
 */
function startsWithChar(identifier: string) {
  const firstChar = identifier.charAt(0);
  if (!firstChar) return identifier;
  const num = parseInt(firstChar);
  if (!isNaN(num)) {
    return `c-${identifier}`;
  }
  return identifier;
}

/**
 * Some component names cause errors
 * and are forbidden
 */
function validateComponentName(currentName: string) {
  let newName = startsWithChar(currentName);
  const forbiddenComponentNames = [{ name: 'image', newName: 'html-image' }];
  for (const forbiddenName of forbiddenComponentNames) {
    if (forbiddenName.name === newName) {
      newName = forbiddenName.newName;
      break;
    }
  }
  return newName;
}

/**
 * Generate unique but expressive
 * names for components and public
 * properties.
 * TODO: Test many possible,
 * weird cases of DOM
 * structures
 */
class ComponentizerNaming {
  private components: { name: string; publicPropertyNames: string[] }[] = [];

  private isIdentifierTaken({
    componentName,
    identifier,
    type,
  }: IdentifierDescriptor) {
    const foundComponent = this.components.find(
      cmp => cmp.name === componentName,
    );
    if (
      foundComponent &&
      type === 'component' &&
      identifier === foundComponent.name
    ) {
      return true;
    }
    if (
      foundComponent &&
      type === 'property' &&
      foundComponent.publicPropertyNames.includes(identifier)
    ) {
      return true;
    }
    if (!foundComponent && type === 'component') {
      this.components.push({
        name: componentName,
        publicPropertyNames: [],
      });
    }
    if (foundComponent && type === 'property') {
      foundComponent.publicPropertyNames.push(identifier);
    }
    return false;
  }

  /**
   * If naming is already taken,
   * append an incrementing counter
   * to that identifier until it's
   * not taken anymore
   */
  private addIncrementingCounter(
    identifierDescriptor: IdentifierDescriptor,
  ): string {
    const { identifier } = identifierDescriptor;
    if (this.isIdentifierTaken(identifierDescriptor)) {
      const lastChar = identifier.charAt(identifier.length - 1);
      const num = parseInt(lastChar);
      const newNum = Number.isNaN(num) ? 0 : num + 1;
      return this.addIncrementingCounter({
        ...identifierDescriptor,
        identifier: newNum
          ? identifier.slice(0, identifier.length - 2)
          : identifier + newNum,
      });
    }
    return identifier;
  }

  /**
   * Converts an identifier
   * to camelCase and capitalizes
   * it if specified
   */
  public toJsName(
    htmlComponentName: string,
    shouldCapitalize: boolean = false,
  ) {
    let jsName = camelCase(htmlComponentName);
    if (shouldCapitalize) {
      jsName = capitalize(jsName);
    }
    return jsName;
  }

  public getComponentName(
    component: Omit<
      Omit<Omit<HtmlComponent, 'name'>, 'publicProperties'>,
      'jsName'
    >,
  ) {
    let cmpName = '';
    const classAttribute = component.entryElement.componentAttributes.find(
      attr => attr.name === 'class',
    );
    if (classAttribute && classAttribute.staticValues.length > 0) {
      cmpName = generateIdentifierName({
        input: classAttribute.staticValues.join(' '),
        useSeparator: '-',
      });
    }

    if (!cmpName) {
      if (component.entryElement.children.length > 0) {
        const [firstChild] = component.entryElement.children;
        if (typeof firstChild !== 'string' && firstChild.tagName) {
          cmpName = `${component.entryElement.tagName}-${firstChild.tagName}`;
        }
      }
      if (!cmpName) {
        cmpName = `cmp-${component.entryElement.tagName}`;
      }
    }

    cmpName = validateComponentName(cmpName);

    cmpName = this.addIncrementingCounter({
      componentName: cmpName,
      identifier: cmpName,
      type: 'component',
    });
    return cmpName;
  }

  public getPublicPropertyName({
    dynamicAttributeType,
    domPropertyName,
    domTagName,
    dynamicValue,
    componentName,
  }: GetPublicAttributeNameOptions) {
    let propertyIdentifier = generateIdentifierName({
      input:
        dynamicAttributeType === DynamicAttributeType.TOGGLE
          ? dynamicValue!
          : `${domTagName} ${domPropertyName}`,
      useSeparator: '-',
    });
    propertyIdentifier = startsWithChar(propertyIdentifier);
    return this.addIncrementingCounter({
      componentName,
      identifier: propertyIdentifier,
      type: 'property',
    });
  }

  public isComponent(tagName: string) {
    const foundComponent = this.components.find(cmp => cmp.name === tagName);
    return !!foundComponent;
  }
}

const componentizerNaming = new ComponentizerNaming();

export default componentizerNaming;

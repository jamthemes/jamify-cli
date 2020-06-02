// TODO: Enable type checking and use "PluginItem"
// type to correctly type this module!
// @ts-nocheck
import htmlStylesToJsx from '../htmlStylesToJsx';

export let result = {
  importedComponents: [],
};

function addComponentImport(component) {
  const foundComponent = result.importedComponents.find(
    (cmp) => cmp.name === component.name,
  );
  if (!foundComponent) {
    result.importedComponents.push(component);
  }
}

function objToObjectExpression(jsObj) {
  const propsArray = Object.keys(jsObj).reduce((props, key) => {
    const val = jsObj[key];
    const newProp = t.objectProperty(t.identifier(key), t.stringLiteral(val));
    return [...props, newProp];
  }, []);
  return t.objectExpression(propsArray);
}

function camelCase(indentifier) {
  let out = '';
  const splitted = indentifier.split(/[^a-zA-Z0-9]/).filter(Boolean);
  splitted.forEach(function (el, idx) {
    const add = el.toLowerCase();
    const str1 = add[0].toUpperCase();
    const str2 = add.slice(1);
    out += idx === 0 ? add : str1 + str2;
  });
  return out;
}

// @ts-check
const { types: t } = require('@babel/core');

function createComponent({ componentName, attributes, children }) {
  const cmpIndentifier = t.jsxIdentifier(componentName);

  for (const attr of attributes) {
    attr.name.name = camelCase(attr.name.name);
    // Set boolean string values ("true"/"false") to
    // actual boolean values.
    if (t.isLiteral(attr.value)) {
      const value = attr.value.value;
      if (value === 'true') {
        attr.value = null;
      }
      if (value === 'false') {
        attr.value = t.booleanLiteral(false);
      }
    }
  }

  const opening = t.jsxOpeningElement(cmpIndentifier, attributes, false);
  const closing = t.jsxClosingElement(cmpIndentifier);
  const element = t.jsxElement(opening, closing, children, true);
  return element;
}

export default function pluginReplaceComponents(_ref) {
  return {
    visitor: {
      JSXElement: {
        enter(path, state) {
          const { componentRegistry, transformUrl } = state.opts;

          const elem = path.node.openingElement;
          const cmpName = elem.name.name;

          const foundComponent = componentRegistry.findComponentByName(cmpName);

          if (foundComponent) {
            addComponentImport(foundComponent);
            // Transform possible style attributes to
            // an object
            const publicStyleProps = foundComponent.publicProperties.filter(
              (prop) => prop.originalAttributeName === 'style',
            );
            if (publicStyleProps.length > 0) {
              for (const elemAttrib of elem.attributes) {
                const publicStyleProp = publicStyleProps.find(
                  (prop) => prop.name === elemAttrib.name.name,
                );
                if (
                  publicStyleProp &&
                  elemAttrib.value &&
                  t.isStringLiteral(elemAttrib.value) &&
                  elemAttrib.value.value
                ) {
                  const jsxStyleObj = htmlStylesToJsx(elemAttrib.value.value);
                  elemAttrib.value = t.jsxExpressionContainer(
                    objToObjectExpression(JSON.parse(jsxStyleObj)),
                  );
                }
              }
            }

            // Transform possible href value attibutes
            // to local link values
            const publicHrefProps = foundComponent.publicProperties.filter(
              (prop) => prop.originalAttributeName === 'href',
            );
            const hrefAttributes = publicHrefProps
              .map((publicProp) =>
                elem.attributes.find(
                  (attr) => attr.name.name === publicProp.name,
                ),
              )
              .filter(Boolean);
            for (const hrefAttr of hrefAttributes) {
              if (t.isStringLiteral(hrefAttr.value)) {
                const hrefValue = hrefAttr.value.value;
                if (hrefValue) {
                  const transformedHref = transformUrl(hrefValue);
                  if (transformedHref) {
                    hrefAttr.value.value = transformedHref;
                  }
                }
              }
            }

            const newComponent = createComponent({
              componentName: foundComponent.jsName,
              attributes: elem.attributes,
              children: path.node.children,
            });
            path.replaceWith(newComponent);
          }
        },
      },
    },
  };
}

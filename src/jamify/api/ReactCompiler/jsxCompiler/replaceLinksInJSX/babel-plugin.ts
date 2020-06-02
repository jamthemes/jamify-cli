// TODO: Enable type checking and use "PluginItem"
// type to correctly type this module!
// @ts-nocheck
const { types: t } = require('@babel/core');

function createNewHrefAttribute({
  allAttributes,
  hrefAttributeValue,
  newLinkAttrIdentifier,
}) {
  let newAttributes = allAttributes;
  // Remove "href"
  newAttributes = newAttributes.filter(
    (attribute) => attribute.name.name !== 'href',
  );
  // Set "to" to value of "href"
  const newLinkAttr = t.jsxAttribute(newLinkAttrIdentifier, hrefAttributeValue);
  newAttributes = newAttributes.concat(newLinkAttr);
  return newAttributes;
}

function createNewLinkElement({
  hrefPropName,
  newComponentName,
  elem,
  transformUrl,
  children,
}) {
  let allAttributes = elem.attributes;
  const cmpIndentifier = t.jsxIdentifier(newComponentName);
  const newLinkAttrIdentifier = t.jsxIdentifier(hrefPropName);
  const hrefAttr = allAttributes.find((attr) => attr.name.name === 'href');

  if (hrefAttr && t.isStringLiteral(hrefAttr.value)) {
    if (hrefAttr.value && hrefAttr.value.value) {
      const transformedHrefValue = transformUrl(hrefAttr.value.value);
      // If this function returns a falsy value, it means this a
      // tag should not be transformed
      if (!transformedHrefValue) return;
      allAttributes = createNewHrefAttribute({
        allAttributes,
        hrefAttributeValue: t.stringLiteral(transformedHrefValue),
        newLinkAttrIdentifier,
      });
    }
  }

  if (hrefAttr && t.isJSXExpressionContainer(hrefAttr.value)) {
    allAttributes = createNewHrefAttribute({
      allAttributes,
      hrefAttributeValue: hrefAttr.value,
      newLinkAttrIdentifier,
    });
  }

  const opening = t.jsxOpeningElement(cmpIndentifier, allAttributes, false);
  const closing = t.jsxClosingElement(cmpIndentifier);
  const element = t.jsxElement(opening, closing, children, true);
  return element;
}

export default function (_ref) {
  return {
    visitor: {
      JSXElement: {
        enter(path, state) {
          const { hrefPropName, newComponentName, transformUrl } = state.opts;
          const elem = path.node.openingElement;
          const cmpName = elem.name.name;
          if (cmpName === 'a') {
            const hrefAttr = elem.attributes.find(
              (attr) => attr.name.name === 'href',
            );

            if (hrefAttr) {
              if (!hrefAttr.value) {
                hrefAttr.value = t.stringLiteral('#');
                return;
              }
              let transformedHrefValue = undefined;

              if (t.isStringLiteral(hrefAttr.value)) {
                const hrefValue = hrefAttr.value.value;
                transformedHrefValue = transformUrl(hrefValue);
              }

              if (
                t.isJSXExpressionContainer(hrefAttr.value) ||
                transformedHrefValue
              ) {
                const newJsxElement = createNewLinkElement({
                  hrefPropName,
                  newComponentName,
                  elem,
                  transformUrl,
                  children: path.node.children,
                });
                path.replaceWith(newJsxElement);
              }
            }
          }
        },
      },
    },
  };
}

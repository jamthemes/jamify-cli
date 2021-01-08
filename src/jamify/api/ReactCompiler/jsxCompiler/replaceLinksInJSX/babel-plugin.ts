// TODO: Enable type checking and use "PluginItem"
// type to correctly type this module!
const { types: t } = require('@babel/core');

function createNewLinkElement({
  renderLink,
  elem,
  transformUrl,
  children,
}: any) {
  let allAttributes = elem.attributes;
  const hrefAttr = allAttributes.find((attr: any) => attr.name.name === 'href');
  let hrefVal;

  if (hrefAttr && t.isStringLiteral(hrefAttr.value)) {
    if (hrefAttr.value && hrefAttr.value.value) {
      const transformedHrefValue = transformUrl(hrefAttr.value.value);
      // If this function returns a falsy value, it means this a
      // tag should not be transformed
      if (!transformedHrefValue) return;
      hrefVal = t.stringLiteral(transformedHrefValue);
    }
  }

  if (hrefAttr && t.isJSXExpressionContainer(hrefAttr.value)) {
    hrefVal = hrefAttr.value;
  }

  const restAttributes = allAttributes.filter(
    (attribute: any) => attribute.name.name !== 'href',
  );

  return renderLink({
    href: hrefVal,
    children,
    restAttributes,
  });
}

export default function (_ref: any) {
  return {
    visitor: {
      JSXElement: {
        enter(path: any, state: any) {
          const { renderLink, transformUrl } = state.opts;
          const elem = path.node.openingElement;
          const cmpName = elem.name.name;
          if (cmpName === 'a') {
            const hrefAttr = elem.attributes.find(
              (attr: any) => attr.name.name === 'href',
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
                  renderLink,
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

// TODO: Enable type checking and use "PluginItem"
// type to correctly type this module!
// @ts-nocheck
import { types as t } from '@babel/core';

/**
 * Return an array of imported image
 * assets
 */
export let result = {
  importedAssets: [],
};

function addAsset(newAsset) {
  const isAlreadyIn = result.importedAssets.find(
    (asset) => asset.path === newAsset.path,
  );
  if (!isAlreadyIn) {
    result.importedAssets.push(newAsset);
  }
}

/**
 * Specify a list of attributenames
 * which are an img src / src set.
 * If those attributes are present
 * on the specified element,
 * the values are replaced.
 */
function findAndReplaceImgSrcValues({
  attributes = [
    { name: '', type: 'src' },
    { name: '', type: 'srcset' },
  ],
  elem,
  assets,
}) {
  for (const maybeAttribute of attributes) {
    const foundAttr = elem.attributes.find(
      (attr) => attr.name.name === maybeAttribute.name,
    );
    if (foundAttr && foundAttr.value && foundAttr.value.value) {
      if (maybeAttribute.type === 'src') {
        // const newSrcAttrIdentifier = t.jsxIdentifier('src');
        const foundImg = assets.find(
          (img) => img.originalUrl === foundAttr.value.value,
        );
        if (foundImg) {
          const srcValueLiteral = t.jsxExpressionContainer(
            t.identifier(foundImg.importIdentifier),
          );
          foundAttr.value = srcValueLiteral;
          addAsset(foundImg);
        }
      }
      if (maybeAttribute.type === 'srcset') {
        const allImages = foundAttr.value.value.split(',').map((s) => s.trim());

        const allLiterals = allImages
          .map((img, idx, arr) => {
            const [imgSrc, size] = img.split(' ');
            const foundImg = assets.find((img) => img.originalUrl === imgSrc);
            if (!foundImg) return null;
            addAsset(foundImg);
            const suffix = idx !== arr.length - 1 ? ', ' : '';
            return [
              [
                idx === 0 ? t.templateElement({ raw: '' }) : undefined,
                t.templateElement({ raw: ` ${size}${suffix}` }),
              ].filter(Boolean),
              [t.identifier(foundImg.importIdentifier)],
            ];
          })
          .filter(Boolean);
        const allTemplateElements = allLiterals.map((arr) => arr[0]).flat();
        const allTemplateExpressions = allLiterals.map((arr) => arr[1]).flat();
        const quasisDiff =
          allTemplateElements.length - allTemplateExpressions.length;
        if (quasisDiff >= 1 && allLiterals.length > 0) {
          foundAttr.value = t.jsxExpressionContainer(
            t.templateLiteral(allTemplateElements, allTemplateExpressions),
          );
        }
      }
    }
  }
}

/**
 * Do not run this parallel!
 */
export default function BabelPlugin() {
  // Reset result
  result = {
    importedAssets: [],
  };
  return {
    visitor: {
      JSXElement: {
        enter(path, state) {
          const { assets, componentRegistry, useJsName } = state.opts;
          // if useJsName is set to true,
          // components were already transpiled
          // meaning that their names are already
          // in camel case
          const elem = path.node.openingElement;
          const cmpName = elem.name.name;
          const foundComponent = useJsName
            ? componentRegistry.findComponentByJsName(cmpName)
            : componentRegistry.findComponentByName(cmpName);
          let attributesToCheck = [];

          if (cmpName === 'img') {
            attributesToCheck = [
              { name: 'src', type: 'src' },
              { name: 'srcset', type: 'srcset' },
            ];
          }

          if (foundComponent) {
            attributesToCheck = foundComponent.publicProperties
              .map((publicProp) => {
                let type = null;
                if (publicProp.originalAttributeName === 'src') {
                  type = 'src';
                }
                if (publicProp.originalAttributeName === 'srcset') {
                  type = 'srcset';
                }
                if (type) {
                  return {
                    type,
                    name: useJsName ? publicProp.jsName : publicProp.name,
                  };
                }
              })
              .filter(Boolean);
          }

          if (attributesToCheck.length > 0) {
            findAndReplaceImgSrcValues({
              attributes: attributesToCheck,
              elem,
              assets,
            });
          }
        },
      },
    },
  };
}

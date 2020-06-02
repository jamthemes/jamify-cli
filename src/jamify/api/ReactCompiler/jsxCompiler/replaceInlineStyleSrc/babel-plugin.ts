// TODO: Enable type checking and use "PluginItem"
// type to correctly type this module!
// @ts-nocheck
const { types: t } = require('@babel/core');
const { containsUrl, isUrlAbsolute } = require('../../../../util/url');

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

const stringLiteralVisitor = {
  StringLiteral(path) {
    const assets = this.assets;
    const { value } = path.node;

    const isUrl = containsUrl(value);
    const isRelative = !isUrlAbsolute(value);

    // Removes url(...) to get the raw path string
    const rawUrl = value.slice(4, value.length - 1); //TODO: solve this in a better way
    const matchingAssetForUrl = assets.find(
      (asset) => asset.originalUrl === rawUrl,
    );

    if (isUrl && isRelative && matchingAssetForUrl) {
      const webpackImportString = t.templateLiteral(
        [t.templateElement({ raw: 'url(' }), t.templateElement({ raw: ')' })],
        [t.identifier(matchingAssetForUrl.importIdentifier)],
      );

      addAsset(matchingAssetForUrl);

      path.replaceWith(webpackImportString);
    }
  },
};

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
      JSXAttribute: {
        enter(path, state) {
          const { assets } = state.opts;
          if (t.isJSXIdentifier(path.node.name, { name: 'style' })) {
            path.traverse(stringLiteralVisitor, { assets });
          }
        },
      },
    },
  };
}

const { types: t } = require('@babel/core');

function processNode(node) {
  if (node.operator !== 'typeof') {
    return;
  }

  const name = node.argument.name;
  const replaceIdentifiers = ['module', 'define', 'exports'];
  if (replaceIdentifiers.includes(name)) {
    node.argument = t.identifier('undefined');
  }
}

/**
 * Makes sure that typeof module|define|exports
 * yields undefined
 */
function BabelPlugin() {
  return {
    visitor: {
      BinaryExpression(path) {
        const { node } = path;
        [node.left, node.right].forEach(processNode);
      },
    },
  };
}

module.exports = BabelPlugin;

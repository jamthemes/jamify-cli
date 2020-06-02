const { types: t } = require('@babel/core');

/**
 * Binds global vars explicitly to window.
 * E.g. top level `var varname = 1` becomes
 * `window.varname = 1`
 * of `function x() {}` becomes `window.x = function x() {}`
 */
function BabelPlugin() {
  return {
    visitor: {
      FunctionDeclaration(path) {
        const { node, parent } = path;
        if (parent.type === 'Program') {
          path.replaceWithMultiple([
            t.assignmentExpression(
              '=',
              t.memberExpression(
                t.identifier('window'),
                t.identifier(node.id.name),
              ),
              t.functionExpression(
                node.id,
                node.params,
                node.body,
                node.generator,
                node.async,
              ),
            ),
            t.identifier(';'),
          ]);
        }
      },
      VariableDeclaration(path) {
        const { node, parent } = path;
        if (parent.type === 'Program' && node.kind === 'var') {
          const allReplacingExpressions = node.declarations
            .map(declaration => {
              return [
                t.assignmentExpression(
                  '=',
                  t.memberExpression(
                    t.identifier('window'),
                    t.identifier(declaration.id.name),
                  ),
                  declaration.init || t.identifier('undefined'),
                ),
                t.identifier(';'),
              ];
            })
            .filter(Boolean);
          path.replaceWithMultiple(allReplacingExpressions.flat());
        }
      },
    },
  };
}

module.exports = BabelPlugin;

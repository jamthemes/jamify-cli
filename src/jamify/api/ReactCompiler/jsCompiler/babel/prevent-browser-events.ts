import {
  types as t,
  template,
  PluginItem,
  // Visitor,
} from '@babel/core';

export interface BabelPreventBrowserEventsPluginOptions {
  /** Events to prevent */
  events: string[];
}

interface CreateEventWrapperFnParams {
  EVENT_NAME: any;
  EVENT_HANDLER: any;
}

function createEventWrapperFn({
  EVENT_NAME,
  EVENT_HANDLER,
}: CreateEventWrapperFnParams) {
  const buildEventWrapperFn = template(`
                function eventInterceptor(e) {
                  if (window.shouldPreventEvent(EVENT_NAME)) {
                    return;
                  } else {
                    const fn = EVENT_HANDLER;
                    fn(e);
                  }
                }
              `);
  return buildEventWrapperFn({
    EVENT_NAME,
    EVENT_HANDLER,
  });
}

/**
 * Prevents browser events like
 * 'load' or 'domcontentloaded'
 * to be fired. Can be turned
 * on/off.
 * Wraps all event listener functions
 * into a custom function which then
 * acts like a 'gate'.
 */
function BabelPlugin() {
  const plugin: PluginItem = {
    visitor: {
      /**
       * Replace document.readyState with
       * window.getDocumentReadyState();
       */
      MemberExpression(path) {
        const { node, parent } = path;
        const objName = (node.object as any).name;
        const propName = node.property.name;

        if (t.isAssignmentExpression(parent)) {
          return;
        }

        if (t.isCallExpression(parent)) {
          const isCallee = parent.callee === node;
          if (isCallee) return;
        }

        if (propName === 'readyState' && typeof objName === 'string') {
          const customReadyStateFn = t.callExpression(
            t.memberExpression(
              t.identifier('window'),
              t.identifier('getDocumentReadyState'),
            ),
            // Pass in original object,
            // so 'getDocumentReadyState' can
            // determine if it actually was
            // requested from the 'document'
            // object. Because if the object
            // (node.object) is not a
            // the document object, just return
            // the original value.
            // It is too hard to determine
            // if the current variable
            // value is of type document. At least
            // I struggeled to find a way
            // to do it with the AST in a
            // reliable way.
            [t.identifier(objName)],
          );
          path.replaceWith(customReadyStateFn);
        }
      },
      AssignmentExpression(
        path,
        {
          opts = {
            events: ['load', 'DOMContentLoaded', 'readystate'],
          },
        },
      ) {
        const {
          events: eventsToPrevent,
        } = opts as BabelPreventBrowserEventsPluginOptions;
        const { node } = path;

        if (node.operator === '=' && t.isMemberExpression(node.left)) {
          const eventsToPreventWithFnNames = eventsToPrevent.map((evName) => ({
            fnName: `on${evName.toLocaleLowerCase()}`,
            evName,
          }));

          function shouldIntercept(fnName: string, objName: string) {
            return (
              objName &&
              eventsToPreventWithFnNames
                .map((obj) => obj.fnName)
                .includes(fnName)
            );
          }

          const objName = (node.left as any).object.name;
          const fnName = (node.left as any).property.name;

          if (t.isFunction(node.right)) {
            if (shouldIntercept(fnName, objName)) {
              const associatedEventName = eventsToPreventWithFnNames.find(
                (ev) => ev.fnName === fnName,
              );
              if (associatedEventName) {
                node.right = createEventWrapperFn({
                  EVENT_HANDLER: node.right,
                  EVENT_NAME: t.stringLiteral(associatedEventName.evName),
                }) as any;
              }
            }
          }
        }
      },
      CallExpression(
        path,
        {
          opts = {
            events: ['load', 'DOMContentLoaded', 'readystate'],
          },
        },
      ) {
        const { events: eventsToPrevent } = opts;
        const { node } = path;

        function shouldIntercept(
          fnName: string,
          objName: string,
          evName: string,
        ) {
          return (
            fnName === 'addEventListener' &&
            objName &&
            eventsToPrevent.includes(evName)
          );
        }

        if (t.isMemberExpression(node.callee)) {
          const memberExpression = node.callee;
          const objName = (memberExpression.object as any).name;
          const fnName = memberExpression.property.name;
          // const [evName, evHandler] = node.arguments;
          if (
            t.isStringLiteral(node.arguments[0]) &&
            (t.isArrowFunctionExpression(node.arguments[1]) ||
              t.isFunctionExpression(node.arguments[1]))
          ) {
            const evName = node.arguments[0];
            const evHandler = node.arguments[1];
            const evNameValue = evName.value;
            if (shouldIntercept(fnName, objName, evNameValue)) {
              node.arguments = [
                evName,
                createEventWrapperFn({
                  EVENT_NAME: evName,
                  EVENT_HANDLER: evHandler,
                }) as any,
              ];
            }
          }
        }
      },
    },
  };
  return plugin;
}
export default BabelPlugin;

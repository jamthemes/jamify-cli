import ComponentRegistry from '.';

let currentContext: ComponentRegistry | null = null;

/**
 * Use the context in all those utility function in order to access the current component
 * registry without needing to pass it down too many times. Sort of a small state
 * management without having to use classes everywhere
 */
export default function getContext(): ComponentRegistry {
  if (currentContext === null) {
    throw new Error('Tried to access context before it was created.');
  }
  return currentContext;
}

export function setContext(componentRegistry: ComponentRegistry) {
  currentContext = componentRegistry;
}

export function camelize(str: string) {
  const camelized = str.replace(/\W+(.)/g, (_: any, char: string) => {
    return char.toUpperCase();
  });
  const capitalized = `${camelized[0].toUpperCase()}${camelized.slice(1)}`;
  return capitalized;
}

export const regexFriendly = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function replaceAll(str: string, what: string, withThat: string) {
  7;
  return str.split(what).join(withThat);
}

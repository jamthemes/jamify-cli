/**
 * Get HTML attributes as POJO
 */
export function attributes(elem: Element): { [attrName: string]: string } {
  return Array.from(elem.attributes).reduce((obj, attr) => {
    return {
      ...obj,
      [attr.name]: attr.value,
    };
  }, {});
}

export function toCamelCase(sentenceCase: string) {
  let out = '';
  const splitted = sentenceCase.split(/[^a-zA-Z0-9]/).filter(Boolean);
  splitted.forEach(function(el, idx) {
    var add = el.toLowerCase();
    out += idx === 0 ? add : add[0].toUpperCase() + add.slice(1);
  });
  return out;
}

interface GenerateIdentifierNameOptions {
  input: string;
  /**
   * If true, separate identifier
   * parts using this identifier.
   * If not defined, camelCase
   * is used
   */
  useSeparator?: string;
}

/**
 * Tries to generate an identifier
 * out of any string
 */
export function generateIdentifierName({
  input,
  useSeparator,
}: GenerateIdentifierNameOptions) {
  let out = '';
  const splitted = input.split(/[^a-zA-Z0-9]/).filter(Boolean);
  splitted.forEach(function(el, idx) {
    const add = el.toLowerCase();
    const str1 = useSeparator ? useSeparator : add[0].toUpperCase();
    const str2 = useSeparator ? add : add.slice(1);
    out += idx === 0 ? add : str1 + str2;
  });
  return out;
}

/**
 * Makes sure the passed in string
 * conforms to the JS variable naming
 * rules
 */
export function validateJsIndentifier(anyString: string) {
  const isInt = !isNaN(parseInt(anyString.charAt(0)));
  const alphanumeric = anyString.replace(new RegExp(/[^a-zA-Z0-9_]/, 'g'), '');
  return isInt ? `s${alphanumeric}` : alphanumeric;
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
 * Tries to generate a
 * meaningful identifier
 * out of any string
 */
export function generateJsIdentifier({
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
  return validateJsIndentifier(out);
}

interface CreateUnusedIdentifierOptions {
  /**
   * Array of already used
   * indentifiers
   */
  usedIdentifiers: string[];
  /**
   * Original identifier
   */
  identifier: string;
}

/**
 * Given an array of already
 * used indentifiers within
 * some JS code and a new
 * identifier one wants to add
 * to that code, a new identifier
 * name is created if that one
 * is already used.
 * Prevents variable name
 * collision.
 */
export function getUnusedIdentifier({
  usedIdentifiers,
  identifier,
}: CreateUnusedIdentifierOptions): string {
  if (usedIdentifiers.includes(identifier)) {
    const lastChar = identifier.charAt(identifier.length - 1);
    let idNum = parseInt(lastChar);
    const isNumNan = isNaN(idNum);
    if (isNumNan) {
      idNum = 0;
    } else {
      idNum = idNum + 1;
    }
    let newIdentifier = `${identifier.slice(
      0,
      isNumNan ? identifier.length : identifier.length - 1,
    )}${idNum}`;
    return getUnusedIdentifier({ usedIdentifiers, identifier: newIdentifier });
  }
  return identifier;
}

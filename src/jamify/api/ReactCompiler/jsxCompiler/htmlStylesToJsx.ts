const { StyleParser } = require('./html2jsx');

export default function htmlStylesToJsx(styles: string) {
  const parser = new StyleParser(styles);
  const jsxObjStr = parser.toJSXString();
  return `{${jsxObjStr}}`;
}

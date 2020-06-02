const { HTMLtoJSX } = require('./html2jsx');

export default function convertToJSX(htmlStr: string): string {
  const jsxConverter = new (HTMLtoJSX as any)({
    createClass: false,
  });
  const convertedJsx = jsxConverter.convert(htmlStr, {
    omitHTMLWrapper: true,
  });
  return convertedJsx;
}

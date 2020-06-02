import * as babel from '@babel/core';
import transformLinksPlugin from './babel-plugin';
const pluginSyntaxJsx = require('@babel/plugin-syntax-jsx');

interface ReplaceLinksInJSXParams {
  jsxStr: string;
  /** e.g. "Link" */
  newComponentName: string;
  /** Name of property which will#
   * get the href attribute,
   * e.g 'to'
   */
  hrefPropName: string;
  /**
   * Function to transform
   * the original href value into
   * another value. If null is returned,
   * the <a> tag is *NOT* replaced.
   */
  transformUrl: (oldUrl: string) => string | null;
}

/**
 * Looks for <a> tags and replaces them
 * with the specified React Component
 */
export default async function replaceLinksInJSX({
  jsxStr,
  ...pluginOptions
}: ReplaceLinksInJSXParams) {
  const res = await babel.transformAsync(jsxStr, {
    plugins: [pluginSyntaxJsx, [transformLinksPlugin, pluginOptions]],
  });
  return res ? res.code || '' : '';
}

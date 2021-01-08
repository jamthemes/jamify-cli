import * as babel from '@babel/core';
import { RenderLinkFn } from '../../../../util/types';
import transformLinksPlugin from './babel-plugin';
const pluginSyntaxJsx = require('@babel/plugin-syntax-jsx');

interface ReplaceLinksInJSXParams {
  jsxStr: string;
  renderLink: RenderLinkFn;
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

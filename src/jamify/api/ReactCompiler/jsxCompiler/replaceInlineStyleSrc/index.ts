import * as babel from '@babel/core';
import { ImportedPageAsset } from '../createImports';
import pluginReplaceInlineStyleSrc, { result } from './babel-plugin';

const pluginSyntaxJsx = require('@babel/plugin-syntax-jsx');

interface Params {
  jsxStr: string;
  assets: ImportedPageAsset[];
}

interface Result {
  /**
   * Assets which were actually used
   */
  importedAssets: ImportedPageAsset[];
  newJsx: string;
}

export default async function replaceInlineStyleSrc({
  jsxStr,
  ...pluginOptions
}: Params): Promise<Result> {
  const res = await babel.transformAsync(jsxStr, {
    plugins: [pluginSyntaxJsx, [pluginReplaceInlineStyleSrc, pluginOptions]],
  });
  const newJsx = res ? res.code || '' : '';
  return {
    newJsx,
    ...result,
  };
}

import * as babel from '@babel/core';
import { ImportedPageAsset } from '../createImports';
import pluginReplaceImgSrc, { result } from './babel-plugin';
import ComponentRegistry from '../../../ComponentRegistry';

const pluginSyntaxJsx = require('@babel/plugin-syntax-jsx');

interface Params {
  jsxStr: string;
  assets: ImportedPageAsset[];
  componentRegistry: ComponentRegistry;
  useJsName?: boolean;
}

interface Result {
  /**
   * Assets which were actually used
   */
  importedAssets: ImportedPageAsset[];
  newJsx: string;
}

export default async function replaceImgSrc({
  jsxStr,
  ...pluginOptions
}: Params): Promise<Result> {
  const res = await babel.transformAsync(jsxStr, {
    plugins: [pluginSyntaxJsx, [pluginReplaceImgSrc, pluginOptions]],
  });
  const newJsx = res ? res.code || '' : '';
  return {
    newJsx,
    ...result,
  };
}

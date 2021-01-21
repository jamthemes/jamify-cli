import * as babel from '@babel/core';
import preventUmdPlugin from './babel/plugin-prevent-umd';

/**
 * Makes sure that UMD modules are always
 * mounted on the window object,
 * this way they can be directly imported
 */
export default async function preventUmdForJsFile(jsString: string) {
  const res = await babel.transformAsync(jsString, {
    plugins: [preventUmdPlugin],
    sourceType: 'unambiguous',
  });
  return res ? res.code || '' : '';
}

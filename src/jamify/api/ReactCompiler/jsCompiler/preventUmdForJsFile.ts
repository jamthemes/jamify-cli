import * as babel from '@babel/core';
import transformLinksPlugin from './babel/plugin-prevent-umd';

/**
 * Makes sure that UMD modules are always
 * mounted on the window object,
 * this way they can be directly imported
 * in GatsbyJS
 */
export default async function preventUmdForJsFile(jsString: string) {
  const res = await babel.transformAsync(jsString, {
    plugins: [transformLinksPlugin],
    sourceType: 'unambiguous',
  });
  return res ? res.code || '' : '';
}

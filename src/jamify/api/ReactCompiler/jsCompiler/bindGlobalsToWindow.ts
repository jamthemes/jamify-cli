import * as babel from '@babel/core';
import bindGlobalsToWindowPlugin from './babel/bind-global-to-window';

/**
 * Makes sure that UMD modules are always
 * mounted on the window object,
 * this way they can be directly imported
 * in GatsbyJS
 */
export default async function bindGlobalsToWindow(jsString: string) {
  const res = await babel.transformAsync(jsString, {
    plugins: [bindGlobalsToWindowPlugin],
    sourceType: 'unambiguous',
  });
  return res ? res.code || '' : '';
}

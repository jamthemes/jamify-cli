import path from 'path';
import preventUmdForJsFile from './preventUmdForJsFile';
import bindGlobalsToWindow from './bindGlobalsToWindow';
import enableBrowserLifecycleControl from './enableBrowserLifecycleControl';
import { PageAsset } from '../../../util/types';
import { fsReadFile, fsWriteFile } from '../../../util/fs';
import JamifyLogger from '../../jamify-logger';

interface JsCompilerParams {
  jsFileContent: string;
  jsFileSource: 'body' | 'head';
}

// type GenericJsCompiler = (options: JsCompilerParams) => Promise<string>;

function wrapScriptInFunction(js: string) {
  const resultingFileContent = `
    var exportedFn = function() {
      ${js}
    }

    exportedFn = typeof window !== 'undefined' ? exportedFn.bind(window) : exportedFn;

    module.exports = exportedFn;
  `;
  return resultingFileContent;
}

function onlyExecuteIfWindowDefined(js: string) {
  return `
  if (typeof window !== 'undefined') {
    ${js}
  }
`;
}

/**
 * When imported as module,
 * 'this' will point to the module,
 * but it needs to point to window.
 */
function bindToWindowAndExecute(js: string) {
  return `
  var exportedFn = function() {
    ${js}
  }

  exportedFn = typeof window !== 'undefined' ? exportedFn.bind(window) : exportedFn;

  exportedFn();
`;
}

/**
 *
 * Makes sure that UMD has no effect for all JS files;
 *
 * Wraps all scripts which were imported in the
 * pages body in an exported executable function;
 *
 * This function gets called by the AssetDownloader
 * before the JS files get saved to disk
 *
 */
async function compileJs({ jsFileContent, jsFileSource }: JsCompilerParams) {
  let finalFileContent = jsFileContent;
  finalFileContent = await bindGlobalsToWindow(finalFileContent);
  finalFileContent = await preventUmdForJsFile(finalFileContent);
  finalFileContent = await enableBrowserLifecycleControl(finalFileContent);

  finalFileContent = onlyExecuteIfWindowDefined(finalFileContent);

  // if (jsFileSource === 'body') {
  //   finalFileContent = wrapScriptInFunction(finalFileContent);
  // }

  // if (jsFileSource === 'head') {
  //   finalFileContent = bindToWindowAndExecute(finalFileContent);
  // }

  finalFileContent = wrapScriptInFunction(finalFileContent);

  return finalFileContent;
}

interface JamifyCompilerOptions {
  jsAssets: PageAsset[];
}

/**
 * Reads all JS assets,
 * compiles them, and
 * writes them back to disk
 */
export default async function compileJavascript({
  jsAssets,
}: JamifyCompilerOptions) {
  for (const asset of jsAssets) {
    try {
      const jsFileContent = (await fsReadFile(asset.path)).toString();
      const compiledContent = await compileJs({
        jsFileContent,
        jsFileSource: asset.source!,
      });
      await fsWriteFile(asset.path, compiledContent);
    } catch {
      JamifyLogger.log(
        'warning',
        `Error while compiling JS file "${path.basename(
          asset.path,
        )}". It's likely that this file contains invalid JS. It is excluded from the project.`,
      );
    }
  }
}

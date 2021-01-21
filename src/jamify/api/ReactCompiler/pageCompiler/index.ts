import path from 'path';
import { CollectedPage, SsgConfiguration } from '../../../util/types';
import convertToJSX from '../jsxCompiler/convertToJSX';
import AssetRegistry from '../../AssetRegistry';
import createImports from '../jsxCompiler/createImports';
// import replaceImgSrc from '../jsxCompiler/replaceImgSrc';
// import replaceInlineStyleSrc from '../jsxCompiler/replaceInlineStyleSrc';
import createReactPageComponent from './createReactPageComponent';
import {
  htmlAttributesToJsx,
  urlToReactComponentName,
} from '../../../util/compilation/react';
import { fsWriteFile, fsExists, fsMkDir } from '../../../util/fs';
import replaceHtmlComponentsInJsx from '../jsxCompiler/replaceHtmlComponentsInJSX';
import ComponentRegistry from '../../ComponentRegistry';
import { removeTrailingSemicolon } from '../jsxCompiler/util';
import { replaceAllLinksWithReactComponents } from '../jsxCompiler/replaceLinksInJSX';
import UrlResolver from '../UrlResolver';
import JamifyLogger from '../../jamify-logger';

interface CompilePageOptions {
  page: CollectedPage;
  startPageUrl: string;
  assetRegistry: AssetRegistry;
  componentRegistry: ComponentRegistry;
  pagesOutFolder: string;
  /**
   * Absolute path of statikk
   * compat layer js file
   */
  compatLayerPath: string;
  urlResolver: UrlResolver;
  ssgConfiguration: SsgConfiguration;
}

/**
 * Compile a collected page
 * to a React page with all
 * needed imports.
 * Creates a JSX file at
 * the specified folder path.
 */
export default async function compilePage({
  page,
  assetRegistry,
  pagesOutFolder,
  compatLayerPath,
  componentRegistry,
  startPageUrl,
  urlResolver,
  ssgConfiguration,
}: CompilePageOptions) {
  const { pageComponentName, pageFilePath } = urlToReactComponentName(page.url);

  const fullFilePath = path.join(pagesOutFolder, pageFilePath);

  const pageFullDirName = path.dirname(fullFilePath);
  if (!(await fsExists(pageFullDirName))) {
    await fsMkDir(pageFullDirName, { recursive: true });
  }

  // Convert html -> JSX
  let jsx = convertToJSX(page.htmlDocument.body?.innerHTML || '');

  // replace links
  jsx = await replaceAllLinksWithReactComponents(
    jsx,
    page.url,
    urlResolver,
    ssgConfiguration.renderLink,
  );

  // --> RIGHT NOW images are loaded directly from the SSG's static folder
  // TODO: Evaluate if loading images inline with 'imports' can
  // be beneficial for some SSGs. If so, the below code can be used.

  // Replace and import image assets
  // const htmlImageImports = createImports({
  //   assets: assetRegistry.getPageAssets({
  //     type: 'HtmlImage',
  //   }),
  //   pageFolder: pageFullDirName,
  //   pagesOutFolder,
  // });
  // const cssImageImports = createImports({
  //   assets: assetRegistry.getPageAssets({
  //     type: 'CssImage',
  //   }),
  //   pageFolder: pageFullDirName,
  //   pagesOutFolder,
  // });
  // const allImageImports = [...htmlImageImports, ...cssImageImports];

  // const {
  //   newJsx: jsxReplacedHtmlImages,
  //   importedAssets: htmlImportedAssets,
  // } = await replaceImgSrc({
  //   jsxStr: jsx,
  //   assets: allImageImports,
  //   componentRegistry,
  // });

  // jsx = jsxReplacedHtmlImages;

  // const {
  //   newJsx: jsxReplacedCssImages,
  //   importedAssets: cssImportedAssets,
  // } = await replaceInlineStyleSrc({
  //   jsxStr: jsx,
  //   assets: allImageImports,
  // });
  // jsx = jsxReplacedCssImages;
  // Replace and import components
  const {
    newJsx: jsxWithComponents,
    importedComponents,
  } = await replaceHtmlComponentsInJsx({
    jsxStr: jsx,
    componentRegistry,
    urlResolver,
    currentPageUrl: page.url,
  });
  jsx = jsxWithComponents;

  jsx = removeTrailingSemicolon(jsx);

  // Correctly create and group imports
  const scriptImports = createImports({
    assets: page.assets.filter((asset) => asset.type === 'HtmlScript'),
    pagesOutFolder,
    pageFolder: pageFullDirName,
  });
  const identifierImports = [
    // ...htmlImportedAssets,
    // ...cssImportedAssets,
    ...scriptImports,
  ];
  let allImportedPaths = identifierImports.map(
    (importedAsset) => importedAsset.path,
  );

  // CSS Imports for the HEAD
  const cssAssets = page.assets.filter((asset) => asset.type === 'HtmlStyle');
  const cssLinks = cssAssets
    .map((asset) => `<link rel="stylesheet" href="${asset.rootRelativeUrl}" />`)
    .join('\n');

  allImportedPaths = [
    ...allImportedPaths,
    ...cssAssets.map((asset) => asset.path),
  ];

  // Remaining, non-imported assets
  // WAS used for CSS but now CSS is loaded
  // from the static folder
  let nonIdentifierImports = createImports({
    assets: page.assets.filter(
      (asset) => !allImportedPaths.includes(asset.path),
    ),
    pageFolder: pageFullDirName,
    pagesOutFolder,
  });
  nonIdentifierImports = [];

  const compatLayerRelativePath = path
    .relative(pageFullDirName, compatLayerPath)
    .replace(new RegExp('\\\\', 'g'), '/');

  const reactComponentsToImport = importedComponents.map((cmp) => cmp.jsName);

  // Create Head JSX
  jsx = `
      <>
        ${ssgConfiguration.createPageHead({
          page,
          convertToJSX,
          htmlAttributesToJsx,
          children: cssLinks,
        })}
        ${jsx}
      </>
    `;

  // Build a page React component
  const componentContent = createReactPageComponent({
    jsx,
    identifierImports,
    nonIdentifierImports,
    reactComponentName: pageComponentName,
    compatLayerRelativePath,
    reactComponentsToImport,
    ssgSpecificImports: ssgConfiguration.globalPageImports,
  });

  await fsWriteFile(fullFilePath, componentContent);
}

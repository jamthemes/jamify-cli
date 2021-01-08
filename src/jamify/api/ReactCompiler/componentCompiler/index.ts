import AssetRegistry from '../../AssetRegistry';
import ComponentRegistry from '../../ComponentRegistry';
import { HtmlComponent } from '../../../util/types/htmlComponent';
import htmlComponentToReact from './htmlComponentToReact';
import createImports from '../jsxCompiler/createImports';
import replaceImgSrc from '../jsxCompiler/replaceImgSrc';
import { removeTrailingSemicolon } from '../jsxCompiler/util';
import replaceInlineStyleSrc from '../jsxCompiler/replaceInlineStyleSrc';
import { replaceAllLinksWithReactComponents } from '../jsxCompiler/replaceLinksInJSX';
import UrlResolver from '../UrlResolver';
import { SsgConfiguration } from '../../../util/types';

interface CompileHtmlComponentToReactOptions {
  component: HtmlComponent;
  assetRegistry: AssetRegistry;
  componentRegistry: ComponentRegistry;
  componentsOutFolder: string;
  /** Needed to resolve URLs */
  pageUrl: string;
  urlResolver: UrlResolver;
  ssgConfiguration: SsgConfiguration;
}

export default async function compileHtmlComponentToReact({
  component,
  assetRegistry,
  componentRegistry,
  componentsOutFolder,
  pageUrl,
  urlResolver,
  ssgConfiguration,
}: CompileHtmlComponentToReactOptions) {
  const htmlImageImports = createImports({
    assets: assetRegistry.getPageAssets({
      type: 'HtmlImage',
    }),
    pagesOutFolder: componentsOutFolder,
  });

  const cssImageImports = createImports({
    assets: assetRegistry.getPageAssets({
      type: 'CssImage',
    }),
    pagesOutFolder: componentsOutFolder,
  });

  const allImageImports = [...cssImageImports, ...htmlImageImports];

  async function transformJsx(inJsx: string) {
    let newJsx = inJsx;

    // replace links
    newJsx = await replaceAllLinksWithReactComponents(
      newJsx,
      pageUrl,
      urlResolver,
      ssgConfiguration.renderLink,
    );

    // replace html images
    const {
      newJsx: jsxReplacedHtmlImages,
      importedAssets: htmlImportedAssets,
    } = await replaceImgSrc({
      jsxStr: newJsx,
      componentRegistry,
      assets: allImageImports,
      useJsName: true,
    });
    newJsx = jsxReplacedHtmlImages;

    // replace css images
    const {
      newJsx: replacedInlineStyleImagesJsx,
      importedAssets: cssImageImports,
    } = await replaceInlineStyleSrc({
      jsxStr: newJsx,
      assets: allImageImports,
    });
    newJsx = replacedInlineStyleImagesJsx;
    newJsx = removeTrailingSemicolon(newJsx);
    const importedAssets = [...htmlImportedAssets, ...cssImageImports];
    return { newJsx, importedAssets };
  }
  await htmlComponentToReact({
    component,
    componentRegistry,
    componentsOutFolder,
    transformJsx,
  });
}

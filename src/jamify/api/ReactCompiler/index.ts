import path from 'path';
import { URL } from 'url';
import AssetRegistry from '../AssetRegistry';
import ComponentRegistry from '../ComponentRegistry';
import compileJavascript from './jsCompiler';
import compilePage from './pageCompiler';
import { fsExists, fsCopyDir, fsMkDir } from '../../util/fs';
import compileHtmlComponentToReact from './componentCompiler';
import { getStaticDir } from '../../util/path';
import UrlResolver from './UrlResolver';
import JamifyLogger from '../jamify-logger';
import SsgProjectCreator from '../SsgProjectCreator';

interface ReactCompilerOptions {
  /**
   * Project out folder.
   * Will create components
   * folder under outFolder/src/components
   * and pages folder under outFolder/src/pages
   */
  outFolder: string;
  startPageUrl: string;
  assetRegistry: AssetRegistry;
  componentRegistry: ComponentRegistry;
  ssgProjectCreator: SsgProjectCreator;
}

/**
 * Transforms pages and html-components
 * into JSX files with correct imports
 */
export default class ReactCompiler {
  private options: ReactCompilerOptions;
  private pagesOutFolder: string = '';
  private componentsOutFolder: string = '';
  private urlResolver: UrlResolver;

  constructor(options: ReactCompilerOptions) {
    this.options = options;
    const allUrls = this.urlsToAbsolute();
    JamifyLogger.log(
      'info',
      `Converting the following sites: ${allUrls.join(' | ')}`,
    );
    this.urlResolver = new UrlResolver(allUrls);
    this.createPaths();
  }

  /**
   * Convert root relative URLs
   * from assetgraph to absolute URLs
   * based on startePageUrl
   */
  private urlsToAbsolute() {
    const urlObj = new URL(this.options.startPageUrl);
    const allUrls = this.options.assetRegistry.getPages().map((page) => {
      const currUrlObj = new URL(page.url, urlObj.origin);
      const absoluteUrl = currUrlObj.href;
      page.url = absoluteUrl;
      return absoluteUrl;
    });
    return allUrls;
  }

  /**
   * Create out folders
   */
  private createPaths() {
    this.pagesOutFolder = path.join(
      this.options.outFolder,
      this.options.ssgProjectCreator.configuration.srcFolder,
      'pages',
    );
    this.componentsOutFolder = path.join(
      this.options.outFolder,
      this.options.ssgProjectCreator.configuration.srcFolder,
      'components',
    );
  }

  public async compile() {
    await this.compileGlobalAssets();
    await this.compilePages();
    await this.compileComponents();
    await this.copyCompatLayer();
  }

  /**
   * Runtime compat layer needed
   * for client side hydrated
   * SSG frameworks.
   */
  public async copyCompatLayer() {
    const PATH_TO_TEMPLATE_UTIL = path.join(getStaticDir(), 'template-util');
    await fsCopyDir(
      PATH_TO_TEMPLATE_UTIL,
      path.join(
        this.options.outFolder,
        this.options.ssgProjectCreator.configuration.srcFolder,
        'util',
      ),
    );
  }

  /**
   * Compile page global assets like JS.
   * Needs only to be done once.
   * Currently, compiles JS
   * files in a format so that
   * they are usable in React apps
   */
  private async compileGlobalAssets() {
    const pageGlobalJsAssets = this.options.assetRegistry.getPageAssets({
      type: 'HtmlScript',
    });
    await compileJavascript({ jsAssets: pageGlobalJsAssets });
  }

  private async compileComponents() {
    if (!(await fsExists(this.componentsOutFolder))) {
      await fsMkDir(this.componentsOutFolder, { recursive: true });
    }

    for (const component of this.options.componentRegistry.getComponents()) {
      await compileHtmlComponentToReact({
        component,
        componentRegistry: this.options.componentRegistry,
        componentsOutFolder: this.componentsOutFolder,
        assetRegistry: this.options.assetRegistry,
        pageUrl: this.options.startPageUrl,
        urlResolver: this.urlResolver,
        ssgConfiguration: this.options.ssgProjectCreator.configuration,
      });
    }
  }

  private async compilePages() {
    // Create pages out folder if it doesn't exist yet
    if (!(await fsExists(this.pagesOutFolder))) {
      await fsMkDir(this.pagesOutFolder, { recursive: true });
    }

    const compatLayerAbsolutePath = path.join(
      this.options.outFolder,
      this.options.ssgProjectCreator.configuration.srcFolder,
      'util/statikkCompatLayer.js',
    );

    const pages = this.options.assetRegistry.getPages();
    for (const page of pages) {
      await compilePage({
        page,
        assetRegistry: this.options.assetRegistry,
        pagesOutFolder: this.pagesOutFolder,
        componentRegistry: this.options.componentRegistry,
        compatLayerPath: compatLayerAbsolutePath,
        startPageUrl: this.options.startPageUrl,
        urlResolver: this.urlResolver,
        ssgConfiguration: this.options.ssgProjectCreator.configuration,
      });
    }
  }
}

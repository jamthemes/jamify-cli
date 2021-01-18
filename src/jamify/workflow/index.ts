import AssetRegistry from '../api/AssetRegistry';
import ComponentRegistry from '../api/ComponentRegistry';
import ReactCompiler from '../api/ReactCompiler';
import SsgProjectCreator from '../api/SsgProjectCreator';
import gastbySsgConfig from '../util/ssg-config/gatsby-config';
import nextSsgConfig from '../util/ssg-config/next-config';

process.on('uncaughtException', (e) => {
  console.log('uncaughtException', e);
});

process.on('unhandledRejection', (e) => {
  console.log('unhandledRejection', e);
});

export interface JamifyConverterOptions {
  /**
   * Instead of an URL, a folder
   * containing at least an index.html
   * file can be specified
   */
  sourceFolder?: string;
  /** URLs to convert.
   * If 'recursive' is true,
   * only one URL will be
   * converted
   */
  urls?: string[];
  /** Converted website will go here */
  outFolder: string;
  /** If this is set to true,
   * only the first url in the
   * urls array is used and
   * linked pages are followed
   * recursively
   */
  recursive?: boolean;
  /**
   * If true, finds recurring patterns
   * in the markup and tries to create
   * components out of it
   */
  componentize?: boolean;
  targetSsg: 'next' | 'gatsby';
}

export default class JamifyConverter {
  private options: JamifyConverterOptions;

  constructor(options: JamifyConverterOptions) {
    this.options = options;
  }

  public async run() {
    const ssgConfig =
      this.options.targetSsg === 'gatsby' ? gastbySsgConfig : nextSsgConfig;
    const ssgProjectCreator = new SsgProjectCreator(ssgConfig, {
      outFolder: this.options.outFolder,
    });
    const assetRegistry = new AssetRegistry({
      outFolder: this.options.outFolder,
      urls: this.options.urls,
      sourceFolder: this.options.sourceFolder,
      recursive: this.options.recursive,
      ssgConfiguration: ssgConfig,
    });
    await assetRegistry.retrieve();
    const componentRegistry = new ComponentRegistry(assetRegistry);
    // Componentization is an optional feature
    if (this.options.componentize) {
      await componentRegistry.retrieve();
    }
    const reactCompiler = new ReactCompiler({
      outFolder: this.options.outFolder,
      startPageUrl: this.options.urls?.[0] || 'http://localhost',
      assetRegistry,
      componentRegistry,
      ssgProjectCreator,
    });
    await reactCompiler.compile();

    await ssgProjectCreator.create();
  }
}

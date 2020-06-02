import path from 'path';
import AssetRegistry from '../AssetRegistry';
import createGatsbySsr from './createGatsbySsr';
import createGatsbyBrowserJs from './createGatsbyBrowserJs';
import { fsCopyDir } from '../../util/fs';
import addBaseTemplate from './addBaseTemplate';
import { getStaticDir } from '../../util/path';

interface GatsbyPageCreatorOptions {
  outFolder: string;
}

/**
 * Does everything needed to create
 * a fully functioning Gatsby site
 * as soon as the ReactCompiler finished
 */
export default class GatsbySiteCreator {
  private assetRegistry: AssetRegistry;
  private options: GatsbyPageCreatorOptions;

  constructor(assetRegistry: AssetRegistry, options: GatsbyPageCreatorOptions) {
    this.assetRegistry = assetRegistry;
    this.options = options;
  }

  /**
   * Essentially just adds the
   * missing pieces to the
   * existing project,
   * like gatsby-browser
   * and gatsby-ssr
   */
  public async create() {
    const allPages = this.assetRegistry.getPages();

    // Create gatsby-ssr.js file
    // await createGatsbySsr({
    //   allPages,
    //   outDir: this.options.outFolder,
    // });

    // Create gatsby-browser.js file
    // await createGatsbyBrowserJs({
    //   allPages,
    //   outDir: this.options.outFolder,
    // });
    // Copy the statikk compat layer into the converted template
    const PATH_TO_TEMPLATE_UTIL = path.join(getStaticDir(), 'template-util');
    await fsCopyDir(
      PATH_TO_TEMPLATE_UTIL,
      path.join(this.options.outFolder, 'src', 'util'),
    );
    await addBaseTemplate(this.options.outFolder);
  }
}

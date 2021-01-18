import path from 'path';
import { fsReadFile, fsWriteFile } from '../../util/fs';
import { getStaticDir } from '../../util/path';
import { SsgConfiguration } from '../../util/types';
import addBaseTemplate from './addBaseTemplate';

interface SsgProjectCreatorOptions {
  outFolder: string;
  compatLayerPath: string;
}

/**
 * Stores all information specific
 * to the selected target SSG.
 * Implements SSG-specific methods.
 */
export default class SsgProjectCreator {
  public configuration: SsgConfiguration;
  private options: SsgProjectCreatorOptions;

  constructor(
    configuration: SsgConfiguration,
    options: SsgProjectCreatorOptions,
  ) {
    this.configuration = configuration;
    this.options = options;
  }

  private async createCompatLayer() {
    const compatLayerTemplate = (
      await fsReadFile(
        path.join(getStaticDir(), 'template-util/jamify-compat-layer.js'),
      )
    ).toString();
    const compatLayerContent = compatLayerTemplate
      .replace(
        '// <--NAVIGATE_FN-->',
        this.configuration.routeNavigateFunctionDefinition,
      )
      .replace(
        '<--SSG_HTML_SELECTOR-->',
        this.configuration.htmlContainerSelector,
      );
    await fsWriteFile(this.options.compatLayerPath, compatLayerContent);
  }

  public async create() {
    await this.createCompatLayer();
    await addBaseTemplate(this.options.outFolder, this.configuration.name);
    if (this.configuration.onProjectCreated) {
      await Promise.resolve(
        this.configuration.onProjectCreated({
          projectRoot: this.options.outFolder,
          config: this.configuration,
        }),
      );
    }
  }
}

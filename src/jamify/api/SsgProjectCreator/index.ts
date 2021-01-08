import path from 'path';
import { fsCopyDir } from '../../util/fs';
import { getStaticDir } from '../../util/path';
import { SsgConfiguration } from '../../util/types';
import addBaseTemplate from './addBaseTemplate';

interface SsgProjectCreatorOptions {
  outFolder: string;
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

  public async create() {
    const PATH_TO_TEMPLATE_UTIL = path.join(getStaticDir(), 'template-util');
    await fsCopyDir(
      PATH_TO_TEMPLATE_UTIL,
      path.join(this.options.outFolder, this.configuration.srcFolder, 'util'),
    );
    await addBaseTemplate(this.options.outFolder, this.configuration.name);
  }
}

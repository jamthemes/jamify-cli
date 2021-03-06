import path from 'path';
import { CollectedPage, PageAsset, PageAssetType } from '../../util/types';
import analyzePage from './util/analyzePage';
import { fsMkDir, fsCopyFile } from '../../util/fs';
import del from 'del';

interface AssetRegistryOptions {
  sourceFolder?: string;
  urls?: string[];
  outFolder: string;
  recursive?: boolean;
}

interface GetPageAssetsFilter {
  type?: PageAssetType;
}

/**
 * Takes a list of scraped pages
 * and makes it easy to query
 * for assets from the outside.
 * Sort of an abstracted access
 * layer over the CollectedPage
 * type
 */
export default class AssetRegistry {
  private pages: CollectedPage[] = [];
  /**
   * All assets as a flat list
   */
  private assets: PageAsset[] = [];
  /**
   * Assets which need to be
   * served statically in
   * the resulting pages
   * webroot
   */
  private staticAssets: PageAsset[] = [];

  /**
   * Assets used in source
   */
  private assetsOutFolder: string = '';
  /**
   * Statically served assets
   */
  private staticAssetsOutFolder: string = '';
  private temporaryAssetsOutFolder: string = '';

  private options: AssetRegistryOptions;

  constructor(options: AssetRegistryOptions) {
    this.options = options;
    this.createPaths();
  }

  private createPaths() {
    this.assetsOutFolder = path.join(this.options.outFolder, 'src/assets');
    this.staticAssetsOutFolder = path.join(this.options.outFolder, 'static');
    this.temporaryAssetsOutFolder = path.join(
      this.options.outFolder,
      '.assets_temp',
    );
  }

  public getAssetsOutFolder() {
    return this.assetsOutFolder;
  }

  public getStaticAssetsOutFolder() {
    return this.staticAssetsOutFolder;
  }

  public getPages() {
    return this.pages;
  }

  /**
   * Retrieve filtered source assets
   */
  public getPageAssets({ type }: GetPageAssetsFilter = {}) {
    const filtered = type
      ? this.assets.filter(asset => asset.type === type)
      : this.assets;
    return filtered;
  }

  /**
   * Scrape all pages
   */
  public async retrieve() {
    const result = await analyzePage({
      output: this.temporaryAssetsOutFolder,
      urls: this.options.urls,
      sourceFolder: this.options.sourceFolder,
      recursive: this.options.recursive,
    });
    this.pages = result.pages;
    this.assets = result.allPageAssets;
    this.staticAssets = result.staticAssets;

    await this.copyAssets();
  }

  /**
   * Updates path of each asset instance
   * with that path
   */
  private updateAssetPath(oldAssetPath: string, newAssetPath: string) {
    const assetSources = [
      ...this.assets,
      ...this.pages.map(page => page.assets).flat(),
    ];
    for (const asset of assetSources) {
      if (asset.path === oldAssetPath) {
        asset.path = newAssetPath;
      }
    }
  }

  private async copyAssets() {
    // Copy page assets to out/src/assets

    for (const pageAsset of this.assets) {
      try {
        const pathWithoutRoot = path.relative(
          this.temporaryAssetsOutFolder,
          pageAsset.path,
        );
        const pageAssetPath = path.join(this.assetsOutFolder, pathWithoutRoot);
        await fsMkDir(path.dirname(pageAssetPath), { recursive: true });
        await fsCopyFile(pageAsset.path, pageAssetPath);
        this.updateAssetPath(pageAsset.path, pageAssetPath);
      } catch {
        console.log(`Failed creating file ${pageAsset.path}.`);
      }
    }
    // Copy remaining assets to out/static
    for (const remainingAsset of this.staticAssets) {
      try {
        const pathWithoutRoot = path.relative(
          this.temporaryAssetsOutFolder,
          remainingAsset.path,
        );
        const pageAssetPath = path.join(
          this.staticAssetsOutFolder,
          pathWithoutRoot,
        );
        await fsMkDir(path.dirname(pageAssetPath), { recursive: true });
        await fsCopyFile(remainingAsset.path, pageAssetPath);
        this.updateAssetPath(remainingAsset.path, pageAssetPath);
      } catch {
        console.log(`Failed creating file ${remainingAsset.path}.`);
      }
    }

    // Delete out/assets
    await del(this.temporaryAssetsOutFolder, { force: true });
  }
}

import path from 'path';
import { PageAsset } from '../../../util/types';
import {
  generateJsIdentifier,
  getUnusedIdentifier,
} from '../../../util/compilation/js';

export interface ImportedPageAsset extends PageAsset {
  /**
   * Generated Variable name
   * of imported asset
   */
  importIdentifier: string;
  /**
   * Path from which the
   * asset can be imported
   */
  relativeImportPath: string;
}

let usedIdentifiers: string[] = [];
function generateIdentifierFromPath(assetPath: string) {
  const fileName = path.basename(assetPath);
  const fileExtension = path.extname(fileName);
  const fileNameWithoutExtension = fileName.replace(fileExtension, '');
  const importIdentifier = generateJsIdentifier({
    input: fileNameWithoutExtension,
  });
  const newIdentifier = getUnusedIdentifier({
    usedIdentifiers,
    identifier: importIdentifier,
  });
  usedIdentifiers.push(newIdentifier);
  return newIdentifier;
}

const pathToRelative = (filePath: string, pageFolderPath: string) => {
  return path
    .relative(pageFolderPath, filePath)
    .replace(new RegExp('\\\\', 'g'), '/');
};

interface CreateImportsOptions {
  assets: PageAsset[];
  /**
   * Folder of current page
   */
  pageFolder?: string;
  /**
   * Folder where all
   * pages are created
   */
  pagesOutFolder: string;
}

/**
 * Populates each asset with
 * an unique identifier
 * and the relative path
 * it can be imported from
 */
export default function createImports({
  assets,
  pageFolder,
  pagesOutFolder,
}: CreateImportsOptions): ImportedPageAsset[] {
  const uniquePageAssets = [
    ...new Set(assets.map(asset => asset.originalUrl)),
  ].map(assetUrl =>
    assets.find(a => a.originalUrl === assetUrl),
  ) as PageAsset[];

  const importedAssets = uniquePageAssets.map(asset => {
    const importIdentifier = generateIdentifierFromPath(asset.path);
    const relativeImportPath = pathToRelative(
      asset.path,
      pageFolder || pagesOutFolder,
    );

    return {
      ...asset,
      importIdentifier,
      relativeImportPath,
    };
  });
  return importedAssets;
}

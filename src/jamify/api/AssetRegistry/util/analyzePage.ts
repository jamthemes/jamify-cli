import retrieveAllAssets from './retrieveAllAssets';

export interface AnalyzePageOptions {
  output: string;
  sourceFolder?: string;
  urls?: string[];
  /** Defaults to true */
  recursive?: boolean;
}

export default async function analyzePage({
  output,
  recursive = true,
  urls,
  sourceFolder,
}: AnalyzePageOptions) {
  return retrieveAllAssets({
    output,
    urls,
    sourceFolder,
    silent: false,
    recursive,
  });
}

export type PageAssetType =
  | 'HtmlStyle'
  | 'HtmlScript'
  | 'HtmlImage'
  | 'CssAlphaImageLoader'
  | 'CssFontFaceSrc'
  | 'CssBehavior'
  | 'CssImage'
  | 'CssImport'
  | 'CssSourceMappingUrl'
  | 'CssSourceUrl'
  | 'CssUrlTokenRelation';

export interface PageAsset {
  type: PageAssetType;
  /** Orginal URL relative to the website's root */
  originalUrl: string;
  /** Absolute URL where the asset was downloaded */
  path: string;
  /** Determine if the asset
   * was referenced in the head
   * or the body */
  source?: 'body' | 'head';
}

export interface CollectedPage {
  /** URL relative to the website's root */
  url: string;
  restHeadContent: string;
  restBodyContent: string;
  htmlAttributes: { [key: string]: string | undefined };
  bodyAttributes: { [key: string]: string | undefined };
  assets: PageAsset[];
  htmlDocument: HTMLDocument;
}

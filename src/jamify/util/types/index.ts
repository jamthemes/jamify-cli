import { types } from '@babel/core';

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

export interface LinkRenderProps {
  /** TODO: Correctly type with Babel types */
  href: any;
  children: any;
  restAttributes: any[];
}

export type RenderLinkFn = (props: LinkRenderProps) => types.JSXElement;

interface CreatePageHeadParams {
  page: CollectedPage;
  convertToJSX: (html: string) => string;
  htmlAttributesToJsx: (obj: any) => string;
  /**
   * This needs to be inserted inside
   * the Head component when implementing
   */
  children?: string;
}

interface SsgOnProjectCreatedParams {
  config: SsgConfiguration;
  projectRoot: string;
}

export interface SsgConfiguration {
  name: string;
  /**
   * Will be inserted on top of each
   * page component
   */
  globalPageImports: string[];
  renderLink: RenderLinkFn;
  srcFolder: string;
  publicFolder: string;
  htmlContainerSelector: string;
  routeNavigateFunctionDefinition: string;
  createPageHead: (params: CreatePageHeadParams) => string;
  onProjectCreated?: (p: SsgOnProjectCreatedParams) => any;
}

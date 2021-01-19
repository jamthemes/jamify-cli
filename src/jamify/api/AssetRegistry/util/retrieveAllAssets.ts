// TODO: Types for AssetGraph

import del from 'del';
import { PageAsset, CollectedPage } from '../../../util/types';
import populateWithLimit from './assetgraph/populate';

const AssetGraph = require('assetgraph');
const urlTools = require('urltools');
const urlModule = require('url');

// Register custom populate transform
AssetGraph.registerTransform(populateWithLimit, 'populateWithLimit');
// Maximum pages to follow. Specify in 100 steps,
// everything in between is ignored
const MAX_RELATIONS_TO_FOLLOW = 200;

interface RetrieveAllAssetsOptions {
  /** Path of out dir */
  output: string;
  /** Omit logs */
  silent?: boolean;
  /** Follow relative links. Defaults to true */
  recursive?: boolean;
  sourceFolder?: string;
  urls?: string[];
}

interface RetrieveAllAssetsData {
  staticAssets: PageAsset[];
  allPageAssets: PageAsset[];
  pages: CollectedPage[];
}

interface PreprocessHtml {
  assetGraph: any;
}

function makeRelationRootRelative(relation: any, outRoot: string) {
  if (relation.to.url) {
    const rootRelativeHref = urlTools.buildRootRelativeUrl(
      outRoot,
      relation.to.url,
      outRoot,
    );
    relation.href = rootRelativeHref;
  }
}

/**
 * Removes trailing /index.<ext>,
 * so that those URIs can be
 * matched
 */
function normalizeUrl(url: string) {
  const trailingIndexRegex = /(index\..*)$/g;
  const hasTralingIndex = trailingIndexRegex.test(url);
  if (hasTralingIndex) {
    const normalized = url.replace(trailingIndexRegex, '') || '';
    return normalized;
  }
  return url;
}

function escapeRegex(input: string) {
  return input.replace(/[[\](){}?*+^$\\.|]/g, '\\$&');
}

/**
 * HTML.js makes problems when
 * generating source maps sometimes,
 * the _createSourceMapForInlineScriptOrStylesheet
 * method needs to be overwritten
 * to prevent that.
 * TODO: Open PR to fix that issue
 */
function monkeyPatchHtmlAsset(htmlAsset: any) {
  const _createSourceMapForInlineScriptOrStylesheet = htmlAsset._createSourceMapForInlineScriptOrStylesheet.bind(
    htmlAsset,
  );
  htmlAsset._createSourceMapForInlineScriptOrStylesheet = function (
    element: any,
  ) {
    const nonInlineAncestor = this.nonInlineAncestor;
    const sourceUrl =
      this.sourceUrl || (nonInlineAncestor ? nonInlineAncestor.url : this.url);
    let location;
    if (element.firstChild) {
      location = this._jsdom.nodeLocation(element.firstChild);
    } else {
      // Empty script or stylesheet
      location = this._jsdom.nodeLocation(element).endTag;
    }
    if (!location) {
      const mozilla = require('source-map');
      const sourceMapGenerator = new mozilla.SourceMapGenerator({
        file: sourceUrl,
      });
      return sourceMapGenerator.toJSON();
    }
    return _createSourceMapForInlineScriptOrStylesheet(element);
  };
}

async function preprocessHtml({ assetGraph }: PreprocessHtml) {
  // Preprocess HTML:
  // -> Find invalid script tags and make them "valid",
  // according to https://github.com/scriptify/statikk/issues/23
  // This step is needed to make loaders like
  // the Cloudflare Rocket Loader work.
  // -> Remove IE only stylesheets (conditional stylesheets)
  // We do not support old IE versions.
  // Update your browser or work for other clients.
  const pagesToPreProcess = assetGraph.findAssets({
    type: 'Html',
  });
  for (const page of pagesToPreProcess) {
    if (!page.url || !page.parseTree) {
      continue;
    }
    monkeyPatchHtmlAsset(page);
    const allScriptTags = page.parseTree.querySelectorAll('script');
    const SCRIPT_TYPES_TO_VALIDATE = ['text/javascript', 'text/rocketscript'];
    let shouldRepopulate = false;
    for (const scriptTag of allScriptTags) {
      const typeAttrVal = scriptTag.getAttribute('type');
      const isValidJs =
        !!typeAttrVal &&
        !!SCRIPT_TYPES_TO_VALIDATE.find((val) => typeAttrVal.includes(val));
      if (isValidJs) {
        scriptTag.setAttribute('type', 'text/javascript');
        shouldRepopulate = true;
      }
    }
    if (shouldRepopulate) {
      page.markDirty();
      page._unpopulate();
      page.populate();
    }
  }

  await assetGraph.externalizeRelations({
    type: { $in: ['HtmlStyle', 'HtmlScript'] },
  });

  const scriptAssets = assetGraph.findRelations({
    type: 'HtmlScript',
  });

  for (const scriptAsset of scriptAssets) {
    if (scriptAsset.to) {
      await scriptAsset.to.load();
    }
  }

  // Remove conditional comments
  const conditionalComments = assetGraph.findRelations({
    type: 'HtmlConditionalComment',
  });
  for (const conditionalComment of conditionalComments) {
    conditionalComment.detach();
  }
}

export default async function retrieveAllAssets({
  output,
  recursive: recursiveParam = false,
  silent,
  urls,
  sourceFolder: sourceFolderParam,
}: RetrieveAllAssetsOptions): Promise<RetrieveAllAssetsData> {
  const headers = [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
  ];

  const sourceFolder = sourceFolderParam
    ? urlTools.urlOrFsPathToUrl(sourceFolderParam, true)
    : undefined;

  const useUrl = !sourceFolder && urls && urls.length > 0;

  const recursive = recursiveParam ?? !!sourceFolder;

  const baseUrl = normalizeUrl(urls![0]);

  /**
   * Make sure that only pages under the specified
   * start page's root (/<x>/<y>/root/...)
   * are included
   */
  let startPageRegex = new RegExp(`${escapeRegex(baseUrl)}.*`);
  console.log('startPageRegex', startPageRegex);

  const pretty = false;

  let assetsToLoad: string | string[] = '*.html';
  if (useUrl) {
    assetsToLoad = urls!.map((arg) =>
      /^https?:\/\//i.test(arg) ? arg : `http://${arg}`,
    );
  }

  const assetGraph = new AssetGraph(
    sourceFolder ? { root: sourceFolder } : { root: baseUrl },
  );
  const teepeeHeaders = assetGraph.teepee.headers;
  for (const header of headers) {
    var matchKeyValue = header.match(/^([^:]*):\s?(.*)$/);
    if (matchKeyValue) {
      const [, name, value] = matchKeyValue;
      teepeeHeaders[name] = value;
    } else {
      throw new Error(`Cannot parse header: ${header}`);
    }
  }

  // In selfContained mode this will come out as file:///path/to/index.html/
  // We'll deal with that case further below
  const outRoot = useUrl
    ? output && urlTools.urlOrFsPathToUrl(output, true)
    : sourceFolder;

  const resourceHintTypes = [
    'HtmlPreconnectLink',
    'HtmlPrefetchLink',
    'HtmlPreloadLink',
    'HtmlPrerenderLink',
    'HtmlDnsPrefetchLink',
  ];

  const anchorTypes = ['HtmlAnchor', 'SvgAnchor', 'HtmlMetaRefresh'];

  const noFollowRelationTypes = [
    ...anchorTypes,
    ...resourceHintTypes,
    'HtmlOpenGraph',
    'RssChannelLink',
    'JsonUrl',
  ];

  let followRelationsQuery;
  if (recursive) {
    followRelationsQuery = {
      $or: [
        {
          type: {
            $nin: noFollowRelationTypes,
          },
          crossorigin: false,
        },
        {
          type: { $nin: resourceHintTypes },
          crossorigin: false,
        },
      ],
    };
  } else {
    noFollowRelationTypes.push('HtmlAlternateLink');
    followRelationsQuery = {
      $or: [
        {
          type: {
            $nin: noFollowRelationTypes,
          },
          crossorigin: false,
        },
        {
          type: { $nin: resourceHintTypes },
          crossorigin: false,
          to: {
            type: {
              $nin: ['Html'],
            },
          },
        },
      ],
    };
  }

  if (silent) {
    // Avoid failing on assetGraph.warn
    // It would be better if logEvents supported a custom console implementation
    assetGraph.on('warn', () => {});
  } else {
    await assetGraph.logEvents();
  }
  await assetGraph.loadAssets(assetsToLoad);
  // await assetGraph.populateWithLimit({
  //   followRelations: followRelationsQuery,
  //   limit: MAX_RELATIONS_TO_FOLLOW,
  // });
  await assetGraph.populate({
    followRelations: followRelationsQuery,
  });

  const htmlRelations = assetGraph.findRelations({});

  await assetGraph.checkIncompatibleTypes();

  for (const relation of assetGraph
    .findRelations({ type: 'HttpRedirect' })
    .sort((a: any, b: any) => a.id - b.id)) {
    if (relation.from.isInitial) {
      assetGraph.warn(
        new Error(`${relation.from.url} redirected to ${relation.to.url}`),
      );
      relation.to.isInitial = true;
      relation.from.isInitial = false;
    }
  }

  const origins = new Set(
    assetGraph
      .findAssets({ isInitial: true })
      .map((asset: any) => new urlModule.URL(asset.url).origin),
  );
  if (origins.size > 1) {
    throw new Error(
      `The pages to bring home must have the same origin, but saw multiple:\n  ${[
        ...origins,
      ].join('\n  ')}`,
    );
  }
  const [origin] = Array.from(origins);

  for (const redirect of assetGraph.findRelations({
    type: 'HttpRedirect',
  })) {
    for (const incomingRelation of redirect.from.incomingRelations) {
      incomingRelation.to = redirect.to;
    }
    assetGraph.removeAsset(redirect.from);
  }

  if (pretty) {
    for (const asset of assetGraph.findAssets({ isLoaded: true })) {
      if (asset.prettyPrint) {
        asset.prettyPrint();
      }
    }
  }

  for (const relation of assetGraph.findRelations({
    hrefType: { $in: ['rootRelative', 'protocolRelative', 'absolute'] },
  })) {
    relation.hrefType =
      relation.type === 'JavaScriptStaticUrl' ? 'rootRelative' : 'relative';
  }

  // Make sure that JavaScriptStaticUrl relations don't end up as relative
  // because fromUrl and toUrl are outside assetGraph.root:
  assetGraph.root = outRoot;

  await preprocessHtml({ assetGraph });

  await assetGraph.moveAssets(
    { isInline: false, isLoaded: true },
    (asset: any, assetGraph: any) => {
      let baseUrl;
      if (asset.origin === origin) {
        baseUrl = outRoot;
      } else {
        baseUrl = `${outRoot}${asset.hostname}${
          asset.port ? `:${asset.port}` : ''
        }/`;
      }
      return new urlModule.URL(
        `${asset.path.replace(/^\//, '')}${asset.baseName || 'index'}${
          asset.extension || asset.defaultExtension
        }`,
        baseUrl,
      ).href;
    },
  );

  // Make sure no asset file names collide with implicit dirs so that
  // writeAssetsToDisc is safe:
  const reservedUrls = new Set();
  for (const asset of assetGraph.findAssets({
    isInline: false,
    isLoaded: true,
  })) {
    if (asset.url.startsWith(outRoot)) {
      const relative = urlTools.buildRelativeUrl(outRoot, asset.url);
      if (relative.includes('/')) {
        const fragments = relative.split('/').slice(0, -1);
        for (let i = 0; i < fragments.length; i += 1) {
          reservedUrls.add(outRoot + fragments.slice(0, i + 1).join('/'));
        }
      }
    }
  }

  for (const asset of assetGraph.findAssets({
    url: {
      $in: [...reservedUrls],
    },
  })) {
    let nextSuffixToTry = 1;
    let targetUrl;
    do {
      targetUrl = new urlModule.URL(
        `${asset.baseName}-${nextSuffixToTry}${
          asset.extension || asset.defaultExtension
        }`,
        asset.url,
      ).href;
      nextSuffixToTry += 1;
    } while (assetGraph._urlIndex[targetUrl]);
    asset.url = targetUrl;
  }

  // Make all image relations root relative.
  // This way, each asset has the same relative URL.
  // This is handy when they get replaced
  // by babel plugins.
  const allImageRelations = assetGraph.findRelations({
    type: 'HtmlImage',
  });
  for (const relation of allImageRelations) {
    makeRelationRootRelative(relation, outRoot);
  }

  /**
   * Bring asset into an easily consumable format
   */
  function transformRelation(relation: any) {
    if (!relation.to.url) {
      return null;
    }

    const isFilePath = relation.to.url.includes(outRoot);
    if (!isFilePath) return null;

    let fromUrl = relation.from.url;
    if (!fromUrl) {
      if (relation.from.incomingInlineRelation) {
        fromUrl = relation.from.incomingInlineRelation.from.url;
      }
    }

    const elementSource = relation.node
      ? findElementSource(relation.node)
      : undefined;
    const rootRelativeUrl = urlTools.buildRootRelativeUrl(
      outRoot,
      relation.to.url,
      outRoot,
    );

    return {
      type: relation.type,
      originalUrl: relation.href,
      rootRelativeUrl,
      path: urlTools.fileUrlToFsPath(relation.to.url),
      source: elementSource,
      fromUrl,
      fileProtocolUrl: relation.to.url,
    };
  }

  const relationsToDetach = ['HtmlStyle', 'HtmlScript'];

  // Only JS will be directly imported
  const localPageRelations = ['HtmlScript'];

  // Retrieve all scripts before
  // they are detached, so that they can
  // later on be assigned to a HTML page
  const allPageAssets = assetGraph
    .findRelations({
      type: { $in: localPageRelations },
    })
    .map(transformRelation)
    .filter(Boolean);

  function attributesToObject(attributes: any) {
    return [...attributes].reduce(
      (obj, val) => ({
        ...obj,
        [val.nodeName]: val.nodeValue,
      }),
      {},
    );
  }

  /**
   * Finds out if the element was referenced
   * on inside <body> or <head>
   */
  function findElementSource(element: any) {
    let currElem = element;
    while (currElem.parentElement) {
      currElem = currElem.parentElement;
      if (currElem.tagName === 'HEAD') {
        return 'head';
      }
      if (currElem.tagName === 'BODY') {
        return 'body';
      }
    }
    return '';
  }

  // Currently, everything but JS is served statically.
  const staticAssets = assetGraph
    .findRelations({
      type: {
        $nin: ['HtmlScript'],
      },
      to: {
        type: {
          // Copy everything but HTML files
          $nin: ['Html'],
        },
      },
    })
    .filter((rel: any) => rel.to.type)
    .map((relation: any) => {
      makeRelationRootRelative(relation, outRoot);
      return transformRelation(relation);
    })
    .filter(Boolean);

  // Extract the needed data from the HTML pages,
  // namely the body content, the head content
  // and the html attributes of those tags.
  // Then, get all Script, Style and Image relations
  // and assign them to the HTML page where
  // they were required
  const allHtmlAssets = assetGraph.findAssets({ type: 'Html' });

  const allUrls = allHtmlAssets.map((rel: any) => rel.url);

  const allValidPageUrls = [...new Set(allUrls)];

  const allRelationsToDetach = assetGraph.findRelations({
    type: { $in: relationsToDetach },
  });

  for (const toDetach of allRelationsToDetach) {
    toDetach.detach();
  }

  // Make all local link relations root ('/') relative
  // const allLocalLinkRelations = assetGraph.findRelations({
  //   type: 'HtmlAnchor',
  //   hrefType: {
  //     $in: ['relative'],
  //   },
  // });
  // for (const localLink of allLocalLinkRelations) {
  // const isExternal = isUrlExternal(localLink.href, pageUrl);
  // const isHashUrl = localLink.href.startsWith('#');
  // if (!isExternal && !isHashUrl) {
  //   const rootRelativeHref = urlTools.buildRootRelativeUrl(
  //     outRoot,
  //     localLink.to.url,
  //     outRoot,
  //   );
  //   localLink.href = rootRelativeHref;
  // }
  // }

  const pagesWithAssets = allValidPageUrls
    .map((pageUrl) => {
      const [page] = assetGraph.findAssets({ url: pageUrl });
      if (!page || !page.url || !page.parseTree || !page.parseTree.body) {
        return null;
      }

      // if (!allValidPageUrls.includes(page.url)) {
      //   return null;
      // }

      const body = page.parseTree.body;
      const head = page.parseTree.head;
      const html = page.parseTree.querySelector('html');
      const restHeadContent = head ? head.innerHTML : '';
      const restBodyContent = body ? body.innerHTML : '';
      const bodyAttributes = body ? attributesToObject(body.attributes) : {};
      const htmlAttributes = html ? attributesToObject(html.attributes) : {};
      const siteRelations = allPageAssets.filter(
        (relation: any) => relation.fromUrl === page.url,
      );

      const collectedPage: CollectedPage = {
        url: urlTools.buildRootRelativeUrl(outRoot, page.url, outRoot),
        // path: urlTools.fileUrlToFsPath(page.url),
        assets: siteRelations,
        restHeadContent,
        restBodyContent,
        bodyAttributes,
        htmlAttributes,
        htmlDocument: page.parseTree,
      };

      return collectedPage;
    })
    .filter(Boolean) as CollectedPage[];

  await assetGraph.writeAssetsToDisc(
    {
      isLoaded: true,
    },
    outRoot,
    baseUrl,
  );

  if (!silent) {
    console.log('Output written to', outRoot);
  }

  // Delete source folder (if exists) to save space
  if (sourceFolder) {
    console.log('Delete source folder', sourceFolder);
    await del(sourceFolder, { force: true });
  }

  function arrayUnique<T>(array: T[], field: string): T[] {
    return [...new Set(array.map((array) => (array as any)[field]))].map(
      (value) => {
        return array.find((el) => (el as any)[field] === value);
      },
    ) as T[];
  }

  const resObj = {
    pages: pagesWithAssets,
    staticAssets: arrayUnique<PageAsset>(staticAssets, 'path'),
    allPageAssets: arrayUnique<PageAsset>(allPageAssets, 'path'),
  };
  return resObj;
}

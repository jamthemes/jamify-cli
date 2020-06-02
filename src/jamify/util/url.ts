import URL from 'url';

interface NormalizeUrlParams {
  /** Base url of website */
  pageUrl?: string;
  /** URL to normalize */
  url: string;
}

/**
 * - Converts relative URLs to absolute URLs (if they are relative)
 * - Removes '/' from the end of an URL if present
 * - Converts '/index.html' -> '/'
 * */
export function normalizeUrl({ pageUrl, url }: NormalizeUrlParams) {
  let finalUrl = url;

  if (pageUrl && !url.includes(pageUrl)) {
    if (!finalUrl.startsWith('/') && !pageUrl.endsWith('/')) {
      finalUrl = `/${finalUrl}`;
    }
    finalUrl = `${pageUrl}${finalUrl}`;
  }
  if (finalUrl.endsWith('/index.html')) {
    finalUrl = finalUrl.slice(0, finalUrl.length - '/index.html'.length);
  }

  if (finalUrl.endsWith('/')) {
    finalUrl = finalUrl.slice(0, finalUrl.length - 1);
  }

  return finalUrl;
}

export const getURLOrigin = (urlString: string): string => {
  const obj = URL.parse(urlString);
  if (!obj.protocol && !obj.hostname) {
    return '';
  }
  return `${obj.protocol}//${obj.hostname}${obj.port ? `:${obj.port}` : ''}`;
};

export function containsUrl(string: string): Boolean {
  return /^(url)/.test(string);
}

export function isUrlAbsolute(url: string) {
  // Don't match Windows paths `c:\`
  if (/^[a-zA-Z]:\\/.test(url)) {
    return false;
  }

  // Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
  // Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);
}

/**
 * Returns true if the URL points
 * to a resource not from the same origin
 */
export function isUrlExternal(url: string, pageUrl: string) {
  // Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
  // Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
  let isAbsolute = isUrlAbsolute(url);

  if (!isAbsolute) return false;

  return getURLOrigin(url) !== getURLOrigin(pageUrl);
}

/**
 * Returns true if url points to
 * another, relative page of
 * the website, e.g. '/home' or '/index.html'
 * but not '#menu'
 */
export function isUrlPointingToInternalPage(url: string, pageUrl: string) {
  const isInternal = !isUrlExternal(url, pageUrl);
  const doesNotStartWithHash = !url.startsWith('#');
  return isInternal && doesNotStartWithHash;
}

/**
 * Get uri without get params or hashes
 */

// export function getPureResourceUri(uri: string) {
//   const parsed = URL.parse(uri);
//   let pureUri =
//     parsed.href
//       ?.replace(parsed.hash ?? '', '')
//       .replace(parsed.search ?? '', '') ?? '';

//   if (pureUri.endsWith('/')) {
//     pureUri = pureUri.slice(0, pureUri.length - 1);
//   }
//   return pureUri;
// }

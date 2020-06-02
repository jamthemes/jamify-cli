import URL from 'url';
import { urlToReactComponentName } from '../../../util/compilation/react';
import UrlResolver from '../UrlResolver';

export function removeTrailingSemicolon(jsx: string) {
  if (jsx.charAt(jsx.length - 1) === ';') {
    return jsx.slice(0, jsx.length - 1);
  }
  return jsx;
}

interface TransformHrefToSsgUrlParams {
  url: string;
  currentPageUrl: string;
  urlResolver: UrlResolver;
}

/**
 * If a href attribute value is detected
 * to point to an internal page of this
 * site, replace it with the correct
 * SSG URL. Otherwise, this function
 * returns null, which means that
 * nothing has to be done.
 * This function is used in in replaceLinksInJSX
 * and in replaceHtmlComponentsInJSX.
 * replaceHtmlComponentsInJSX looks if
 * an attribute value, which originally was
 * an href, needs to be transformed.
 */
export function transformHrefToSsgUrl({
  url,
  currentPageUrl,
  urlResolver,
}: TransformHrefToSsgUrlParams) {
  const foundInternalPageUrl = urlResolver.toInternalUrl({
    url,
    pageUrl: currentPageUrl,
  });

  if (foundInternalPageUrl) {
    const { ssgUrl } = urlToReactComponentName(foundInternalPageUrl);
    const { hash, search } = URL.parse(url);
    // Keep get params and hash values
    return `${ssgUrl}${search ?? ''}${hash ?? ''}`;
  }
  return null;
}

import replaceLinksInJSX from './replaceLinksWithBabel';
import { transformHrefToSsgUrl } from '../util';
import UrlResolver from '../../UrlResolver';

/**
 * Replaces <a> tags with  <Link> components
 */
export async function replaceAllLinksWithReactComponents(
  jsxStr: string,
  currentPageUrl: string,
  urlResolver: UrlResolver,
): Promise<string> {
  function transformUrl(url: string) {
    return transformHrefToSsgUrl({
      url,
      currentPageUrl,
      urlResolver,
    });
  }

  const result = await replaceLinksInJSX({
    jsxStr,
    newComponentName: 'Link',
    hrefPropName: 'to',
    transformUrl,
  });
  return result;
}

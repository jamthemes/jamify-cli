import replaceLinksInJSX from './replaceLinksWithBabel';
import { transformHrefToSsgUrl } from '../util';
import UrlResolver from '../../UrlResolver';
import { RenderLinkFn } from '../../../../util/types';

/**
 * Replaces <a> tags with  <Link> components
 */
export async function replaceAllLinksWithReactComponents(
  jsxStr: string,
  currentPageUrl: string,
  urlResolver: UrlResolver,
  renderLink: RenderLinkFn,
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
    renderLink,
    transformUrl,
  });
  return result;
}

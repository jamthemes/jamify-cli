import { URL } from 'url';

interface ToInternalUrlParams {
  url: string;
  /**
   * URL of the page on which
   * the specified URL was
   * encountered. Needed to
   * resolve it to an absolute
   * URL
   */
  pageUrl: string;
}

export default class UrlResolver {
  private allPageUrls: string[];
  constructor(allPageUrls: string[]) {
    this.allPageUrls = allPageUrls.map(this.normalizeUrl);
  }

  /**
   * Removes trailing /index.<ext>,
   * so that those URIs can be
   * matched
   */
  private normalizeUrl(url: string) {
    const trailingIndexRegex = /(index\..*)$/g;
    const hasTralingIndex = trailingIndexRegex.test(url);
    if (hasTralingIndex) {
      const normalized = url.replace(trailingIndexRegex, '') || '';
      return normalized;
    }
    return url;
  }

  /** Takes a relative or absolute URL
   * and based on 'allPageUrls' returns
   * an absolute page URL or null,
   * if it doesn't point to an
   * internal page
   */
  public toInternalUrl({ url, pageUrl }: ToInternalUrlParams) {
    const urlObj = new URL(url, this.normalizeUrl(pageUrl));
    const normalizedUrl = this.normalizeUrl(urlObj.href);
    const foundUrl = this.allPageUrls.find(
      urlToCheck => normalizedUrl === urlToCheck,
    );
    return foundUrl;
  }

  public hrefToSsgUrl() {}
}

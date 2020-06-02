import { componentsFromDocuments } from '.';
import { CollectedPage } from '../../../util/types';

interface ComponentizeHtmlParams {
  pages: CollectedPage[];
}

/**
 * Takes a multiple JSDOM nodes (from all collected pages)
 * and detects re-usable components. Those components
 * are then written in a web component style back
 * in the JSDOM.
 * Each page then receives it's new HTML with
 * the components in it.
 * In addition to that, a list of found components
 * is returned.
 */
export default async function componentsFromPages({
  pages,
}: ComponentizeHtmlParams) {
  const allHtmlDocuments = pages.map(page => page.htmlDocument);
  const htmlComponents = componentsFromDocuments(allHtmlDocuments);
  return htmlComponents;
}

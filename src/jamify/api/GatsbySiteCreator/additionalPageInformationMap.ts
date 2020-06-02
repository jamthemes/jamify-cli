import { urlToReactComponentName } from '../../util/compilation/react';
import { CollectedPage } from '../../util/types';

interface GetAdditionalPageInformationMapOptions {
  allPages: CollectedPage[];
}

export type AdditionalPageInformationMapType = {
  [gatsbyPath: string]: {
    /**
     * Rest of the header as HTML,
     * e.g. <title> tag, <meta> tags etc...
     */
    headerRestHtml: string;
    htmlAttributes: { [key: string]: string | undefined };
    bodyAttributes: { [key: string]: string | undefined };
  };
};

/**
 * Create the gatsby-srr.js file which includes
 * sets additional page data, e.g.
 * head...
 */
export default async function getAdditionalPageInformationMap({
  allPages,
}: GetAdditionalPageInformationMapOptions) {
  const additionalPageInformationMap: AdditionalPageInformationMapType = {};

  for (const currentPage of allPages) {
    const { ssgUrl } = urlToReactComponentName(currentPage.url);

    const headerRestHtml = currentPage.restHeadContent;

    additionalPageInformationMap[ssgUrl] = {
      headerRestHtml,
      htmlAttributes: currentPage.htmlAttributes,
      bodyAttributes: currentPage.bodyAttributes,
    };
  }

  return additionalPageInformationMap;
}

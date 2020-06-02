import path from 'path';

import getAdditionalPageInformationMap, {
  AdditionalPageInformationMapType,
} from './additionalPageInformationMap';
import { CollectedPage } from '../../util/types';
import { fsWriteFile } from '../../util/fs';

interface CreateGatsbySsrFileOptions {
  allPages: CollectedPage[];
  outDir: string;
}

function gatsbySsrTemplate(
  additionalPageInformation: AdditionalPageInformationMapType,
) {
  // TODO: headerRestJSX
  return `
  const React = require("react")

  const additionalPageInformation = ${JSON.stringify(
    additionalPageInformation,
  )};
  
  exports.onRenderBody = function(apiCallbackContext, pluginOptions) {  
    let { pathname, setHtmlAttributes, setBodyAttributes } = apiCallbackContext

    if (pathname.endsWith("/")) {
      pathname = pathname.slice(pathname, pathname.length - 1)
    }

    if (!pathname) {
      pathname = "/"
    }

    const foundInformation = additionalPageInformation[pathname]
  
    if (foundInformation) {
      const { htmlAttributes, bodyAttributes } = foundInformation
      setHtmlAttributes(htmlAttributes)
      setBodyAttributes(bodyAttributes)
    }
  }  
  `;
}

/**
 * Create the gatsby-srr.js file which includes
 * all external libs in the header
 */
export default async function createGatsbySsr({
  allPages,
  outDir,
}: CreateGatsbySsrFileOptions) {
  const pagesToExternalLibsMap = await getAdditionalPageInformationMap({
    allPages,
  });

  const gatsbySsrContent = gatsbySsrTemplate(pagesToExternalLibsMap);
  const gatsbySsrPath = path.join(outDir, 'gatsby-ssr.js');

  await fsWriteFile(gatsbySsrPath, gatsbySsrContent);
}

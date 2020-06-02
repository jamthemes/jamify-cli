import path from 'path';
import getAdditionalPageInformationMap from './additionalPageInformationMap';
import { CollectedPage } from '../../util/types';
import { fsWriteFile } from '../../util/fs';
interface CreateGatsbyBrowserFileOptions {
  allPages: CollectedPage[];
  outDir: string;
}

/**
 * Creates 'gatsby-browser.js' file
 */
export default async function createGatsbyBrowserJs({
  outDir,
  allPages,
}: CreateGatsbyBrowserFileOptions) {
  const additionalPageInformation = await getAdditionalPageInformationMap({
    allPages,
  });
  const fileContent = `
  const additionalPageInformation = ${JSON.stringify(
    additionalPageInformation,
  )};

  window.jamify = {
    log: function(...params) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[STATIKK]", ...params)
      }
    },
  }
  
  function applyAttributes(elem, attrs = {}) {
    [...elem.attributes].forEach(attr => {
      elem.setAttribute(attr.nodeName, '');
    })
    Object.keys(attrs).forEach(key => {
      const val = attrs[key]
      elem.setAttribute(key, val)
    })
  }
  
  exports.onPreRouteUpdate = function({ location, prevLocation }) {
    if (!prevLocation && process.env.NODE_ENV !== "development") {
      // This was already done by SSR HTML page ;)
      return
    }
  
    let { pathname = "" } = location
  
    if (pathname.endsWith("/")) {
      pathname = pathname.slice(pathname, pathname.length - 1)
    }

    if (!pathname) {
      pathname = "/"
    }
    
    const foundInformation = additionalPageInformation[pathname]
  
    if (foundInformation) {
      const $body = document.querySelector("body")
      const $html = document.querySelector("html")
      const {
        htmlAttributes,
        bodyAttributes,
        headerRestHtml,
      } = foundInformation
      applyAttributes($body, bodyAttributes)
      applyAttributes($html, htmlAttributes)
      let $head = document.querySelector("head #additionalHeadHtml")
      if (!$head) {
        document
          .querySelector("head")
          .insertAdjacentHTML("beforeend", '<div id="additionalHeadHtml"></div>')
        $head = document.querySelector("head #additionalHeadHtml")
      }
      $head.innerHTML = headerRestHtml
    }
  }
  
  
  
  `;
  const gatsbyBrowserPath = path.join(outDir, 'gatsby-browser.js');

  await fsWriteFile(gatsbyBrowserPath, fileContent);
}

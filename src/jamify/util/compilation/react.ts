import path from 'path';
import URL from 'url';
import { camelize } from '../str';

/**
 * Unified method to convert an URL
 * to a react component name and
 * the according link in React based
 * SSGs
 */
export function urlToReactComponentName(fullUrl: string) {
  const parsedUrl = URL.parse(fullUrl);
  let pageUrlBaseName = path
    .basename(parsedUrl.pathname ?? '')
    .replace(path.extname(fullUrl), '');

  if (!pageUrlBaseName || pageUrlBaseName === '/') {
    pageUrlBaseName = 'index';
  }

  const pageDirName = path.dirname(parsedUrl.pathname || '');

  let pageFilePath = `${pageUrlBaseName}.js`;
  const pageComponentName = camelize(pageUrlBaseName);

  let ssgUrl = `${pageDirName === '/' ? '/' : `${pageDirName}/`}${
    pageUrlBaseName === 'index' ? '' : pageUrlBaseName
  }`;

  if (pageDirName === '/' || pageDirName === '.') {
    if (pageUrlBaseName === 'index') {
      ssgUrl = '/';
    } else {
      ssgUrl = `/${pageUrlBaseName}`;
    }
  } else {
    if (pageUrlBaseName === 'index') {
      ssgUrl = pageDirName;
    } else {
      ssgUrl = `${pageDirName}/${pageUrlBaseName}`;
    }
    pageFilePath = `${pageDirName}/${pageFilePath}`;
  }

  return {
    pageFilePath,
    pageComponentName,
    pageUrlBaseName,
    pageDirName,
    ssgUrl,
  };
}

function htmlAttrNameToJsx(attrName: string) {
  const map: { [key: string]: string | undefined } = {
    for: 'htmlFor',
    class: 'className',
  };
  return map[attrName] ?? attrName;
}

export function htmlAttributesToJsx(attributes: {
  [key: string]: string | undefined;
}) {
  return Object.keys(attributes).reduce((str, key) => {
    const val = attributes[key];
    const attrName = htmlAttrNameToJsx(key);
    return `${str} ${attrName}="${val}"`;
  }, '');
}

import { CollectedPage } from '../../../util/types';
import convertToJSX from '../jsxCompiler/convertToJSX';

function htmlAttrNameToJsx(attrName: string) {
  const map: { [key: string]: string | undefined } = {
    for: 'htmlFor',
    class: 'className',
  };
  return map[attrName] ?? attrName;
}

function htmlAttributesToJsx(attributes: {
  [key: string]: string | undefined;
}) {
  return Object.keys(attributes).reduce((str, key) => {
    const val = attributes[key];
    const attrName = htmlAttrNameToJsx(key);
    return `${str} ${attrName}="${val}"`;
  }, '');
}

/**
 * Creates the React <Helmet> contents
 * for a page based on it's header content
 */
export default function createHead(
  page: CollectedPage,
  headComponentName: string,
) {
  const bodyElemJsx = `<body ${htmlAttributesToJsx(page.bodyAttributes)}/>`;
  const htmlElemJsx = `<html ${htmlAttributesToJsx(page.htmlAttributes)}/>`;

  const headJsx = convertToJSX(page.restHeadContent);

  return `
    <${headComponentName}>
      ${htmlElemJsx}
      ${bodyElemJsx}
      ${headJsx}
    </${headComponentName}>
  `;
}

import { types as t } from '@babel/core';
import { SsgConfiguration } from '../types';

const gastbySsgConfig: SsgConfiguration = {
  globalPageImports: [
    'import { Link } from "gatsby"',
    'import { Helmet } from "react-helmet"',
  ],
  name: 'gatsby',
  renderLink: ({ href, children, restAttributes }) => {
    const cmpIndentifier = t.jsxIdentifier('Link');
    const newLinkAttr = t.jsxAttribute(t.jsxIdentifier('to'), href);
    const allAttributes = [...restAttributes, newLinkAttr];
    const opening = t.jsxOpeningElement(cmpIndentifier, allAttributes, false);
    const closing = t.jsxClosingElement(cmpIndentifier);
    const element = t.jsxElement(opening, closing, children, true);
    return element;
  },
  srcFolder: 'src/',
  publicFolder: 'static',
  htmlContainerSelector: '#___gatsby',
  routeNavigateFunctionDefinition: `
import { navigate } from 'gatsby';
  `,
  createPageHead: ({ page, htmlAttributesToJsx, convertToJSX }) => {
    const bodyElemJsx = `<body ${htmlAttributesToJsx(page.bodyAttributes)}/>`;
    const htmlElemJsx = `<html ${htmlAttributesToJsx(page.htmlAttributes)}/>`;

    const headJsx = convertToJSX(page.restHeadContent)
      .replace('<div>', '')
      .replace('</div>', '');

    return `
        <Helmet>
          ${htmlElemJsx}
          ${bodyElemJsx}
          ${headJsx}
        </Helmet>
      `;
  },
};

export default gastbySsgConfig;

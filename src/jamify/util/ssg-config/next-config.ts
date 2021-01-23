import { types as t } from '@babel/core';
import { SsgConfiguration } from '../types';

const nextSsgConfig: SsgConfiguration = {
  globalPageImports: [
    'import Link from "next/link"',
    'import Head from "next/head"',
  ],
  name: 'next',
  renderLink: ({ href, children, restAttributes }) => {
    const cmpIndentifier = t.jsxIdentifier('Link');
    const newLinkAttr = t.jsxAttribute(t.jsxIdentifier('href'), href);
    const opening = t.jsxOpeningElement(cmpIndentifier, [newLinkAttr], false);
    const closing = t.jsxClosingElement(cmpIndentifier);
    const aElem = t.jsxElement(
      t.jsxOpeningElement(t.jsxIdentifier('a'), restAttributes, false),
      t.jsxClosingElement(t.jsxIdentifier('a')),
      children,
      false,
    );
    const element = t.jsxElement(opening, closing, [aElem], false);
    return element;
  },
  srcFolder: '',
  publicFolder: 'public',
  htmlContainerSelector: '#__next',
  routeNavigateFunctionDefinition: `
import Router from "next/router";
const navigate = Router.push.bind(Router);
  `,
  createPageHead: ({ convertToJSX, page, children }) => {
    const headJsx = convertToJSX(page.restHeadContent)
      .replace('<div>', '')
      .replace('</div>', '');

    return `
        <Head>
          ${headJsx}
          ${children}
        </Head>
      `;
  },
};

export default nextSsgConfig;

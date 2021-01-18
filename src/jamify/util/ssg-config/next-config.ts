import { types as t } from '@babel/core';
import { SsgConfiguration } from '../types';

const nextSsgConfig: SsgConfiguration = {
  globalPageImports: [
    'import Link from "next/Link"',
    'import Head from "next/Head"',
  ],
  name: 'next',
  headComponentName: 'Head',
  renderLink: ({ href, children, restAttributes }) => {
    const cmpIndentifier = t.jsxIdentifier('Link');
    const newLinkAttr = t.jsxAttribute(t.jsxIdentifier('href'), href);
    const allAttributes = [...restAttributes, newLinkAttr];
    const opening = t.jsxOpeningElement(cmpIndentifier, allAttributes, false);
    const closing = t.jsxClosingElement(cmpIndentifier);
    const aElem = t.jsxElement(
      t.jsxOpeningElement(t.jsxIdentifier('a'), [], false),
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
};

export default nextSsgConfig;

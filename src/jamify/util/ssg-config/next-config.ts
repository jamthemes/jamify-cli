import { types as t } from '@babel/core';
import { SsgConfiguration } from '../types';

const nextSsgConfig: SsgConfiguration = {
  globalPageImports: [],
  name: 'next',
  renderHead: () => '',
  renderLink: ({ href, children, restAttributes }) => {
    // TODO: adjust to Next.js link
    const cmpIndentifier = t.jsxIdentifier('Link');
    const newLinkAttr = t.jsxAttribute(t.jsxIdentifier('to'), href);
    const allAttributes = [...restAttributes, newLinkAttr];
    const opening = t.jsxOpeningElement(cmpIndentifier, allAttributes, false);
    const closing = t.jsxClosingElement(cmpIndentifier);
    const element = t.jsxElement(opening, closing, children, true);
    return element;
  },
  srcFolder: '',
};

export default nextSsgConfig;

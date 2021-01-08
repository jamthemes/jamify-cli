import { types as t } from '@babel/core';
import { SsgConfiguration } from '../types';

const gastbySsgConfig: SsgConfiguration = {
  globalPageImports: [],
  name: 'gatsby',
  renderHead: () => '',
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
};

export default gastbySsgConfig;

import { types as t } from '@babel/core';
const pluginSyntaxJsx = require('@babel/plugin-syntax-jsx');

import replaceLinksInJSX from './replaceLinksWithBabel';

it('should replace all <a> tags with <Link> components', async () => {
  const jsxStr = '<a href="/index.html">Home</a>';

  const res = await replaceLinksInJSX({
    jsxStr,
    transformUrl: (url) => '/home',
    renderLink: ({ href, children, restAttributes }) => {
      const cmpIndentifier = t.jsxIdentifier('Link');
      const newLinkAttr = t.jsxAttribute(t.jsxIdentifier('to'), href);
      const allAttributes = [...restAttributes, newLinkAttr];
      const opening = t.jsxOpeningElement(cmpIndentifier, allAttributes, false);
      const closing = t.jsxClosingElement(cmpIndentifier);
      const element = t.jsxElement(opening, closing, children, true);
      return element;
    },
  });
  const expectedRes = '<Link to="/home">Home</Link>;';
  expect(res).toBe(expectedRes);
});

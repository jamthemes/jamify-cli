import replaceInlineStyleSrc from '.';

it('should replace all relative assets inside of inline-styles with babel imported assets paths', async () => {
  // AST Example: https://astexplorer.net/#/gist/63a6b6b4ef7b2c6c3ea6e26b91eda969/49b459e0c21f3b0c5defb152829e03f88dd5b1bf
  const jsxStr =
    "<div style={{backgroundImage: 'url(./assets/images/goldfisch.png)'}} />";
  const expectedStr = '<div style={{backgroundImage: `url(${goldfisch})`}} />';
  const imageAssets: any[] = [
    {
      importIdentifier: 'goldfisch',
      src: './assets/images/goldfisch.png',
      originalUrl: './assets/images/goldfisch.png',
    },
  ];
  const res = await replaceInlineStyleSrc({ jsxStr, assets: imageAssets });
  expect(res).toBe(expectedStr);
});

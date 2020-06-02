import replaceLinksInJSX from './replaceLinksWithBabel';

it('should replace all <a> tags with <Link> components', async () => {
  const jsxStr = '<a href="/index.html">Home</a>';
  const res = await replaceLinksInJSX({
    jsxStr,
    hrefPropName: 'to',
    newComponentName: 'Link',
    transformUrl: url => '/home',
  });
  const expectedRes = '<Link to="/home">Home</Link>;';
  expect(res).toBe(expectedRes);
});

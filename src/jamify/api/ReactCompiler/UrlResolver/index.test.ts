import UrlResolver from '.';

it('should resolve local urls to absolute page urls', () => {
  const allPageUrls = [
    'http://localhost:8080/index.html',
    'http://localhost:8080/sub/seeb/index.html',
    'http://localhost:8080/page2.html',
    'http://localhost:8080/sub/page2.html',
  ];
  const urlResolver = new UrlResolver(allPageUrls);
  expect(
    urlResolver.toInternalUrl({
      url: '/',
      pageUrl: 'http://localhost:8080/index.html',
    }),
  ).toBe('http://localhost:8080/');
  expect(urlResolver.toInternalUrl({ url: '/', pageUrl: allPageUrls[1] })).toBe(
    'http://localhost:8080/',
  );
  expect(
    urlResolver.toInternalUrl({
      url: '../page2.html',
      pageUrl: 'http://localhost:8080/sub/seeb/index.html',
    }),
  ).toBe(allPageUrls[3]);
});

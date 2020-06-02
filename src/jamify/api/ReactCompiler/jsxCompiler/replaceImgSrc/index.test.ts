// import replaceImgSrc from '.';

// it('should replace all img src strings with the actual variable values', async () => {
//   const jsxStr = `<img src="test.jpg" srcSet="test.jpg 300w, test.jpg 786w, test.jpg 1280w" />`;
//   const expectedStr =
//     '<img src={goldfisch} srcSet={`${goldfisch} 300w, ${goldfisch} 786w, ${goldfisch} 1280w`}></img>;';
//   const imageAssets: any = [
//     {
//       importIndentifier: 'goldfisch',
//       src: './assets/images/test.jpg',
//       originalUrl: 'test.jpg',
//     },
//   ];
//   const res = await replaceImgSrc({ jsxStr, assets: imageAssets });
//   expect(res).toBe(expectedStr);
// });

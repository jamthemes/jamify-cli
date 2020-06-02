import preventUmdForJsFile from './preventUmdForJsFile';

// This is NO real test! I just used it to test
// the functionality in isolation.
it('Should make a UMD module think that it was loaded in a window context', async () => {
  const jsString = `
  !function(e,n){"function"==typeof define&&define.amd?define(["b"],n):"object"==typeof module&&module.exports?module.exports=(require("b"),{}):e.returnExports=(e.b,{})}("undefined"!=typeof self?self:this,function(e){return{}});
  `;
  const res = await preventUmdForJsFile(jsString);
  console.log(res);
});

// This is NO real test! I just used it to test

import bindGlobalsToWindow from './bindGlobalsToWindow';

it('Should bind global vars explicitly to window', async () => {
  const jsString = `
  function isResponsive() {
    console.log('Resonsive it is.')
  }
  var elementorFrontendConfig = {"environmentMode":{"edit":false,"wpPreview":false},"is_rtl":false,"breakpoints":{"xs":0,"sm":480,"md":768,"lg":1025,"xl":1440,"xxl":1600},"version":"2.8.3","urls":{"assets":"https:\/\/demo.athemes.com\/airi-agency\/wp-content\/plugins\/elementor\/assets\/"},"settings":{"page":[],"general":{"elementor_global_image_lightbox":"yes"},"editorPreferences":[]},"post":{"id":4,"title":"Home","excerpt":""}};
  `;
  const res = await bindGlobalsToWindow(jsString);
  console.log(res);
});

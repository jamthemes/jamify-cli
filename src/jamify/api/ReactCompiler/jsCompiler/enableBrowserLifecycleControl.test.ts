import enableBrowserLifecycleControl from './enableBrowserLifecycleControl';

it(`Should make sure that browser events like 'load' and 'DOMContentLoaded' can be controlled during runtime to be able to emulate all browser lifecycle events.`, async () => {
  const jsString = `
    let c;
    c = document;
    if (c.readyState === 'complete') {
      console.log('It isse compelate')
    }
  `;
  const res = await enableBrowserLifecycleControl(jsString);
  console.log(res);
});

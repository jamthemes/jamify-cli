import * as babel from '@babel/core';
import preventBrowserEventsPlugin from './babel/prevent-browser-events';

/**
 * Makes sure that browser events like
 * 'load' and 'DOMContentLoaded' can
 * be controlled during runtime
 * to be able to emulate all browser
 * lifecycle events.
 */
export default async function enableBrowserLifecycleControl(jsString: string) {
  const res = await babel.transformAsync(jsString, {
    plugins: [
      [
        preventBrowserEventsPlugin,
        {
          events: ['load', 'DOMContentLoaded', 'readystatechange'],
        },
      ],
    ],
    sourceType: 'unambiguous',
  });
  return res ? res.code || '' : '';
}

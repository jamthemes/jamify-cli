import * as babel from '@babel/core';
import ComponentRegistry from '../../../ComponentRegistry';
import replaceComponentsPlugin, { result } from './babel-plugin';
import { HtmlComponent } from '../../../../util/types/htmlComponent';
import { transformHrefToSsgUrl } from '../util';
import UrlResolver from '../../UrlResolver';

const pluginSyntaxJsx = require('@babel/plugin-syntax-jsx');

interface ReplaceHtmlComponentsInJsxParams {
  jsxStr: string;
  componentRegistry: ComponentRegistry;
  urlResolver: UrlResolver;
  currentPageUrl: string;
}

interface PluginOptions {
  componentRegistry: ComponentRegistry;
  transformUrl: (url: string) => string | null;
}

interface Result {
  newJsx: string;
  importedComponents: HtmlComponent[];
}

/**
 * Look for html components
 * and replace them with their
 * React counterpart
 */
export default async function replaceHtmlComponentsInJsx({
  jsxStr,
  componentRegistry,
  currentPageUrl,
  urlResolver,
}: ReplaceHtmlComponentsInJsxParams): Promise<Result> {
  const pluginOptions: PluginOptions = {
    componentRegistry,
    transformUrl: url =>
      transformHrefToSsgUrl({
        url,
        currentPageUrl,
        urlResolver,
      }),
  };
  const res = await babel.transformAsync(jsxStr, {
    plugins: [pluginSyntaxJsx, [replaceComponentsPlugin, pluginOptions]],
  });
  const newJsx = res ? res.code || '' : '';
  return {
    newJsx,
    ...result,
  };
}

import * as babel from '@babel/core';
const pluginSyntaxJsx = require('@babel/plugin-syntax-jsx');

import { fsReadFile } from '../../../util/fs';

it('Should correctly parse that JSX', async () => {
  const jsx = (await fsReadFile('.temp/jsx_temp.jsx')).toString();
  const res = await babel.transformAsync(jsx, {
    plugins: [pluginSyntaxJsx],
  });
  const code = res ? res.code || '' : '';
  console.log('parsed', code);
});

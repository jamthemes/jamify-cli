import yargs from 'yargs';
import path from 'path';
import {
  loadEnv,
  setupErrorHandling,
  setupCliContext,
  loadPackageJson,
} from './util';

const userCwd = process.cwd();

function pathToAbsolute(val: string = '') {
  if (!val) {
    return '';
  }
  if (path.isAbsolute(val)) {
    return val;
  }
  return path.join(userCwd, val);
}

export default async function setupCli() {
  // Load envs from .env for development
  loadEnv();

  setupErrorHandling();
  setupCliContext();

  const packageJson = await loadPackageJson();

  const TEST_CMD = (process.env.DEV_COMMAND || '').split(' ');
  let cmdToUse =
    process.env.NODE_ENV === 'development' ? TEST_CMD : process.argv.slice(2);

  yargs.option('sourceFolder', {
    alias: 'src',
    type: 'string',
    describe:
      'Instead of an URL, a folder containing at least an index.html file can be specified',
  });
  yargs.option('urls', {
    alias: 'u',
    type: 'array',
    describe:
      'URLs to convert. If recursive is true, only one URL will be converted',
  });
  yargs.option('outFolder', {
    alias: 'o',
    type: 'string',
    require: true,
    describe: 'Converted website will go here',
  });
  yargs.option('recursive', {
    alias: 'r',
    type: 'boolean',
    describe:
      'If this is set to true, only the first url in the urls array is used and linked pages are followed recursively',
  });

  yargs.command(
    'gatsby',
    'Convert a website to a GatsbyJS project',
    () => {},
    async (args: any) => {
      const { default: JamifyConverter } = await import('../jamify/workflow');
      const jamifyConverter = new JamifyConverter({
        outFolder: pathToAbsolute(args.outFolder),
        recursive: args.recursive,
        urls: args.urls,
        sourceFolder: pathToAbsolute(args.sourceFolder),
        targetSsg: 'gatsby',
      });
      await jamifyConverter.run();
    },
  );

  yargs.command(
    'next',
    'Convert a website to a Next.js project',
    () => {},
    async (args: any) => {
      const { default: JamifyConverter } = await import('../jamify/workflow');
      const jamifyConverter = new JamifyConverter({
        outFolder: pathToAbsolute(args.outFolder),
        recursive: args.recursive,
        urls: args.urls,
        sourceFolder: pathToAbsolute(args.sourceFolder),
        targetSsg: 'next',
      });
      await jamifyConverter.run();
    },
  );

  yargs.version(packageJson.version).parse(cmdToUse);
}

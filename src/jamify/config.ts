import path from 'path';

const standardOutFolder = path.resolve(path.join(__dirname, '../../../out'));

const config = {
  TEMPLATE_NAME: process.env.TEMPLATE_NAME as string,
  TEMPLATE_URL: process.env.TEMPLATE_URL as string,
  DO_NOT_FOLLOW_LINKS:
    process.env.DO_NOT_FOLLOW_LINKS === 'true' ? true : false,
  OUT_FOLDER:
    (process.env.OUT_FOLDER as string | undefined) || standardOutFolder,
};

export default config;

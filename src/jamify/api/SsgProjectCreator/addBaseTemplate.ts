import { fsCopyDir } from '../../util/fs';
import path from 'path';
import { getStaticDir } from '../../util/path';

async function addBaseTemplate(outDir: string, ssgName: string) {
  const BASE_FOLDER = path.join(getStaticDir(), `${ssgName}-base-template`);

  // Copy content of gatsby base template
  await fsCopyDir(BASE_FOLDER, outDir);
}

export default addBaseTemplate;

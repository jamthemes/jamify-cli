import fs from 'fs';
import { promisify } from 'util';
import ncp from 'ncp';

export const fsExists = promisify(fs.exists);

export const fsMkDir = promisify(fs.mkdir);

export const fsWriteFile = promisify(fs.writeFile);

export const fsReadFile = promisify(fs.readFile);

export const fsCopyFile = promisify(fs.copyFile);

export const fsUnlink = promisify(fs.unlink);

export const fsCopyDir = promisify(ncp);

export const fsMkDirIfnotExists = async (dir: string) => {
  if (!(await fsExists(dir))) {
    await fsMkDir(dir, { recursive: true });
  }
};

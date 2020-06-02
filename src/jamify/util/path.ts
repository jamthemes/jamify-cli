import path from 'path';

export function getStaticDir() {
  const jamifyRootDir = path.join(__dirname, '../../..');
  const staticFilesPath = path.join(jamifyRootDir, 'static');
  return staticFilesPath;
}

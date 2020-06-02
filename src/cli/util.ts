import path from 'path';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

/** "Normalizes" the behaviour of the CLI
 * no matter if it is executed by the user
 * in a project folder or by nodemon in
 * development mode
 */
export function setupCliContext() {
  // Set CWD to path of Cantara
  process.chdir(path.join(__dirname, '..', '..'));
}

/**
 * Loads .env file for development
 * (only during development)
 */
export function loadEnv() {
  if (process.env.NODE_ENV === 'development') {
    dotenv.config();
  }
}

/**
 * Catch uncaught errors
 */
export function setupErrorHandling() {
  process.on('uncaughtException', (err) => {
    console.log(err);
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
  });
}

export async function loadPackageJson() {
  const packageJsonPath = path.resolve('package.json');
  const fileContent = readFileSync(packageJsonPath).toString();
  return JSON.parse(fileContent);
}

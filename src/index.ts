#!/usr/bin/env node
import setupCli from './cli';

function main() {
  process.env.NODE_ENV = 'development';
  setupCli();
}

main();

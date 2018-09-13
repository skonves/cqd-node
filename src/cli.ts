#!/usr/bin/env node

import { run as runLoad } from './commands/load';

const command = process.argv[2];

switch (command) {
  case 'load': {
    runLoad();
    break;
  }
  case undefined:
  case '-h':
  case '--help': {
    console.log('HALP!');
    break;
  }
  case '-v':
  case '--version': {
    console.log('the version');
    break;
  }
  default: {
    console.error(`Unknown command ${command}`);
  }
}

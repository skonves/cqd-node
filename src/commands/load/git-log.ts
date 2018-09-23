import { Readable } from 'stream';
import { spawn } from 'child_process';

export type GitParserOptions = {
  before?: string;
  after?: string;
  number?: number;
  ignoreSpaceChange?: boolean;
};

export function gitLog(path: string, options?: GitParserOptions): Readable {
  let optionsString = '';

  if (options && options.number) {
    optionsString += ` -n ${options.number}`;
  }
  if (options && options.after) {
    optionsString += ` --after="${options.after}"`;
  }
  if (options && options.before) {
    optionsString += ` --before="${options.before}"`;
  }
  if (options && options.ignoreSpaceChange) {
    optionsString += ` --ignore-space-change`;
  }

  return spawn(`bash`, [
    '-c',
    `git --git-dir=${path} log --pretty=format:'[%h] %an %ad %s' --date=iso --reverse --numstat${optionsString}`,
  ]).stdout;
}

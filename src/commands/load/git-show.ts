import { Readable } from 'stream';
import { spawn } from 'child_process';

export function gitShow(
  path: string,
  hash: string,
  fileName: string,
): Readable {
  return spawn(`bash`, [
    '-c',
    `git --git-dir=${path} show ${hash}:"${fileName}"`,
  ]).stdout;
}

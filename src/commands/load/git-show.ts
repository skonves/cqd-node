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

export async function isDeleted(
  path: string,
  hash: string,
  fileName: string,
): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const proc = spawn(`bash`, [
      '-c',
      `git --git-dir=${path} log ${hash} -1 --name-status --format=%h  -- "${fileName}"`,
    ]);

    let str: string = '';

    proc.stdout.on('data', m => {
      str += m.toString();
    });

    proc.stdout.on('close', m => {
      const win = str === `${hash}\n\nD\t${fileName}\n`;
      resolve(win);
    });
  });
}

import { Readable } from 'stream';
import { spawn } from 'child_process';

export function gitShow(
  path: string,
  hash: string,
  fileName: string,
): Promise<Readable> {
  return new Promise((resolve, reject) => {
    const proc = spawn(`bash`, [
      '-c',
      `git --git-dir=${path} show ${hash}:"${fileName}"`,
    ]);

    let rejected = false;

    proc.stderr.on('data', err => {
      rejected = true;
      reject(err);
    });

    proc.stderr.on('end', () => {
      if (!rejected) resolve(proc.stdout);
    });
  });
}

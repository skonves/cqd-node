import * as path from 'path';

export function isGitDir(dir: string): boolean {
  return dir.split(path.sep).slice(-1)[0] === '.git';
}

export function addGitDir(dir: string): string {
  if (isGitDir(dir)) return dir;

  return (
    (dir.startsWith(path.sep) ? path.sep : '') +
    path.join(...dir.split(path.sep), '.git')
  );
}

export function removeGitDir(dir: string): string {
  if (!isGitDir(dir)) return dir;

  return (
    (dir.startsWith(path.sep) ? path.sep : '') +
    path.join(...dir.split(path.sep).slice(0, -1))
  );
}

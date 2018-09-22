import { LineStats, FileParserStream } from './file-parser';
import { gitShow } from './git-show';

export async function getLineStats(
  gitPath: string,
  hash: string,
  fileName: string,
): Promise<LineStats> {
  return new Promise<LineStats>((resolve, reject) => {
    const fileParserStream = new FileParserStream();

    gitShow(gitPath, hash, fileName)
      .pipe(fileParserStream)
      .on('finish', () => {
        resolve(fileParserStream.getStats());
      })
      .on('error', err => reject(err));
  });
}

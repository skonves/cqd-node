import { LineStats, FileParserStream } from './file-parser';
import { gitShow, isDeleted } from './git-show';

export async function getLineStats(
  gitPath: string,
  hash: string,
  fileName: string,
): Promise<LineStats> {
  return new Promise<LineStats>(async (resolve, reject) => {
    const fileParserStream = new FileParserStream();

    try {
      (await gitShow(gitPath, hash, fileName))
        .pipe(fileParserStream)
        .on('finish', () => {
          const stats = fileParserStream.getStats();

          if (stats.lineCount === 0) {
            isDeleted(gitPath, hash, fileName).then(
              value => (value ? reject('file is deleted') : resolve(stats)),
            );
          } else {
            resolve(fileParserStream.getStats());
          }
        })
        .on('error', err => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

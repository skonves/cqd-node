import { Transform, TransformCallback } from 'stream';
import { Commit, File } from './git-parser';
import { getLineStats } from './utils';

export class LineStatsReader extends Transform {
  constructor(private readonly gitPath: string) {
    super({ objectMode: true });
  }

  _transform(
    chunk: Commit,
    encoding: string,
    callback: TransformCallback,
  ): void {
    if (chunk.files.length) {
      Promise.all(
        chunk.files.map(file => this.getStats(chunk.hash, file)),
      ).then(updatedFiles => {
        this.push({
          ...chunk,
          files: updatedFiles,
        });
        callback();
      });
    } else {
      callback();
    }
  }

  private async getStats(hash: string, file: File): Promise<File> {
    try {
      const stats = await getLineStats(this.gitPath, hash, file.name);
      return { ...file, stats };
    } catch {
      return { ...file, deleted: true };
    }
  }
}

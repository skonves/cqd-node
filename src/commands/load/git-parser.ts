import { Transform, TransformCallback } from 'stream';
import { LineStats } from './file-parser';

const commitRegex = /^\[([0-9a-f]+)\]\s(.*?)\s([0-9]{4}-[0-9]{2}-[0-9]{2}\s[0-9]{2}:[0-9]{2}:[0-9]{2}\s[-+][0-9]{4})\s(.*?)$/;
const fileRegex = /^([0-9]+)\s+([0-9]+)\s+(.*?)$/;

export class GitParserStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    chunk: Buffer,
    encoding: string,
    callback: TransformCallback,
  ): void {
    const lines = (this.trivia + chunk.toString()).split('\n');
    this.trivia = '';

    for (const line of lines) {
      if (line[0] === '[') {
        if (this.currentCommit) {
          this.doPush();
        }

        const match = commitRegex.exec(line.trim());

        if (!match) {
          this.trivia = line;
          continue;
        } else {
          this.currentCommit = {
            hash: match[1],
            author: match[2],
            date: new Date(match[3]),
            message: match[4],
            files: [],
          };
        }
      } else if (!Number.isNaN(Number(line[0]))) {
        try {
          const match = fileRegex.exec(line.trim());

          if (!match) {
            this.trivia = line;
          } else {
            const file = {
              additions: Number(match[1]),
              deletions: Number(match[2]),
              name: match[3],
            };

            this.currentCommit.files.push(file);
          }
        } catch (err) {
          console.error(line, chunk.toString(), err);
          process.exit(1);
        }
      } else {
        continue;
      }
    }
    if (this.currentCommit && this.currentCommit.files.length) {
      this.doPush();
      this.currentCommit.files = [];
    }
    callback();
  }

  private doPush() {
    if (
      !this.currentCommit.files.length &&
      this.currentCommit.hash === this.lastPushed
    ) {
      // Don't push an empty commit if we have already pushed files for the same commit
      return;
    }
    this.push({ ...this.currentCommit });
    if (this.currentCommit.files.length) {
      this.lastPushed = this.currentCommit.hash;
    } else {
      this.lastPushed = undefined;
    }
  }

  private currentCommit: Commit;
  private trivia: string = '';
  private lastPushed: string;
}

export type Commit = {
  hash: string;
  author: string;
  date: Date;
  message: string;
  files: File[];
};

export type File = {
  additions: number;
  deletions: number;
  name: string;
  stats?: LineStats;
};

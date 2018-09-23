import { Transform, TransformCallback } from 'stream';
import { LineStats } from './file-parser';

const commitRegex = /^\[([0-9a-f]+)\]\s(.*?)\s([0-9]{4}-[0-9]{2}-[0-9]{2}\s[0-9]{2}:[0-9]{2}:[0-9]{2}\s[-+][0-9]{4})\s(.*?)$/;
const fileRegex = /^([0-9]+)\s+([0-9]+)\s+(.*?)$/;
const renameRegex = /^(.*?){(.*?)\s=>\s(.*?)}(.*?)$/;

export class GitParserStream extends Transform {
  constructor() {
    super({ objectMode: true });
    this.parser = new GitParser();
  }

  _transform(
    chunk: Buffer,
    encoding: string,
    callback: TransformCallback,
  ): void {
    for (const commit of this.parser.parse(chunk.toString())) {
      this.push(commit);
    }
    callback();
  }

  private readonly parser: GitParser;
}

export class GitParser {
  *parse(str: string): IterableIterator<Commit> {
    const lines = (this.remainder + str).split('\n');
    this.remainder = '';

    let index = -1;

    for (const line of lines) {
      index++;
      if (index === lines.length - 1 && !str.endsWith('\n')) {
        this.remainder = line;
        continue;
      } else if (line[0] === '[') {
        const result = this.doPush();
        if (result) yield result;

        const match = commitRegex.exec(line.trim());

        if (!match) {
          this.remainder = line;
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
            this.remainder = line;
          } else {
            const renameMatch = renameRegex.exec(match[3]);
            const spl = match[3].split(' => ');

            const previousName = renameMatch
              ? `${renameMatch[1]}${renameMatch[2]}${renameMatch[4]}`
              : spl.length === 2
                ? spl[0]
                : undefined;

            const name = renameMatch
              ? `${renameMatch[1]}${renameMatch[3]}${renameMatch[4]}`
              : spl.length === 2
                ? spl[1]
                : match[3];

            const file = {
              additions: Number(match[1]),
              deletions: Number(match[2]),
              previousName,
              name,
            };

            this.currentCommit.files.push(file);
          }
        } catch (err) {
          console.error(line, str, err);
          process.exit(1);
        }
      } else {
        continue;
      }
    }
    if (this.currentCommit && this.currentCommit.files.length) {
      const result = this.doPush();
      if (result) yield result;
      this.currentCommit.files = [];
    }
  }

  private doPush(): Commit {
    if (
      !this.currentCommit ||
      (!this.currentCommit.files.length &&
        this.currentCommit.hash === this.lastPushed)
    ) {
      // Don't return an empty commit if we have already returned files for the same commit
      return undefined;
    }
    const result = { ...this.currentCommit };
    this.lastPushed = result.files.length ? result.hash : undefined;

    return result;
  }

  private currentCommit: Commit;
  private lastPushed: string;
  private remainder: string = '';
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
  previousName?: string;
  name: string;
  deleted?: boolean;
  stats?: LineStats;
};

import { Writable } from 'stream';

export class FileParserStream extends Writable {
  _write(chunk: Buffer, encoding: string, callback: () => void): void {
    const lines = chunk.toString().split('\n');

    for (const line of lines) {
      this.lineCount++;
      if (!line.trim().length) this.blankLineCount++;
      this.indents.push(line.length - line.trimLeft().length);
    }
    callback();
  }

  getStats(): LineStats {
    const total = this.indents.length
      ? this.indents.reduce((a, b) => a + b, 0)
      : 0;

    const mean = this.indents.length ? total / this.indents.length : 0;

    const sd = this.indents.length
      ? this.indents
          .map(x => (x - mean) * (x - mean))
          .reduce((a, b) => a + b, 0) / this.indents.length
      : 0;

    const max = this.indents.length
      ? this.indents.reduce((a, b) => Math.max(a, b), 0)
      : 0;

    return {
      lineCount: this.lineCount,
      blankLineCount: this.blankLineCount,
      total,
      mean,
      sd,
      max,
    };
  }

  private lineCount: number = 0;
  private blankLineCount: number = 0;
  private indents: number[] = [];
}

export type LineStats = {
  lineCount: number;
  blankLineCount: number;
  total: number;
  mean: number;
  sd: number;
  max: number;
};

import { Writable } from 'stream';

export class FileParserStream extends Writable {
  private readonly fileParser = new FileParser();

  _write(chunk: Buffer, encoding: string, callback: () => void): void {
    this.fileParser.parse(chunk.toString());
    callback();
  }

  getStats(): LineStats {
    return this.fileParser.getStats();
  }
}

export class FileParser {
  parse(str: string): void {
    const lines = (this.remainder + str).split('\n');

    let index = -1;
    for (const line of lines) {
      index++;

      if (index === lines.length - 1) {
        this.remainder = line;
        continue;
      }

      const lineContentLength = line.trimLeft().length;

      this.lineCount++;
      if (!lineContentLength) this.blankLineCount++;
      this.indents.push(line.length - lineContentLength);
    }
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

  private remainder: string = '';
  private indents: number[] = [];
  private lineCount: number = 0;
  private blankLineCount: number = 0;
}

export type LineStats = {
  lineCount: number;
  blankLineCount: number;
  total: number;
  mean: number;
  sd: number;
  max: number;
};

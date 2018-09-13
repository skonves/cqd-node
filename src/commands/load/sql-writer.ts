import { Writable } from 'stream';
import { Database } from 'sqlite3';
import { Commit, File } from './git-parser';

export class SqliteWriter extends Writable {
  constructor(private readonly db: Database) {
    super({ objectMode: true });
  }

  async init() {
    await this.run(
      'CREATE TABLE IF NOT EXISTS commits (hash VARCHAR(9) PRIMARY KEY, author VARCHAR(100), date DATE, message TEXT);',
    );
    await this.run(
      `CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash VARCHAR(9),
        name VARCHAR(255),
        additions INTEGER,
        deletions INTEGER,
        lines INTEGER,
        blank_lines INTEGER,
        total_ind INTEGER,
        mean_ind REAL,
        sd_ind REAL,
        max_ind INTEGER,
        FOREIGN KEY(hash) REFERENCES commits(hash)
      );`,
    );
    await this.run(
      'CREATE UNIQUE INDEX IF NOT EXISTS ux_commit_file ON files (hash, name);',
    );
  }

  _write(
    commit: Commit,
    encoding: string,
    callback: (error?: Error | null) => void,
  ): void {
    this.doWrite(commit)
      .then(() => callback())
      .catch(err => console.error('ERR => ', err));
  }

  private async doWrite(commit: Commit) {
    (process.stdout as any).clearLine();
    (process.stdout as any).cursorTo(0);
    process.stdout.write(`date: ${commit.date}`);
    await this.run(
      `INSERT OR IGNORE INTO commits (hash, author, date, message) VALUES (?,?,?,?)`,
      [commit.hash, commit.author, commit.date.toISOString(), commit.message],
    );

    this.commitsWritten += 1;

    if (commit.files.length) {
      await this.writeFiles(commit.hash, commit.files);
    }
  }

  private async writeFiles(hash: string, files: File[]): Promise<void> {
    const fileFieldCount = 10;
    const maxParamsPerQuery = 999;
    const batchCount = Math.ceil(
      (files.length * fileFieldCount) / maxParamsPerQuery,
    );

    const filesPerBatch = Math.ceil(files.length / batchCount);

    await Promise.all(
      [...Array(batchCount).keys()]
        .map((_, i) => files.slice(i * filesPerBatch, (i + 1) * filesPerBatch))
        .map(async batchFiles => {
          const stmt = `INSERT OR IGNORE INTO files (hash, name, additions, deletions, lines, blank_lines, total_ind, mean_ind, sd_ind, max_ind) VALUES ${batchFiles
            .map(() => '(?,?,?,?,?,?,?,?,?,?)')
            .join(',')}`;

          await this.run(
            stmt,
            batchFiles
              .map(file => [
                hash,
                file.name,
                file.additions,
                file.deletions,
                file.stats ? file.stats.lineCount : 0,
                file.stats ? file.stats.blankLineCount : 0,
                file.stats ? file.stats.total : 0,
                file.stats ? file.stats.mean : 0,
                file.stats ? file.stats.sd : 0,
                file.stats ? file.stats.max : 0,
              ])
              .reduce((a, b) => a.concat(b), []),
          );

          this.filesWritten += batchFiles.length;
        }),
    );
  }

  private filesWritten: number = 0;
  private commitsWritten: number = 0;

  private run(sql: string): Promise<void>;
  private run(sql: string, params: any);
  private run(sql: string, params?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, err => (err ? reject(err) : resolve()));
    });
  }
}

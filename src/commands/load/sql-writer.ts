import { Writable } from 'stream';
import { Database } from 'sqlite3';
import { Commit, File } from './git-parser';
import { DbBase } from '../../db';

export class SqliteWriterStream extends Writable {
  constructor(db: Database) {
    super({ objectMode: true });
    this.sqliteWriter = new SqliteWriter(db);
  }

  private readonly sqliteWriter: SqliteWriter;

  _write(
    commit: Commit,
    encoding: string,
    callback: (error?: Error | null) => void,
  ): void {
    this.sqliteWriter
      .writeCommit(commit)
      .then(() => callback())
      .catch(err => console.error('ERR => ', err));
  }
}

export class SqliteWriter extends DbBase {
  constructor(db: Database) {
    super(db);
  }

  async writeCommit(commit: Commit): Promise<void> {
    console.log({ hash: commit.hash, date: commit.date });
    await this.run(
      `INSERT OR IGNORE INTO commits (hash, author, date, message) VALUES (?,?,?,?)`,
      [commit.hash, commit.author, commit.date.toISOString(), commit.message],
    );

    for (const file of commit.files) {
      await this.writeFile(commit.hash, commit.date, file);
    }

    if (this.lastHash !== commit.hash) this.commitsWritten++;
  }

  async writeFile(hash: string, date: Date, file: File): Promise<void> {
    const fileName = await this.get(
      'SELECT n.* FROM file_names n JOIN files f ON n.file_id = f.id WHERE (n.name = ? OR n.name = ?) AND n.from_date <= ? AND (n.to_date IS NULL OR n.to_date > ?) LIMIT 1',
      [file.previousName || file.name, file.name, date, date],
    );

    let fileId: number;
    let fileNameId: number;
    let change: string;

    if (fileName) {
      fileId = fileName.file_id;
      fileNameId = fileName.id;
      change = 'U';

      if (fileName.name === file.previousName && fileName.name !== file.name) {
        await this.run('UPDATE file_names SET to_date = ? WHERE id = ?', [
          date,
          fileNameId,
        ]);
        fileNameId = (await this.run(
          'INSERT INTO file_names (file_id, name, from_date) VALUES (?,?,?)',
          [fileId, file.name, date],
        )).lastID;
        change = 'R';
      }
    } else {
      fileId = (await this.run('INSERT INTO files (deleted) VALUES (?)', [
        false,
      ])).lastID;

      fileNameId = (await this.run(
        'INSERT INTO file_names (file_id, name, from_date) VALUES (?,?,?)',
        [fileId, file.name, date],
      )).lastID;
      change = 'A';
    }

    await this.run(
      'UPDATE changes SET until_hash = ? WHERE hash <> ? AND until_hash IS NULL AND file_id = ?',
      [hash, hash, fileId],
    );

    await this.run(
      `
      INSERT OR IGNORE INTO changes (
        hash, file_id, file_name_id, change,
        additions, deletions, lines, blank_lines, total_ind, mean_ind, sd_ind, max_ind)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `,
      [
        hash,
        fileId,
        fileNameId,
        file.stats ? change : 'D',
        file.additions,
        file.deletions,
        file.stats ? file.stats.lineCount : 0,
        file.stats ? file.stats.blankLineCount : 0,
        file.stats ? file.stats.total : 0,
        file.stats ? file.stats.mean : 0,
        file.stats ? file.stats.sd : 0,
        file.stats ? file.stats.max : 0,
      ],
    );
  }

  private commitsWritten: number = 0;
  private lastHash: string = '';
}

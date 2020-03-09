import { Database, RunResult } from 'sqlite3';

export async function open(location: string): Promise<Database> {
  console.log(`Opening database at ${location}`);

  return new Promise<Database>((resolve, reject) => {
    const db = new Database(location, err => (err ? reject(err) : resolve(db)));
  }).then(init);
}

async function init(db: Database): Promise<Database> {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS commits (
      hash VARCHAR(9) PRIMARY KEY,
      author VARCHAR(100) NOT NULL,
      date DATE NOT NULL,
      message TEXT NOT NULL
    ) WITHOUT ROWID;`,
  );
  await run(db, 'CREATE INDEX IF NOT EXISTS ix_commit_date ON commits(date);');

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deleted INTEGER NOT NULL DEFAULT 0
    );`,
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS file_names (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NULL,

      FOREIGN KEY(file_id) REFERENCES files(id)
    );`,
  );
  await run(
    db,
    'CREATE INDEX IF NOT EXISTS ix_file_name_name ON file_names(name);',
  );
  await run(
    db,
    'CREATE INDEX IF NOT EXISTS ix_file_name_from_date ON file_names(from_date);',
  );
  await run(
    db,
    'CREATE INDEX IF NOT EXISTS ix_file_name_to_date ON file_names(to_date);',
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash VARCHAR(9) NOT NULL,
      date DATE NOT NULL,
      until_hash VARCHAR(9) NULL,
      until_date DATE NULL,
      file_id INTEGER NOT NULL,
      file_name_id INTEGER NOT NULL,
      change TEXT(1) NOT NULL,

      additions INTEGER,
      deletions INTEGER,
      lines INTEGER,
      blank_lines INTEGER,
      total_ind INTEGER,
      mean_ind REAL,
      sd_ind REAL,
      max_ind INTEGER,

      FOREIGN KEY(hash) REFERENCES commits(hash),
      FOREIGN KEY(until_hash) REFERENCES commits(hash),
      FOREIGN KEY(file_id) REFERENCES files(id),
      FOREIGN KEY(file_name_id) REFERENCES file_names(id)
    );`,
  );
  await run(
    db,
    'CREATE UNIQUE INDEX IF NOT EXISTS ux_changes_hash_file_id ON changes (hash, file_id);',
  );
  await run(
    db,
    'CREATE UNIQUE INDEX IF NOT EXISTS ux_changes_until_hash_file_id ON changes (hash, until_hash, file_id);',
  );
  await run(
    db,
    'CREATE INDEX IF NOT EXISTS ux_changes_date ON changes(date);',
  );
  await run(
    db,
    'CREATE INDEX IF NOT EXISTS ux_changes_until_date ON changes(until_date);',
  );

  return db;
}

function run(db: Database, sql: string): Promise<void>;
function run(db: Database, sql: string, params: any);
function run(db: Database, sql: string, params?: any): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, err => (err ? reject(err) : resolve()));
  });
}

export class DbBase {
  constructor(private readonly db: Database) {}

  protected run(sql: string): Promise<RunResult>;
  protected run(sql: string, params: any): Promise<RunResult>;
  protected run(sql: string, params?: any): Promise<RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        err ? reject(err) : resolve(this);
      });
    });
  }

  protected get(sql: string): Promise<any>;
  protected get(sql: string, params: any): Promise<any>;
  protected get(sql: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, function(err, row) {
        err ? reject(err) : resolve(row);
      });
    });
  }

  all(sql: string): Promise<any[]>;
  all(sql: string, params: any): Promise<any[]>;
  all(sql: string, params?: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, function(err, rows) {
        err ? reject(err) : resolve(rows);
      });
    });
  }
}

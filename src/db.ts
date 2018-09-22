import { Database } from 'sqlite3';

export async function open(location: string): Promise<Database> {
  console.log(`Opening database at ${location}`);

  return new Promise<Database>((resolve, reject) => {
    const db = new Database(location, err => (err ? reject(err) : resolve(db)));
  }).then(init);
}

async function init(db: Database): Promise<Database> {
  await run(
    db,
    'CREATE TABLE IF NOT EXISTS commits (hash VARCHAR(9) PRIMARY KEY, author VARCHAR(100), date DATE, message TEXT);',
  );
  await run(
    db,
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
  await run(
    db,
    'CREATE UNIQUE INDEX IF NOT EXISTS ux_commit_file ON files (hash, name);',
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

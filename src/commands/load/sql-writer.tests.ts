import { open } from '../../db';
import { SqliteWriter } from './sql-writer';
import { Commit } from './git-parser';

describe('SqlWriter', () => {
  it('works', async () => {
    // ARRANGE

    const db = await open(':memory:');
    const sqlWriter = new SqliteWriter(db);

    const commitA: Commit = {
      hash: 'aaaaaaaaa',
      date: new Date(2014, 4, 4),
      author: 'John Doe',
      message: 'test commit A',
      files: [
        {
          additions: 5,
          deletions: 5,
          name: 'somefile.ext',
          stats: {
            lineCount: 10,
            blankLineCount: 0,
            total: 0,
            max: 0,
            mean: 0,
            sd: 0,
          },
        },
      ],
    };

    const commitB: Commit = {
      hash: 'aaaaaaaaa',
      date: new Date(2014, 4, 4),
      author: 'John Doe',
      message: 'test commit A',
      files: [
        {
          additions: 5,
          deletions: 5,
          previousName: 'xxx.ext',
          name: 'yyy.ext',
          stats: {
            lineCount: 10,
            blankLineCount: 0,
            total: 0,
            max: 0,
            mean: 0,
            sd: 0,
          },
        },
      ],
    };

    // ACT
    await sqlWriter.writeCommit(commitA);
    await sqlWriter.writeCommit(commitB);
    await sqlWriter.writeCommit(commitB);

    // ASSERT
    console.log(await sqlWriter.all('SELECT * FROM commits'));
    console.log(await sqlWriter.all('SELECT * FROM files'));
    console.log(
      await sqlWriter.all('SELECT *, date(from_date) f FROM file_names'),
    );
    console.log(await sqlWriter.all('SELECT * FROM changes'));
  });
});

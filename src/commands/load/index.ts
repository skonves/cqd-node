import { create, validators } from 'posix-argv-parser';
import * as path from 'path';

import { SqliteWriter } from './sql-writer';
import { gitLog, GitParserOptions } from './git-log';
import { GitParserStream } from './git-parser';
import { Database } from 'sqlite3';
import { LineStatsReader } from './line-stats-reader';
import { isDate } from 'util';

import { open as openDatabase } from '../../db';
import { addGitDir } from '../../utils';

const args = create();

args.createOption(['-n', '--max-count'], {
  hasValue: true,
  validators: [
    (opt: { signature?: string; value: string; hasValue: boolean }): any => {
      if (!opt.hasValue) {
        return opt;
      } else if (Number.isNaN(Number(opt))) {
        throw new Error(`${opt.value} is not a number`);
      } else if (!Number.isInteger(Number(opt))) {
        throw new Error(`${opt.value} is not an integer`);
      } else if (!Number.isInteger(Number(opt))) {
        throw new Error(`${opt.value} is not an integer`);
      } else if (Number(opt) < 1) {
        throw new Error(`${opt.value} is not greater than 1`);
      }
    },
  ],
  transform: (value: string) =>
    typeof value === 'undefined' ? undefined : parseInt(value, 10),
});

args.createOption(['--since', '--after'], {
  hasValue: true,
  validators: [date],
  transform(value: string) {
    return value ? new Date(value) : undefined;
  },
});

args.createOption(['--until', '--before'], {
  hasValue: true,
  validators: [date],
  transform(value: string) {
    return value ? new Date(value) : undefined;
  },
});

args.createOperand('gitPath', {
  description: 'Path to the git repository',
  validators: [validators.directory()],
});

export function run() {
  args.parse(process.argv.slice(3), (errors, options) => {
    if (errors) {
      console.error(errors);
    } else {
      const rawGitPath: string = addGitDir(
        options['gitPath'].isSet ? options['gitPath'].value : process.cwd(),
      );

      const gitPath = rawGitPath.startsWith(path.sep)
        ? rawGitPath
        : path.resolve(rawGitPath);

      const parserOptions: GitParserOptions = {
        ignoreSpaceChange: true,
        number: options['-n'].value,
        after: options['--after'].value,
        before: options['--before'].value,
      };

      load(gitPath, parserOptions);
    }
  });
}

export default async function load(
  gitPath: string,
  options: GitParserOptions,
): Promise<void> {
  console.log({ gitPath, options });

  const db = await openDatabase(gitPath);

  gitLog(gitPath, options)
    .pipe(new GitParserStream())
    .pipe(new LineStatsReader(gitPath))
    .pipe(new SqliteWriter(db))
    .on('finish', () => {
      (process.stdout as any).clearLine();
      (process.stdout as any).cursorTo(0);
      console.log('done');
    });
}

function date(opt: { value: string }) {
  const d = new Date(opt.value);
  if (typeof opt.value === 'undefined' || !Number.isNaN(d.getTime())) {
    return opt;
  } else {
    throw new Error(`${opt.value} is not a date`);
  }
}

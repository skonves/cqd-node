import { create, validators } from 'posix-argv-parser';
import { SqliteWriter } from './sql-writer';
import { gitLog, GitParserOptions } from './git-log';
import { GitParser } from './git-parser';
import { Database } from 'sqlite3';
import { LineStatsReader } from './line-info-reader';
import { isDate } from 'util';

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
      const rawGitPath: string = options['gitPath'].isSet
        ? options['gitPath'].value
        : `${process.cwd()}/.git`;

      const relativeGitPath = rawGitPath.endsWith('/.git')
        ? rawGitPath
        : `${rawGitPath}${rawGitPath.endsWith('/') ? '' : '/'}.git`;

      const gitPath = relativeGitPath.startsWith('.')
        ? `${process.cwd()}/${relativeGitPath}`
        : relativeGitPath;

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

export default function load(gitPath: string, options: GitParserOptions): void {
  console.log({ gitPath, options });

  const db = new Database('data.db', async err => {
    const sqliteWriter = new SqliteWriter(db);

    await sqliteWriter.init();

    gitLog(gitPath, options)
      .pipe(new GitParser())
      .pipe(new LineStatsReader(gitPath))
      //.pipe(new Stringifier())
      //.pipe(process.stdout)
      .pipe(sqliteWriter)
      .on('finish', () => {
        (process.stdout as any).clearLine();
        (process.stdout as any).cursorTo(0);
        console.log('done');
      });
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

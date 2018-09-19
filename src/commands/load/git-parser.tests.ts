import { expect } from 'chai';
import { GitParser, Commit } from './git-parser';

describe('GitParser', () => {
  describe('parse', () => {
    it('parses new-line terminated chunk', () => {
      // ARRANGE
      const chunk =
        '[aaaaaaa] Dan Stephens 2808-12-01 13:37:00 +0000 Initial commit\n7\t13\tsome/file/path.ext\n';

      const expected: Commit[] = [
        {
          hash: 'aaaaaaa',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:37:00 +0000'),
          message: 'Initial commit',
          files: [
            {
              name: 'some/file/path.ext',
              additions: 7,
              deletions: 13,
            },
          ],
        },
      ];
      const sut = new GitParser();

      // ACT
      const result = Array.from(sut.parse(chunk));

      // ASSERT
      expect(result).to.deep.equal(expected);
    });

    it('parses two chunks that break across a file', () => {
      // ARRANGE
      const chunk1 =
        '[aaaaaaa] Dan Stephens 2808-12-01 13:37:00 +0000 Initial commit\n7\t13\tsome/file/path.ext\n3\t1\tpartial';
      const chunk2 = '/file.ext\n';

      const expected1: Commit[] = [
        {
          hash: 'aaaaaaa',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:37:00 +0000'),
          message: 'Initial commit',
          files: [
            {
              name: 'some/file/path.ext',
              additions: 7,
              deletions: 13,
            },
          ],
        },
      ];
      const expected2: Commit[] = [
        {
          hash: 'aaaaaaa',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:37:00 +0000'),
          message: 'Initial commit',
          files: [
            {
              name: 'partial/file.ext',
              additions: 3,
              deletions: 1,
            },
          ],
        },
      ];

      const sut = new GitParser();

      // ACT
      const result1 = Array.from(sut.parse(chunk1));
      const result2 = Array.from(sut.parse(chunk2));

      // ASSERT
      expect(result1).to.deep.equal(expected1);
      expect(result2).to.deep.equal(expected2);
    });

    it('parses two chunks that break across a commit', () => {
      // ARRANGE
      const chunk1 = '[aaaaaaa] Dan Stephens 2808-12-01 13:37:00 +0000 Ini';
      const chunk2 =
        'tial commit\n7\t13\tsome/file/path.ext\n3\t1\tpartial/file.ext\n';

      const expected1: Commit[] = [];
      const expected2: Commit[] = [
        {
          hash: 'aaaaaaa',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:37:00 +0000'),
          message: 'Initial commit',
          files: [
            {
              name: 'some/file/path.ext',
              additions: 7,
              deletions: 13,
            },
            {
              name: 'partial/file.ext',
              additions: 3,
              deletions: 1,
            },
          ],
        },
      ];

      const sut = new GitParser();

      // ACT
      const result1 = Array.from(sut.parse(chunk1));
      const result2 = Array.from(sut.parse(chunk2));

      // ASSERT
      expect(result1).to.deep.equal(expected1);
      expect(result2).to.deep.equal(expected2);
    });

    it('parses two chunks that break between a commit and file', () => {
      // ARRANGE
      const chunk1 =
        '[aaaaaaa] Dan Stephens 2808-12-01 13:37:00 +0000 Initial commit\n';
      const chunk2 = '7\t13\tsome/file/path.ext\n3\t1\tpartial/file.ext\n';

      const expected1: Commit[] = [];
      const expected2: Commit[] = [
        {
          hash: 'aaaaaaa',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:37:00 +0000'),
          message: 'Initial commit',
          files: [
            {
              name: 'some/file/path.ext',
              additions: 7,
              deletions: 13,
            },
            {
              name: 'partial/file.ext',
              additions: 3,
              deletions: 1,
            },
          ],
        },
      ];

      const sut = new GitParser();

      // ACT
      const result1 = Array.from(sut.parse(chunk1));
      const result2 = Array.from(sut.parse(chunk2));

      // ASSERT
      expect(result1).to.deep.equal(expected1);
      expect(result2).to.deep.equal(expected2);
    });

    it('parses two chunks that break between a file and commit', () => {
      // ARRANGE
      const chunk1 =
        '[aaaaaaa] Dan Stephens 2808-12-01 13:37:00 +0000 Initial commit\n7\t13\tsome/file/path.ext\n';
      const chunk2 =
        '[bbbbbbb] Dan Stephens 2808-12-01 13:38:00 +0000 Second commit\n3\t1\tpartial/file.ext\n';

      const expected1: Commit[] = [
        {
          hash: 'aaaaaaa',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:37:00 +0000'),
          message: 'Initial commit',
          files: [
            {
              name: 'some/file/path.ext',
              additions: 7,
              deletions: 13,
            },
          ],
        },
      ];
      const expected2: Commit[] = [
        {
          hash: 'bbbbbbb',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:38:00 +0000'),
          message: 'Second commit',
          files: [
            {
              name: 'partial/file.ext',
              additions: 3,
              deletions: 1,
            },
          ],
        },
      ];

      const sut = new GitParser();

      // ACT
      const result1 = Array.from(sut.parse(chunk1));
      const result2 = Array.from(sut.parse(chunk2));

      // ASSERT
      expect(result1).to.deep.equal(expected1);
      expect(result2).to.deep.equal(expected2);
    });

    it('parses two chunks that break between a file and file', () => {
      // ARRANGE
      const chunk1 =
        '[aaaaaaa] Dan Stephens 2808-12-01 13:37:00 +0000 Initial commit\n7\t13\tsome/file/path.ext\n';
      const chunk2 = '3\t1\tpartial/file.ext\n';

      const expected1: Commit[] = [
        {
          hash: 'aaaaaaa',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:37:00 +0000'),
          message: 'Initial commit',
          files: [
            {
              name: 'some/file/path.ext',
              additions: 7,
              deletions: 13,
            },
          ],
        },
      ];
      const expected2: Commit[] = [
        {
          hash: 'aaaaaaa',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:37:00 +0000'),
          message: 'Initial commit',
          files: [
            {
              name: 'partial/file.ext',
              additions: 3,
              deletions: 1,
            },
          ],
        },
      ];

      const sut = new GitParser();

      // ACT
      const result1 = Array.from(sut.parse(chunk1));
      const result2 = Array.from(sut.parse(chunk2));

      // ASSERT
      expect(result1).to.deep.equal(expected1);
      expect(result2).to.deep.equal(expected2);
    });

    it('parses two chunks that break between a commit and commit', () => {
      // ARRANGE
      const chunk1 =
        '[aaaaaaa] Dan Stephens 2808-12-01 13:37:00 +0000 Initial commit\n';
      const chunk2 =
        '[bbbbbbb] Dan Stephens 2808-12-01 13:38:00 +0000 Second commit\n3\t1\tpartial/file.ext\n';

      const expected1: Commit[] = [];
      const expected2: Commit[] = [
        {
          hash: 'aaaaaaa',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:37:00 +0000'),
          message: 'Initial commit',
          files: [],
        },
        {
          hash: 'bbbbbbb',
          author: 'Dan Stephens',
          date: new Date('2808-12-01 13:38:00 +0000'),
          message: 'Second commit',
          files: [
            {
              name: 'partial/file.ext',
              additions: 3,
              deletions: 1,
            },
          ],
        },
      ];

      const sut = new GitParser();

      // ACT
      const result1 = Array.from(sut.parse(chunk1));
      const result2 = Array.from(sut.parse(chunk2));

      // ASSERT
      expect(result1).to.deep.equal(expected1);
      expect(result2).to.deep.equal(expected2);
    });
  });
});

import { expect } from 'chai';

import { FileParser } from './file-parser';

describe('FileParser', () => {
  describe('lineCount', () => {
    it('counts content followed by a new-line (\\n) as a line', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('line1\nline2\nline3\n');
      const result = sut.getStats();

      // ASSERT
      expect(result.lineCount).to.equal(3);
    });

    it('does not count content followed by EOF as a line', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('line1\nline2\nline3');
      const result = sut.getStats();

      // ASSERT
      expect(result.lineCount).to.equal(2);
    });

    it('does not double-count a line spanning two chunks', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('line1\nline2\nlin');
      sut.parse('en3\nline4\nline5\n');
      const result = sut.getStats();

      // ASSERT
      expect(result.lineCount).to.equal(5);
    });

    it('returns zero for an empty file', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('');
      const result = sut.getStats();

      // ASSERT
      expect(result.lineCount).to.equal(0);
    });
  });

  describe('lineCount', () => {
    it('counts two consecutive new-lines (\\n) as a blank line', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('line1\n\nline2\n');
      const result = sut.getStats();

      // ASSERT
      expect(result.blankLineCount).to.equal(1);
    });

    it('counts two new-lines (\\n) bounding whitespace as a blank line', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('line1\n\t \t \nline2\n');
      const result = sut.getStats();

      // ASSERT
      expect(result.blankLineCount).to.equal(1);
    });

    it('returns zero for an empty file', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('');
      const result = sut.getStats();

      // ASSERT
      expect(result.blankLineCount).to.equal(0);
    });
  });

  describe('indent', () => {
    it('counts the total number of beginning-of-line whitespace codepoints', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('zero\n  two\n\tone\n\n');
      const result = sut.getStats();

      // ASSERT
      expect(result.total).to.equal(3);
    });

    it('counts multibyte whitespace codepoints as single indents', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('zero\n\u2003one\n');
      const result = sut.getStats();

      // ASSERT
      expect(result.total).to.equal(1);
    });

    it('counts whitespace in the remainder of previous chunk', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('zero\n one\n  ');
      sut.parse('two\n');
      const result = sut.getStats();

      // ASSERT
      expect(result.total).to.equal(3);
    });

    it('does not count whitespace after the last new-line (\\n)', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('zero\n   ');
      const result = sut.getStats();

      // ASSERT
      expect(result.total).to.equal(0);
    });

    it('returns zero for an empty file', () => {
      // ARRANGE
      const sut = new FileParser();

      // ACT
      sut.parse('');
      const result = sut.getStats();

      // ASSERT
      expect(result.total).to.equal(0);
    });
  });
});

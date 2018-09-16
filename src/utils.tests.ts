import { expect } from 'chai';
import * as path from 'path';
import * as utils from './utils';

const s = path.sep;

describe('utils', () => {
  describe('isGitDir', () => {
    it('returns false when the final directory is not ".git"', () => {
      // ARRANGE
      const dir = path.join('the', 'dir', 'to', 'evaluate');

      // ACT
      const result = utils.isGitDir(dir);

      // ASSERT
      expect(result).to.be.false;
    });

    it('returns true when the final directory is ".git"', () => {
      // ARRANGE
      const dir = path.join('the', 'dir', 'to', 'evaluate', '.git');

      // ACT
      const result = utils.isGitDir(dir);

      // ASSERT
      expect(result).to.be.true;
    });
  });

  describe('addGitDir', () => {
    it('adds a final ".git" directory when the path does not already contain one', () => {
      // ARRANGE
      const dir = `${s}some${s}path`;

      const expected = `${s}some${s}path${s}.git`;

      // ACT
      const result = utils.addGitDir(dir);

      // ASSERT
      expect(result).to.equal(expected);
    });

    it('returns the same path when the final directory is already ".git"', () => {
      // ARRANGE
      const dir = `${s}some${s}path${s}.git`;

      // ACT
      const result = utils.addGitDir(dir);

      // ASSERT
      expect(result).to.equal(dir);
    });
  });

  describe('removeGitDir', () => {
    it('returns the same path when the final directory is not ".git"', () => {
      // ARRANGE
      const dir = `${s}some${s}path`;

      // ACT
      const result = utils.removeGitDir(dir);

      // ASSERT
      expect(result).to.equal(dir);
    });

    it('removes the final ".git" directory when it is present', () => {
      // ARRANGE
      const dir = `${s}some${s}path${s}.git`;

      const expected = `${s}some${s}path`;

      // ACT
      const result = utils.removeGitDir(dir);

      // ASSERT
      expect(result).to.equal(expected);
    });
  });
});

import { open } from './db';

describe('db', () => {
  it('works', async () => {
    // ARRANGE
    const file = ':memory:';

    // ACT
    const db = await open(file);

    // ASSERT
  });
});

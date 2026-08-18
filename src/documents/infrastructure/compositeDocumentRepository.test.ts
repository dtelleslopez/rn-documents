import { DocumentRepository } from '../domain/documentRepository';
import { aDocument } from '../testing/documentBuilder';
import { createCompositeDocumentRepository } from './compositeDocumentRepository';

function repositoryWith(...ids: string[]): DocumentRepository {
  return { list: async () => ids.map((id) => aDocument({ id })) };
}

function failingRepository(message: string): DocumentRepository {
  return {
    list: async () => {
      throw new Error(message);
    },
  };
}

describe('createCompositeDocumentRepository', () => {
  it('gathers the documents of every source, in the order given', async () => {
    const repository = createCompositeDocumentRepository([
      repositoryWith('remote-1', 'remote-2'),
      repositoryWith('local-1'),
    ]);

    const { documents, incomplete } = await repository.read();

    expect(documents.map((document) => document.id)).toEqual([
      'remote-1',
      'remote-2',
      'local-1',
    ]);
    expect(incomplete).toBe(false);
  });

  it('asks every source at the same time instead of waiting in turn', async () => {
    const asked: string[] = [];
    const slow: DocumentRepository = {
      list: async () => {
        asked.push('slow started');
        await Promise.resolve();
        asked.push('slow finished');
        return [];
      },
    };
    const quick: DocumentRepository = {
      list: async () => {
        asked.push('quick started');
        return [];
      },
    };

    await createCompositeDocumentRepository([slow, quick]).read();

    expect(asked).toEqual([
      'slow started',
      'quick started',
      'slow finished',
    ]);
  });

  // The reading is what the screen shows, and a screen that cannot tell "there
  // is nothing" from "I could not ask" lies to the user.
  it('returns what it could gather, and says the reading is incomplete', async () => {
    const repository = createCompositeDocumentRepository([
      failingRepository('the server is down'),
      repositoryWith('local-1'),
    ]);

    const { documents, incomplete } = await repository.read();

    expect(documents.map((document) => document.id)).toEqual(['local-1']);
    expect(incomplete).toBe(true);
  });

  it('reports an incomplete reading even when nothing was left to show', async () => {
    const repository = createCompositeDocumentRepository([
      failingRepository('the server is down'),
      repositoryWith(),
    ]);

    const { documents, incomplete } = await repository.read();

    expect(documents).toEqual([]);
    expect(incomplete).toBe(true);
  });

  it('fails when not a single source could be read', async () => {
    const repository = createCompositeDocumentRepository([
      failingRepository('the server is down'),
      failingRepository('storage is unavailable'),
    ]);

    await expect(repository.read()).rejects.toThrow('the server is down');
  });
});

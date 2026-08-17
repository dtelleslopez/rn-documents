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

    const documents = await repository.list();

    expect(documents.map((document) => document.id)).toEqual([
      'remote-1',
      'remote-2',
      'local-1',
    ]);
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

    await createCompositeDocumentRepository([slow, quick]).list();

    expect(asked).toEqual([
      'slow started',
      'quick started',
      'slow finished',
    ]);
  });

  it('still returns what it could gather when a source fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const repository = createCompositeDocumentRepository([
      failingRepository('the server is down'),
      repositoryWith('local-1'),
    ]);

    const documents = await repository.list();

    expect(documents.map((document) => document.id)).toEqual(['local-1']);
    jest.restoreAllMocks();
  });

  it('warns instead of hiding that a source failed', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const repository = createCompositeDocumentRepository([
      failingRepository('the server is down'),
      repositoryWith('local-1'),
    ]);

    await repository.list();

    expect(warn).toHaveBeenCalledWith(
      'Could not read documents from one source: the server is down',
    );
    warn.mockRestore();
  });

  it('fails when not a single source could be read', async () => {
    const repository = createCompositeDocumentRepository([
      failingRepository('the server is down'),
      failingRepository('storage is unavailable'),
    ]);

    await expect(repository.list()).rejects.toThrow('the server is down');
  });
});

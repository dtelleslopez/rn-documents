import { createHttpDocumentRepository } from './httpDocumentRepository';

function aRawDocument(overrides: Record<string, unknown> = {}) {
  return {
    ID: '24213b83-29b6-4378-8cb2-ce02231474af',
    CreatedAt: '1974-05-15T06:27:09.38538639Z',
    UpdatedAt: '2003-05-08T19:56:11.103862055Z',
    Title: 'Racer 5 India Pale Ale',
    Attachments: [],
    Contributors: [],
    Version: '2.14.13',
    ...overrides,
  };
}

function serverReturning(body: string, status = 200) {
  return jest.fn(async () => new Response(body, { status }));
}

function serverReturningJson(payload: unknown, status = 200) {
  return serverReturning(JSON.stringify(payload), status);
}

describe('createHttpDocumentRepository', () => {
  it('asks the configured server for its documents', async () => {
    const fetch = serverReturningJson([]);
    const repository = createHttpDocumentRepository({
      baseUrl: 'http://example.test:8080',
      fetch,
    });

    await repository.list();

    expect(fetch).toHaveBeenCalledWith('http://example.test:8080/documents');
  });

  it('returns the documents the server sent', async () => {
    const repository = createHttpDocumentRepository({
      baseUrl: 'http://example.test:8080',
      fetch: serverReturningJson([aRawDocument({ Title: 'Ten FIDY' })]),
    });

    const documents = await repository.list();

    expect(documents.map((document) => document.title)).toEqual(['Ten FIDY']);
  });

  it('fails when the server answers with an error status', async () => {
    const repository = createHttpDocumentRepository({
      baseUrl: 'http://example.test:8080',
      fetch: serverReturningJson([], 500),
    });

    await expect(repository.list()).rejects.toThrow(
      'The document server answered with status 500',
    );
  });

  it('fails when the server answers with something that is not JSON', async () => {
    const repository = createHttpDocumentRepository({
      baseUrl: 'http://example.test:8080',
      fetch: serverReturning('<html>nope</html>'),
    });

    await expect(repository.list()).rejects.toThrow(
      'The document server answered with a body that is not valid JSON',
    );
  });

  it('warns instead of staying silent when entries could not be read', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const repository = createHttpDocumentRepository({
      baseUrl: 'http://example.test:8080',
      fetch: serverReturningJson([aRawDocument(), { ID: undefined }]),
    });

    await repository.list();

    expect(warn).toHaveBeenCalledWith(
      'Discarded 1 unreadable document(s) received from the server',
    );
    warn.mockRestore();
  });
});

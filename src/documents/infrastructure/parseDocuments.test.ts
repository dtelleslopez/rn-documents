import { parseDocuments } from './parseDocuments';

/** Shaped after a real response captured from the challenge server. */
function aRawDocument(overrides: Record<string, unknown> = {}) {
  return {
    ID: '24213b83-29b6-4378-8cb2-ce02231474af',
    CreatedAt: '1974-05-15T06:27:09.38538639Z',
    UpdatedAt: '2003-05-08T19:56:11.103862055Z',
    Title: 'Racer 5 India Pale Ale',
    Attachments: ['Pilsner', 'English Brown Ale'],
    Contributors: [
      { ID: 'a84cf3af-7bc0-4426-8616-be6716c61980', Name: 'Jarred Daugherty' },
    ],
    Version: '2.14.13',
    ...overrides,
  };
}

describe('parseDocuments', () => {
  it('maps a well-formed payload onto the domain model', () => {
    const { documents } = parseDocuments([aRawDocument()]);

    expect(documents).toEqual([
      {
        id: '24213b83-29b6-4378-8cb2-ce02231474af',
        title: 'Racer 5 India Pale Ale',
        createdAt: new Date('1974-05-15T06:27:09.385Z'),
        updatedAt: new Date('2003-05-08T19:56:11.103Z'),
        version: '2.14.13',
        attachments: ['Pilsner', 'English Brown Ale'],
        contributors: [
          {
            id: 'a84cf3af-7bc0-4426-8616-be6716c61980',
            name: 'Jarred Daugherty',
          },
        ],
      },
    ]);
  });

  it('keeps the valid documents when another one is missing its id', () => {
    const valid = aRawDocument({ ID: 'a-valid-id' });
    const invalid = aRawDocument({ ID: undefined });

    const { documents } = parseDocuments([invalid, valid]);

    expect(documents.map((document) => document.id)).toEqual(['a-valid-id']);
  });

  it('reports how many documents it discarded', () => {
    const invalid = aRawDocument({ ID: undefined });

    const { discarded } = parseDocuments([aRawDocument(), invalid]);

    expect(discarded).toBe(1);
  });

  it('discards a document whose creation date cannot be read', () => {
    const { documents } = parseDocuments([
      aRawDocument({ CreatedAt: 'not a date' }),
    ]);

    expect(documents).toEqual([]);
  });

  it('discards a document with a blank title', () => {
    const { documents } = parseDocuments([aRawDocument({ Title: '   ' })]);

    expect(documents).toEqual([]);
  });

  it('falls back to the creation date when the update date is unusable', () => {
    const { documents } = parseDocuments([
      aRawDocument({ UpdatedAt: undefined }),
    ]);

    expect(documents[0].updatedAt).toEqual(documents[0].createdAt);
  });

  it('treats missing attachments as an empty collection', () => {
    const { documents } = parseDocuments([
      aRawDocument({ Attachments: undefined }),
    ]);

    expect(documents[0].attachments).toEqual([]);
  });

  it('treats missing contributors as an empty collection', () => {
    const { documents } = parseDocuments([
      aRawDocument({ Contributors: null }),
    ]);

    expect(documents[0].contributors).toEqual([]);
  });

  it('drops contributors that carry no name', () => {
    const { documents } = parseDocuments([
      aRawDocument({
        Contributors: [{ ID: 'known', Name: 'Ada' }, { ID: 'anonymous' }],
      }),
    ]);

    expect(documents[0].contributors).toEqual([{ id: 'known', name: 'Ada' }]);
  });

  it('yields no documents when the payload is not a list', () => {
    expect(parseDocuments({ unexpected: 'shape' })).toEqual({
      documents: [],
      discarded: 0,
    });
  });
});

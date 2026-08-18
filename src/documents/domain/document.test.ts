import { newDocument } from './document';

describe('newDocument', () => {
  const createdAt = new Date('2026-08-17T10:00:00Z');

  it('builds a document from what the user filled in', () => {
    const document = newDocument(
      { title: 'Quarterly report', version: '1.0.0', attachments: ['notes.pdf'] },
      { id: 'generated-id', createdAt },
    );

    expect(document).toEqual({
      id: 'generated-id',
      title: 'Quarterly report',
      version: '1.0.0',
      attachments: ['notes.pdf'],
      createdAt,
      updatedAt: createdAt,
      contributors: [],
    });
  });

  it('trims the version the user typed', () => {
    const document = newDocument(
      { title: 'Padded', version: '  1.0.0  ', attachments: [] },
      { id: 'generated-id', createdAt },
    );

    expect(document.version).toBe('1.0.0');
  });

  it('trims the title the user typed', () => {
    const document = newDocument(
      { title: '  Padded  ', version: '', attachments: [] },
      { id: 'generated-id', createdAt },
    );

    expect(document.title).toBe('Padded');
  });

  it('refuses to build a document with no title', () => {
    expect(() =>
      newDocument(
        { title: '   ', version: '1.0.0', attachments: [] },
        { id: 'generated-id', createdAt },
      ),
    ).toThrow('A document needs a title');
  });
});

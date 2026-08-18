import { aDocument } from '../testing/documentBuilder';
import { parseDocuments } from './parseDocuments';
import { serializeDocuments } from './storedDocuments';

describe('serializeDocuments', () => {
  it('survives the round trip through the parser the server answers feed', () => {
    const documents = [
      aDocument({
        id: 'kitchen-notes',
        title: 'Kitchen notes',
        version: '1.0.0',
        attachments: ['Stout'],
        contributors: [{ id: 'first', name: 'Carlie Abott' }],
        createdAt: new Date('2026-08-18T09:41:00.000Z'),
        updatedAt: new Date('2026-08-18T09:41:00.000Z'),
      }),
    ];

    const { documents: read, discarded } = parseDocuments(
      JSON.parse(serializeDocuments(documents)),
    );

    expect(read).toEqual(documents);
    expect(discarded).toBe(0);
  });

  it('writes dates as text a machine in another timezone reads the same', () => {
    const stored = JSON.parse(
      serializeDocuments([
        aDocument({ createdAt: new Date('2026-08-18T09:41:00.000Z') }),
      ]),
    );

    expect(stored[0].CreatedAt).toBe('2026-08-18T09:41:00.000Z');
  });
});

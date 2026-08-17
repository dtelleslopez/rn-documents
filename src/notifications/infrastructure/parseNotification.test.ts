import { parseNotification } from './parseNotification';

/** Shaped after a real frame captured from the challenge server. */
function aRawNotification(overrides: Record<string, unknown> = {}) {
  return {
    Timestamp: '2020-08-12T07:30:08.28093+02:00',
    UserID: '3ffe27e5-fe2c-45ea-8b3c-879b757b0455',
    UserName: 'Alicia Wolf',
    DocumentID: 'f09acc46-3875-4eff-8831-10ccf3356420',
    DocumentTitle: 'Edmund Fitzgerald Porter',
    ...overrides,
  };
}

describe('parseNotification', () => {
  // Unlike /documents, which answers in UTC, notification frames carry the
  // server's own offset, so 07:30:08+02:00 is 05:30:08 UTC.
  it('maps a well-formed frame onto the domain model', () => {
    expect(parseNotification(aRawNotification())).toEqual({
      timestamp: new Date('2020-08-12T05:30:08.280Z'),
      userName: 'Alicia Wolf',
      documentTitle: 'Edmund Fitzgerald Porter',
    });
  });

  it('keeps only what the app can act on', () => {
    const notification = parseNotification(aRawNotification());

    expect(notification).not.toHaveProperty('documentId');
    expect(notification).not.toHaveProperty('userId');
  });

  it('discards a frame with a missing field', () => {
    const { DocumentTitle, ...incomplete } = aRawNotification();

    expect(parseNotification(incomplete)).toBeNull();
  });

  it('discards a frame whose fields have the wrong type', () => {
    expect(parseNotification(aRawNotification({ UserName: 42 }))).toBeNull();
  });

  it('discards a frame with an unreadable timestamp', () => {
    expect(
      parseNotification(aRawNotification({ Timestamp: 'last tuesday' })),
    ).toBeNull();
  });

  it('discards anything that is not an object', () => {
    expect(parseNotification(null)).toBeNull();
    expect(parseNotification('a notification')).toBeNull();
    expect(parseNotification(undefined)).toBeNull();
  });
});

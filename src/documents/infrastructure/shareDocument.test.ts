import { Share } from 'react-native';

import { aDocument } from '../testing/documentBuilder';
import { documentShareMessage, shareDocument } from './shareDocument';

describe('documentShareMessage', () => {
  it('names the document and the version it is at', () => {
    const message = documentShareMessage(
      aDocument({ title: 'Kitchen notes', version: '1.2.0' }),
    );

    expect(message).toBe('Kitchen notes (version 1.2.0)');
  });

  it('leaves the version out when there is none', () => {
    const message = documentShareMessage(
      aDocument({ title: 'Kitchen notes', version: '  ' }),
    );

    expect(message).toBe('Kitchen notes');
  });
});

describe('shareDocument', () => {
  it('hands the message to the system share sheet', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.dismissedAction });

    await shareDocument(aDocument({ title: 'Kitchen notes', version: '1.2.0' }));

    expect(share).toHaveBeenCalledWith({
      message: 'Kitchen notes (version 1.2.0)',
    });
    share.mockRestore();
  });

  it('treats a share sheet that fails like one that was dismissed', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockRejectedValue(new Error('no sheet to show'));

    await expect(shareDocument(aDocument())).resolves.toBeUndefined();
    share.mockRestore();
  });
});

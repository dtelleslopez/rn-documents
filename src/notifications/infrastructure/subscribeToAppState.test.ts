import { AppState } from 'react-native';

import { subscribeToAppState } from './subscribeToAppState';

describe('subscribeToAppState', () => {
  it('reports the foreground as active and anything else as not', () => {
    let announce: (state: string) => void = () => {};
    const remove = jest.fn();
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        announce = listener as (state: string) => void;
        return { remove } as ReturnType<typeof AppState.addEventListener>;
      });

    const reported: boolean[] = [];
    const unsubscribe = subscribeToAppState((isActive) =>
      reported.push(isActive),
    );

    announce('active');
    announce('background');
    announce('inactive');
    unsubscribe();

    expect(reported).toEqual([true, false, false]);
    expect(remove).toHaveBeenCalled();
  });
});

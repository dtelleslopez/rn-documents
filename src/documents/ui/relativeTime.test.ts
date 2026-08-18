import { relativeTime } from './relativeTime';

const now = new Date('2026-08-18T12:00:00Z');

function ago(milliseconds: number): string {
  return relativeTime(new Date(now.getTime() - milliseconds), now);
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 12 * MONTH;

describe('relativeTime', () => {
  it('counts seconds until there is a minute to count', () => {
    expect(ago(0)).toBe('just now');
    expect(ago(SECOND)).toBe('1 second ago');
    expect(ago(59 * SECOND)).toBe('59 seconds ago');
  });

  it('counts minutes until there is an hour to count', () => {
    expect(ago(MINUTE)).toBe('1 minute ago');
    expect(ago(59 * MINUTE)).toBe('59 minutes ago');
  });

  it('counts hours until there is a day to count', () => {
    expect(ago(HOUR)).toBe('1 hour ago');
    expect(ago(90 * MINUTE)).toBe('1 hour ago');
    expect(ago(23 * HOUR)).toBe('23 hours ago');
  });

  it('counts days until there is a month to count', () => {
    expect(ago(DAY)).toBe('1 day ago');
    expect(ago(29 * DAY)).toBe('29 days ago');
  });

  it('counts months until there is a year to count', () => {
    expect(ago(MONTH)).toBe('1 month ago');
    expect(ago(11 * MONTH)).toBe('11 months ago');
  });

  it('counts years after that', () => {
    expect(ago(YEAR)).toBe('1 year ago');
    expect(ago(51 * YEAR)).toBe('51 years ago');
  });

  // A document created against a clock that is a moment ahead of ours should
  // not be announced as arriving from the future.
  it('treats anything that is not past as this very moment', () => {
    expect(relativeTime(new Date(now.getTime() + 2 * SECOND), now)).toBe(
      'just now',
    );
  });
});

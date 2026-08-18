const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
// Not twelve 30-day months: that year would arrive five days early.
const YEAR = 365 * DAY;

const UNITS: { name: string; milliseconds: number }[] = [
  { name: 'year', milliseconds: YEAR },
  { name: 'month', milliseconds: MONTH },
  { name: 'day', milliseconds: DAY },
  { name: 'hour', milliseconds: HOUR },
  { name: 'minute', milliseconds: MINUTE },
  { name: 'second', milliseconds: SECOND },
];

export function relativeTime(date: Date, now: Date): string {
  const elapsed = now.getTime() - date.getTime();

  for (const unit of UNITS) {
    const count = Math.floor(elapsed / unit.milliseconds);

    if (count >= 1) {
      return `${count} ${unit.name}${count === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
}

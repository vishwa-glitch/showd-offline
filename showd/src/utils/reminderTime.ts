type ParsedTime = { hours: number; minutes: number };

const AM_PM_REGEX = /^\s*(\d{1,2})\s*:\s*(\d{2})\s*([AaPp][Mm])\s*$/;
const TWENTY_FOUR_REGEX = /^\s*(\d{1,2})\s*:\s*(\d{2})\s*$/;

function clampHours(hours: number): number {
  if (Number.isNaN(hours)) return 0;
  if (hours < 0) return 0;
  if (hours > 23) return 23;
  return hours;
}

function clampMinutes(minutes: number): number {
  if (Number.isNaN(minutes)) return 0;
  if (minutes < 0) return 0;
  if (minutes > 59) return 59;
  return minutes;
}

export function parseReminderTime(value: string): ParsedTime | null {
  if (!value) return null;

  const ampmMatch = value.match(AM_PM_REGEX);
  if (ampmMatch) {
    const rawHours = Number(ampmMatch[1]);
    const minutes = clampMinutes(Number(ampmMatch[2]));
    const meridiem = ampmMatch[3].toUpperCase();
    const safeHours = Math.min(Math.max(rawHours, 1), 12);
    let hours = safeHours % 12;
    if (meridiem === 'PM') hours += 12;
    return { hours: clampHours(hours), minutes };
  }

  const twentyFourMatch = value.match(TWENTY_FOUR_REGEX);
  if (twentyFourMatch) {
    const hours = clampHours(Number(twentyFourMatch[1]));
    const minutes = clampMinutes(Number(twentyFourMatch[2]));
    return { hours, minutes };
  }

  return null;
}

export function formatReminderTime(value: string): string {
  const parsed = parseReminderTime(value);
  if (!parsed) return value;
  const period = parsed.hours >= 12 ? 'PM' : 'AM';
  const displayHours = parsed.hours % 12 || 12;
  return `${displayHours}:${parsed.minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatTime12hFromDate(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

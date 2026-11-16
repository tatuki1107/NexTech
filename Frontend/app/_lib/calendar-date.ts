const TOKYO_DATE = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
});

export function tokyoDate(date: Date): string {
  return Number.isFinite(date.getTime()) ? TOKYO_DATE.format(date) : "";
}

export function readCalendarDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? value : "";
}

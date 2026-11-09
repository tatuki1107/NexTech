import AdminAnalytics from "../_components/AdminAnalytics";
import AdminShell from "../_components/AdminShell";
import type { SearchParams } from "../_lib/filters";

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = await searchParams;
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const from = isDate(filters.from) ? filters.from : `${today.slice(0, 4)}-01-01`;
  const to = isDate(filters.to) ? filters.to : today;
  const groupBy = filters.groupBy === "organizer" || filters.groupBy === "format" ? filters.groupBy : "category";
  return (
    <AdminShell>
      <AdminAnalytics key={`${from}:${to}:${groupBy}`} from={from} to={to} groupBy={groupBy} />
    </AdminShell>
  );
}

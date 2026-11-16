import AdminAnalytics from "../_components/AdminAnalytics";
import AdminShell from "../_components/AdminShell";
import type { SearchParams } from "../_lib/filters";
import { readCalendarDate, tokyoDate } from "@/app/_lib/calendar-date";
import { readMetric } from "../_lib/analytics";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = await searchParams;
  const today = tokyoDate(new Date());
  const from = readCalendarDate(filters.from) || `${today.slice(0, 4)}-01-01`;
  const to = readCalendarDate(filters.to) || today;
  const compareFrom = readCalendarDate(filters.compareFrom);
  const compareTo = readCalendarDate(filters.compareTo);
  const metric = readMetric(filters.metric);
  const groupBy = filters.groupBy === "organizer" || filters.groupBy === "format" ? filters.groupBy : "category";
  return (
    <AdminShell>
      <AdminAnalytics key={`${from}:${to}:${groupBy}:${metric}:${compareFrom}:${compareTo}`}
        from={from} to={to} groupBy={groupBy} metric={metric}
        compareFrom={compareFrom} compareTo={compareTo} />
    </AdminShell>
  );
}

import { notFound } from "next/navigation";
import HistoryList from "../../_components/HistoryList";
import { RecordDetails } from "../../_components/RecordDetails";
import RecordList from "../../_components/RecordList";
import { getFilters, ID_PATTERN } from "../../_lib/filters";
import type { SearchParams } from "../../_lib/filters";
import { SECTIONS } from "../../_lib/records";
import type { RecordSection } from "../../_lib/records";

function isRecordSection(value: string): value is RecordSection {
  return Object.hasOwn(SECTIONS, value);
}

export default async function AdminSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string; record?: string[] }>;
  searchParams: Promise<SearchParams>;
}) {
  const { section, record = [] } = await params;
  const search = await searchParams;
  if (section === "history" && record.length === 0)
    return <HistoryList filters={getFilters(section, search)} />;
  if (!isRecordSection(section) || record.length > 1) notFound();
  const filters = getFilters(section, search);
  if (record.length === 1) {
    if (!ID_PATTERN.test(record[0])) notFound();
    return <RecordDetails section={section} id={record[0]} filters={filters} />;
  }
  const preview = search.preview;
  const previewId =
    section === "events" &&
    typeof preview === "string" &&
    ID_PATTERN.test(preview)
      ? preview
      : undefined;
  return (
    <RecordList section={section} filters={filters} previewId={previewId} />
  );
}

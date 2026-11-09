import { SECTIONS, TARGET_SECTIONS } from "./records";
import type { AdminSection } from "./records";

export type SearchParams = Record<string, string | string[] | undefined>;
export const ID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const PAGE_SIZE = 20;

function readDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
    ? value
    : "";
}

export function getFilters(section: AdminSection, search: SearchParams) {
  const read = (key: string) => {
    const value = search[key];
    return typeof value === "string" ? value : "";
  };
  const query = new URLSearchParams();
  if (section === "history") {
    const targetType = read("targetType");
    const targetId = read("targetId").trim();
    if (Object.hasOwn(TARGET_SECTIONS, targetType))
      query.set("targetType", targetType);
    if (ID_PATTERN.test(targetId)) query.set("targetId", targetId);
  } else {
    const keyword = read("keyword").trim().slice(0, 200);
    const status = read("status");
    const from = readDate(read("from"));
    const to = readDate(read("to"));
    if (keyword) query.set("keyword", keyword);
    if (Object.hasOwn(SECTIONS[section].statuses, status))
      query.set("status", status);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
  }
  const page = Number(read("page"));
  if (Number.isSafeInteger(page) && page > 1 && page <= 100_000)
    query.set("page", String(page));
  return query.toString();
}

export function getListHref(
  section: AdminSection,
  filters = "",
  changes?: Record<string, string | null>,
) {
  const query = new URLSearchParams(filters);
  for (const [key, value] of Object.entries(changes ?? {})) {
    if (value === null) query.delete(key);
    else query.set(key, value);
  }
  return `/admin/${section}${query.size ? `?${query}` : ""}`;
}

export function getApiQuery(filters: string) {
  const query = new URLSearchParams(filters);
  query.set("perPage", String(PAGE_SIZE));
  return query.toString();
}

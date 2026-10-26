export function matchesDateFilter(eventDate: Date, filter: string) {
  if (filter === "すべて") return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
    return `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}` === filter;
  }
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  if (filter === "今月")
    return (
      eventDate.getFullYear() === now.getFullYear() &&
      eventDate.getMonth() === now.getMonth()
    );
  if (filter === "今週") {
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
    return eventDate >= startOfToday && eventDate < endOfWeek;
  }
  return `${eventDate.getMonth() + 1}/${eventDate.getDate()}` === filter;
}

export type SearchableEvent = {
  title: string; categoryName: string; organizerName: string;
  startAt: string; format: string;
};
export type EventFilters = { keyword: string; date: string; tags: string[]; format: string };

export function matchesEventFilters(event: SearchableEvent, filters: EventFilters): boolean {
  const text = `${event.title} ${event.categoryName} ${event.organizerName}`.toLowerCase();
  return text.includes(filters.keyword.trim().toLowerCase()) &&
    (filters.tags.length === 0 || filters.tags.includes(event.categoryName)) &&
    (filters.format === "すべて" || (filters.format === "オンライン" ? event.format === "online" : event.format !== "online")) &&
    matchesDateFilter(new Date(event.startAt), filters.date);
}

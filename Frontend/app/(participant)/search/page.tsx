import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams({ filters: "open" });
  const query = await searchParams;
  for (const key of ["keyword", "date", "from", "to", "tags", "format"]) {
    const value = query[key];
    if (typeof value === "string") params.set(key, value);
  }
  if (params.get("date") === "日付指定") params.delete("date");
  redirect(`/?${params.toString()}`);
}

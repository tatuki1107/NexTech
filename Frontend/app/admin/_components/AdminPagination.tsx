import Link from "next/link";
import type { PageResult } from "@/app/_lib/api";
import { getListHref } from "../_lib/filters";
import type { AdminSection } from "../_lib/records";
import styles from "../admin.module.css";

export default function AdminPagination({
  section,
  filters,
  pagination,
  count,
}: {
  section: AdminSection;
  filters: string;
  pagination: PageResult<unknown>["pagination"];
  count: number;
}) {
  const { page, perPage, total } = pagination;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage + 1;
  if (!total) return null;
  return (
    <div className={styles.pagination}>
      <span>
        {count > 0
          ? `${start}〜${start + count - 1} 件を表示`
          : `全 ${total} 件`}
      </span>
      <nav aria-label="ページ切り替え">
        {page > 1 && (
          <Link
            className={styles.button}
            aria-label="前のページ"
            href={getListHref(section, filters, {
              page: String(Math.min(page - 1, pages)),
            })}
          >
            ‹
          </Link>
        )}
        <span aria-current="page">
          {page} / {pages}
        </span>
        {page < pages && (
          <Link
            className={styles.button}
            aria-label="次のページ"
            href={getListHref(section, filters, { page: String(page + 1) })}
          >
            ›
          </Link>
        )}
      </nav>
    </div>
  );
}

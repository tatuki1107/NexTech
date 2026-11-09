import Form from "next/form";
import Link from "next/link";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { getListHref } from "../_lib/filters";
import { SECTIONS } from "../_lib/records";
import type { AdminSection } from "../_lib/records";
import styles from "../admin.module.css";

export default function AdminFilters({
  section,
  filters,
}: {
  section: AdminSection;
  filters: string;
}) {
  const values = new URLSearchParams(filters);
  const action = getListHref(section);
  return (
    <Form
      className={styles.filters}
      action={action}
      aria-label="検索と絞り込み"
    >
      {section === "history" ? (
        <>
          <label className={styles.search}>
            <span className={styles.srOnly}>対象 ID</span>
            <input
              name="targetId"
              placeholder="対象 ID を入力"
              defaultValue={values.get("targetId") ?? ""}
              pattern="[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}"
              title="UUID を入力してください"
            />
            <SearchOutlined aria-hidden="true" />
          </label>
          <label>
            <span className={styles.srOnly}>対象種別</span>
            <select
              name="targetType"
              defaultValue={values.get("targetType") ?? ""}
            >
              <option value="">すべての対象</option>
              {Object.values(SECTIONS).map(({ target, label }) => (
                <option key={target} value={target}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <>
          <label className={styles.search}>
            <span className={styles.srOnly}>キーワード</span>
            <input
              name="keyword"
              type="search"
              maxLength={200}
              placeholder={SECTIONS[section].placeholder}
              defaultValue={values.get("keyword") ?? ""}
            />
            <SearchOutlined aria-hidden="true" />
          </label>
          <label>
            <span className={styles.srOnly}>状態</span>
            <select name="status" defaultValue={values.get("status") ?? ""}>
              <option value="">すべての状態</option>
              {Object.entries(SECTIONS[section].statuses).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <details className={styles.dateFilter}>
            <summary>
              {values.has("from") || values.has("to")
                ? `${values.get("from") ?? "指定なし"} 〜 ${values.get("to") ?? "指定なし"}`
                : `${SECTIONS[section].dateLabel}を指定`}
            </summary>
            <div className={styles.dates}>
              <label>
                {SECTIONS[section].dateLabel}の開始
                <input
                  type="date"
                  name="from"
                  defaultValue={values.get("from") ?? ""}
                />
              </label>
              <label>
                {SECTIONS[section].dateLabel}の終了
                <input
                  type="date"
                  name="to"
                  defaultValue={values.get("to") ?? ""}
                />
              </label>
            </div>
          </details>
        </>
      )}
      <button type="submit" className={styles.primary}>
        検索
      </button>
      {filters ? (
        <Link href={action} className={styles.textLink}>
          条件をクリア
        </Link>
      ) : (
        <button type="reset" className={styles.textLink}>
          条件をクリア
        </button>
      )}
    </Form>
  );
}

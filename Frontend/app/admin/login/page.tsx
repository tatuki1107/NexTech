import Link from "next/link";
import { safeReturnTo } from "@/app/_lib/api";
import AdminLoginForm from "../_components/AdminLoginForm";
import type { SearchParams } from "../_lib/filters";
import styles from "../admin.module.css";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { returnTo } = await searchParams;
  const path = safeReturnTo(typeof returnTo === "string" ? returnTo : null);
  const destination =
    /^\/admin\/(events|organizers|registrations|history)(?:[/?]|$)/.test(path)
      ? path
      : "/admin/events";
  return (
    <main className={styles.login}>
      <div className={styles.loginBrand}>
        <Link href="/" aria-label="NexTech トップ">
          <span aria-hidden="true">N</span> NexTech
        </Link>
        <div>
          <p>SERVICE ADMINISTRATION</p>
          <h2>サービス運営管理</h2>
          <p>公開イベント、主催者、参加状況を確認・管理します。</p>
        </div>
      </div>
      <AdminLoginForm returnTo={destination} />
    </main>
  );
}

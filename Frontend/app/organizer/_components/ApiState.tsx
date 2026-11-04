import Link from "next/link";
export const CONTROL =
  "rounded-xl border border-ol-neutral-primary bg-white px-4 py-3 text-fg-neutral-primary disabled:opacity-50";
export const BUTTON =
  "rounded-xl bg-fg-brand-primary px-5 py-3 font-bold text-white disabled:opacity-50";
export function ApiState({
  error,
  retry,
}: {
  error?: string;
  retry?: () => void;
}) {
  return (
    <div
      className="space-y-4 rounded-xl border border-ol-neutral-primary bg-white p-6"
      role={error ? "alert" : "status"}
    >
      <p>{error ?? "読み込み中…"}</p>
      {error && retry && (
        <button type="button" onClick={retry} className={CONTROL}>
          再試行
        </button>
      )}
    </div>
  );
}
export function PageTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      {children}
    </header>
  );
}
export function LoginRequired() {
  return (
    <div className="space-y-4">
      <p>主催者画面を利用するにはログインしてください。</p>
      <Link className={BUTTON} href="/login?returnTo=%2Forganizer">
        ログイン
      </Link>
    </div>
  );
}

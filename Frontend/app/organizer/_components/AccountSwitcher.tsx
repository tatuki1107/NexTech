"use client";
import Link from "next/link";
import { useState } from "react";
import { useOrganizer, logoutOrganizer } from "./OrganizerProvider";
import { errorMessage } from "../_lib/api";
export default function AccountSwitcher() {
  const { user, organization, organizations, select } = useOrganizer();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-3 space-y-3 py-2 md:mt-0 md:border-t md:border-white/20 md:p-3">
      <p className="hidden text-sm md:block">{user.displayName}</p>
      <label className="block text-xs">
        主催者を切り替え
        <select
          aria-label="主催者を切り替え"
          value={organization.id}
          onChange={(event) => select(event.target.value)}
          className="mt-2 w-full rounded bg-white p-2 text-fg-neutral-primary"
        >
          {organizations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-4 md:flex-col md:items-start md:gap-3">
        <Link href="/mypage" className="text-sm md:underline">
          参加者画面へ
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await logoutOrganizer();
            } catch (e) {
              setError(errorMessage(e));
              setBusy(false);
            }
          }}
          className="text-sm md:underline"
        >
          ログアウト
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

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
    <div className="space-y-3 border-t border-white/20 p-3">
      <p className="text-sm">{user.displayName}</p>
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
      <Link href="/mypage" className="block text-sm underline">
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
        className="text-sm underline"
      >
        ログアウト
      </button>
      {error && (
        <p role="alert" className="text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

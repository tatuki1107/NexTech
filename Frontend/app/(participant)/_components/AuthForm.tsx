"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  apiRequest,
  errorMessage,
  safeReturnTo,
  broadcastSessionChange,
} from "../_lib/api";
export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest(signup ? "/auth/signup" : "/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          ...(signup ? { displayName: form.get("displayName") } : {}),
        }),
      });
      broadcastSessionChange();
      window.location.assign(
        safeReturnTo(
          new URLSearchParams(window.location.search).get("returnTo"),
        ),
      );
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  const title = signup ? "新規登録" : "ログイン";
  return (
    <section className="settings-page">
      <h1>{title}</h1>
      <form className="participant-form" onSubmit={submit}>
        {signup && (
          <label>
            表示名
            <input
              name="displayName"
              required
              maxLength={80}
              autoComplete="nickname"
            />
          </label>
        )}
        <label>
          メールアドレス
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </label>
        <label>
          パスワード
          <input
            name="password"
            type="password"
            required
            minLength={signup ? 8 : 1}
            maxLength={200}
            autoComplete={signup ? "new-password" : "current-password"}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button className="primary-button" disabled={busy} type="submit">
          {busy ? "処理中…" : title}
        </button>
        <Link
          href={signup ? "/login" : "/signup"}
          onClick={(event) => {
            event.preventDefault();
            window.location.assign(
              `${signup ? "/login" : "/signup"}${window.location.search}`,
            );
          }}
        >
          {signup ? "ログインはこちら" : "アカウントを作成する"}
        </Link>
      </form>
    </section>
  );
}

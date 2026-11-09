"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  apiRequest,
  broadcastSessionChange,
  errorMessage,
} from "@/app/_lib/api";
import styles from "../admin.module.css";

export default function AdminLoginForm({ returnTo }: { returnTo: string }) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError("");
    try {
      await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      broadcastSessionChange();
      window.location.assign(returnTo);
    } catch (error) {
      setError(errorMessage(error));
      setIsSubmitting(false);
    }
  }
  return (
    <form method="post" className={styles.loginForm} onSubmit={handleSubmit}>
      <noscript>ログインにはJavaScriptが必要です。</noscript>
      <h1>管理者ログイン</h1>
      <p>運営管理者のアカウントでログインしてください。</p>
      <label>
        メールアドレス
        <input
          name="email"
          type="email"
          maxLength={254}
          autoComplete="username"
          required
        />
      </label>
      <label>
        パスワード
        <input
          name="password"
          type="password"
          maxLength={200}
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className={styles.primary} disabled={isSubmitting}>
        {isSubmitting ? "ログインしています…" : "ログイン"}
      </button>
      <p>ログインできない場合は、システム管理者にお問い合わせください。</p>
    </form>
  );
}

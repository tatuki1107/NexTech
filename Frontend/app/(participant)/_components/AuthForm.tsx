"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  apiRequest,
  errorMessage,
  safeReturnTo,
  broadcastSessionChange,
} from "../_lib/api";

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [step, setStep] = useState<"input" | "confirm" | "complete">("input");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [returnTo, setReturnTo] = useState("/");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (step !== "input") heading.current?.focus();
  }, [step]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (signup && step === "input") {
      if (!displayName.trim()) {
        setError("氏名（表示名）を入力してください。");
        return;
      }
      setShowPassword(false);
      setStep("confirm");
      return;
    }
    const destination = safeReturnTo(new URLSearchParams(window.location.search).get("returnTo"));
    submitting.current = true;
    setBusy(true);
    try {
      await apiRequest(signup ? "/auth/signup" : "/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(signup ? { displayName: displayName.trim() } : {}),
        }),
      });
      broadcastSessionChange();
      if (signup) {
        setPassword("");
        setReturnTo(destination);
        setStep("complete");
      } else {
        window.location.assign(destination);
      }
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const title = signup ? "新規登録" : "ログイン";
  return (
    <section className="auth-page" data-step={step}>
      <Link className="auth-brand" href="/" aria-label="NexTech ホーム">
        <span className="brand-mark" aria-hidden="true">N</span><span aria-hidden="true">NexTech</span>
      </Link>
      {step === "complete" ? (
        <div className="auth-complete">
          <Image src="/icons/figma-flow/success.svg" width={27} height={27} alt="" />
          <h1 tabIndex={-1} ref={heading}>登録が完了しました</h1>
          <p>アカウントの登録が完了しました。</p>
          <Link className="primary-button" href={returnTo}>
            {returnTo === "/" ? "イベントを探す" : "元の画面へ戻る"}
          </Link>
          <Link className="modal-secondary" href="/settings">プロフィールを設定する</Link>
        </div>
      ) : (
        <>
          <h1 tabIndex={-1} ref={heading} className={step === "confirm" ? "auth-confirm-heading" : undefined}>{step === "confirm" ? "入力内容の確認" : title}</h1>
          <p>{step === "confirm" ? "入力した内容をご確認ください。" : signup ? "アカウントの情報を入力してください。" : "登録したメールアドレスでログイン"}</p>
          {signup && (
            <ol className="auth-steps" aria-label="新規登録の手順">
              <li aria-current={step === "input" ? "step" : undefined} data-complete={step === "confirm" || undefined}>
                <span aria-hidden="true">{step === "confirm" ? "✓" : "1"}</span>基本情報
              </li>
              <li aria-current={step === "confirm" ? "step" : undefined}>
                <span aria-hidden="true">2</span>確認
              </li>
            </ol>
          )}
          <form method="post" onSubmit={submit}>
            <noscript>ログイン・新規登録にはJavaScriptが必要です。</noscript>
            {step === "confirm" ? (
              <dl className="auth-confirm-details">
                <dt>氏名（表示名）</dt><dd>{displayName.trim()}</dd>
                <dt>メールアドレス</dt><dd>{email.trim()}</dd>
                <dt>パスワード</dt><dd aria-label="入力済み">••••••••</dd>
              </dl>
            ) : (
              <>
                {signup && (
                  <label>
                    氏名（表示名）
                    <input name="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      required maxLength={80} autoComplete="nickname" placeholder="氏名を入力" />
                  </label>
                )}
                <label>
                  メールアドレス
                  <span className="auth-input-wrap">
                    <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      required maxLength={254} autoComplete="email" placeholder="メールアドレスを入力" />
                    <span className="auth-input-icon"><Image src="/icons/figma-flow/email.svg" width={24} height={24} alt="" /></span>
                  </span>
                </label>
                <div className="auth-password-control">
                  <label htmlFor="account-password">パスワード</label>
                  <span className="auth-input-wrap">
                    <input id="account-password" name="password" type={showPassword ? "text" : "password"}
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      minLength={signup ? 8 : 1} maxLength={200}
                      autoComplete={signup ? "new-password" : "current-password"} placeholder="パスワードを入力" />
                    <button type="button" className="auth-input-icon" aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                      onClick={() => setShowPassword(!showPassword)}>
                      <Image src="/icons/figma-flow/eye-off.svg" width={24} height={24} alt="" />
                    </button>
                  </span>
                </div>
              </>
            )}
            {error && <p role="alert">{error}</p>}
            <button className="primary-button" disabled={busy} type="submit">
              {busy ? "処理中…" : step === "confirm" ? "登録する" : signup ? "確認画面へ" : title}
            </button>
            {step === "confirm" && <button type="button" className="modal-secondary" disabled={busy}
              onClick={() => { setError(""); setStep("input"); }}>
              入力内容を修正
            </button>}
          </form>
        </>
      )}
      <p className="auth-safety-note">
        <Image src="/icons/figma-flow/shield.svg" width={20} height={22} alt="" />
        入力情報は安全に送信されます
      </p>
      {step === "input" && (
        <div className="auth-footer">
          <span>{signup ? "すでにアカウントをお持ちの方" : "はじめてご利用の方"}</span>
          <Link href={signup ? "/login" : "/signup"} onNavigate={(event) => {
            if (!window.location.search) return;
            event.preventDefault();
            window.location.assign(`${signup ? "/login" : "/signup"}${window.location.search}`);
          }}>
            {signup ? "ログイン" : "新規登録"}
          </Link>
        </div>
      )}
    </section>
  );
}

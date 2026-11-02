"use client";
import { useState, type FormEvent } from "react";
import { apiRequest, errorMessage, broadcastSessionChange } from "../_lib/api";
import { useApiData } from "../_lib/use-api-data";
import type { NotificationSettings, User } from "../_lib/types";
import { useParticipant } from "./ParticipantProvider";
import { ApiState } from "./ApiState";

function ProfileForm({ user }: { user: User }) {
  const { reload } = useParticipant();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: form.get("displayName"),
          fullName: form.get("fullName") || null,
          profileText: form.get("profileText") || null,
        }),
      });
      await reload();
      setMessage("プロフィールを保存しました。");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="participant-form" onSubmit={save}>
      <h2>プロフィール</h2>
      <p>{user.email}</p>
      <label>
        表示名
        <input
          name="displayName"
          defaultValue={user.displayName}
          required
          maxLength={80}
        />
      </label>
      <label>
        氏名
        <input
          name="fullName"
          defaultValue={user.fullName ?? ""}
          maxLength={100}
        />
      </label>
      <label>
        自己紹介
        <textarea
          name="profileText"
          defaultValue={user.profileText ?? ""}
          maxLength={2000}
        />
      </label>
      <button className="primary-button" type="submit" disabled={busy}>
        プロフィールを保存
      </button>
      <p role="status">{message}</p>
    </form>
  );
}

function NotificationSettingsForm({
  settings,
}: {
  settings: NotificationSettings;
}) {
  const [values, setValues] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const labels: Array<[keyof NotificationSettings, string]> = [
    ["registrationUpdates", "申込・キャンセル情報"],
    ["eventReminders", "開催リマインド"],
    ["recommendations", "おすすめ情報"],
  ];
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await apiRequest<{ data: NotificationSettings }>(
        "/me/notification-settings",
        { method: "PATCH", body: JSON.stringify(values) },
      );
      setValues(result.data);
      setMessage("通知設定を保存しました。");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="participant-form">
      <h2>通知</h2>
      <div className="settings-list">
        {labels.map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <label className="toggle">
              <input
                aria-label={label}
                type="checkbox"
                checked={values[key]}
                disabled={busy}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
              />
              <span />
            </label>
          </div>
        ))}
      </div>
      <button type="submit" className="primary-button" disabled={busy}>
        通知設定を保存
      </button>
      <p role="status">{message}</p>
    </form>
  );
}

export function ProfileSettings() {
  const { user } = useParticipant();
  const { data, loading, error, reload } = useApiData<{
    data: NotificationSettings;
  }>("/me/notification-settings");
  const [busy, setBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  async function logout() {
    setBusy(true);
    setLogoutError("");
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      broadcastSessionChange();
      window.location.assign("/login");
    } catch (error) {
      setLogoutError(errorMessage(error));
      setBusy(false);
    }
  }
  return (
    <section className="settings-page">
      <h1>設定</h1>
      {user && <ProfileForm user={user} />}
      <ApiState loading={loading} error={error} retry={reload} />
      {data && <NotificationSettingsForm settings={data.data} />}
      <button
        className="logout-button"
        disabled={busy}
        type="button"
        onClick={logout}
      >
        ログアウト
      </button>
      {logoutError && <p role="alert">{logoutError}</p>}
    </section>
  );
}

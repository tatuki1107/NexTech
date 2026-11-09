"use client";
import { useState, type FormEvent } from "react";
import { useOrganizer } from "../../_components/OrganizerProvider";
import {
  ApiState,
  PageTitle,
  BUTTON,
  CONTROL,
} from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import { apiRequest, organizerPath, errorMessage } from "../../_lib/api";
type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};
type Settings = {
  registrationUpdates: boolean;
  eventReminders: boolean;
  recommendations: boolean;
};
export default function SettingsScreen() {
  const { organization, reload } = useOrganizer();
  const members = useResource<Member[]>(
    organizerPath(organization.id) + "/members",
  );
  const settings = useResource<Settings>("/me/notification-settings");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest(organizerPath(organization.id), {
        method: "PATCH",
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description") || null,
          websiteUrl: form.get("websiteUrl") || null,
          contactEmail: form.get("contactEmail") || null,
        }),
      });
      setMessage("組織情報を保存しました。");
      reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function toggle(key: keyof Settings) {
    if (!settings.data || busy) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest("/me/notification-settings", {
        method: "PATCH",
        body: JSON.stringify({ [key]: !settings.data[key] }),
      });
      settings.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const roleLabels: Record<string, string> = {
    owner: "所有者",
    admin: "管理者",
    member: "メンバー",
  };
  return (
    <div className="max-w-250 space-y-8">
      <PageTitle title="設定" />
      <form
        onSubmit={save}
        className="space-y-4 rounded-xl border border-ol-neutral-primary bg-white p-6"
      >
        <h2 className="text-xl font-bold">組織情報</h2>
        <p className="break-all">主催者ID：{organization.id}</p>
        <p>識別名：{organization.slug}</p>
        <fieldset disabled={busy} className="space-y-4">
          {[
            ["name", "主催者名", organization.name, "text"],
            ["description", "紹介", organization.description ?? "", "text"],
            ["websiteUrl", "Webサイト", organization.websiteUrl ?? "", "url"],
            [
              "contactEmail",
              "連絡先メール",
              organization.contactEmail ?? "",
              "email",
            ],
          ].map(([name, label, value, type]) => (
            <label key={name} className="block">
              {label}
              <input
                name={name}
                type={type}
                required={name === "name"}
                maxLength={
                  name === "name" ? 100 : name === "description" ? 3000 : 2000
                }
                defaultValue={value}
                className={CONTROL + " mt-2 block w-full"}
              />
            </label>
          ))}
        </fieldset>
        <button disabled={busy} className={BUTTON}>
          組織情報を保存
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">メンバー</h2>
        {!members.data ? (
          <ApiState error={members.error} retry={members.reload} />
        ) : (
          <ul className="rounded-xl border border-ol-neutral-primary bg-white p-6">
            {members.data.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap justify-between gap-4 py-3"
              >
                <div>
                  {member.name}
                  <p className="text-xs">{member.email}</p>
                </div>
                <span>
                  {roleLabels[member.role] ?? member.role} /{" "}
                  {member.status === "active" ? "有効" : member.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm">
          メンバーの招待・権限変更は現在利用できません。
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">個人の通知設定</h2>
        <p>ログイン中のユーザーに適用され、参加者画面と共通です。</p>
        {!settings.data ? (
          <ApiState error={settings.error} retry={settings.reload} />
        ) : (
          <div className="space-y-4 rounded-xl border border-ol-neutral-primary bg-white p-6">
            {(
              [
                ["registrationUpdates", "申込・登録状態の更新"],
                ["eventReminders", "参加予定イベントのリマインド"],
                ["recommendations", "おすすめイベントの通知"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex justify-between gap-4">
                <span>{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-label={label}
                  aria-checked={settings.data![key]}
                  disabled={busy}
                  onClick={() => void toggle(key)}
                  className={CONTROL}
                >
                  {settings.data![key] ? "有効" : "無効"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">セキュリティ</h2>
        <p>パスワード変更・2段階認証の設定は現在利用できません。</p>
      </section>
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useOrganizer } from "../../_components/OrganizerProvider";
import { ApiState, BUTTON, CONTROL } from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import {
  apiRequest,
  changeStatus,
  organizerPath,
  errorMessage,
  type ManagedEvent,
  type Taxonomy,
} from "../../_lib/api";
import { eventPayload, type EventFormValues } from "../_lib/event-form";
import ConfirmDialog from "./ConfirmDialog";
export default function EventForm({
  mode,
  initialValues,
  initialEvent,
}: {
  mode: "new" | "edit";
  initialValues: EventFormValues;
  initialEvent?: ManagedEvent;
}) {
  const router = useRouter();
  const { organization } = useOrganizer();
  const [values, setValues] = useState(initialValues);
  const saved = useRef(initialEvent);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [leave, setLeave] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [knownTags, setKnownTags] = useState<Taxonomy[]>(
    initialEvent?.tags ?? [],
  );
  const categories = useResource<Taxonomy[]>("/categories");
  const tags = useResource<Taxonomy[]>(
    "/tags?keyword=" + encodeURIComponent(tagSearch),
  );
  const set = <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));
  async function save(publish: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const body = eventPayload(values);
      const current = saved.current;
      const response = await apiRequest<{ data: ManagedEvent }>(
        current
          ? `/events/${current.id}`
          : organizerPath(organization.id) + "/events",
        {
          method: current ? "PATCH" : "POST",
          body: JSON.stringify({
            ...body,
            ...(current ? { expectedVersion: current.version } : {}),
          }),
        },
      );
      saved.current = response.data;
      if (publish && response.data.status !== "published") {
        const published = await changeStatus(response.data.id, "published");
        saved.current = published.data;
      }
      router.push(`/organizer/event-management/${response.data.id}`);
    } catch (e) {
      setError(
        errorMessage(e) +
          (saved.current && !initialEvent
            ? "（作成済みの下書きを再利用して保存できます）"
            : ""),
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(true);
  }
  if (!categories.data)
    return (
      <ApiState
        error={categories.error || tags.error}
        retry={() => {
          categories.reload();
          tags.reload();
        }}
      />
    );
  const categoryOptions = [
    ...new Map(
      [
        ...(initialEvent?.category ? [initialEvent.category] : []),
        ...categories.data,
      ].map((item) => [item.id, item]),
    ).values(),
  ];
  const tagOptions = [
    ...new Map(
      [...knownTags, ...(tags.data ?? [])].map((item) => [item.id, item]),
    ).values(),
  ];
  const fields: Array<[keyof EventFormValues, string, string]> = [
    ["title", "イベントタイトル", "text"],
    ["summary", "概要", "text"],
    ["date", "開催日", "date"],
    ["startTime", "開始時刻", "time"],
    ["endDate", "終了日", "date"],
    ["endTime", "終了時刻", "time"],
    ["venue", "開催場所", "text"],
    ["address", "住所", "text"],
    ["venueUrl", "配信URL", "url"],
    ["capacity", "定員", "number"],
    ["applicationStart", "申込受付開始（日本時間）", "datetime-local"],
    ["applicationDeadline", "申込期限（日本時間）", "datetime-local"],
  ];
  return (
    <form onSubmit={submit} className="max-w-250 space-y-6">
      <button
        type="button"
        className="underline"
        onClick={() =>
          JSON.stringify(values) !== JSON.stringify(initialValues)
            ? setLeave(true)
            : router.push("/organizer/event-management")
        }
      >
        イベント一覧に戻る
      </button>
      <h1 className="text-3xl font-bold">
        {mode === "new" ? "新規作成" : "編集"}
      </h1>
      <p>
        日時は日本時間で入力してください。下書きはタイトルのみで保存できます。
      </p>
      <fieldset disabled={busy} className="grid gap-5 md:grid-cols-2">
        {fields.map(([key, label, type]) => (
          <label key={key} className="block">
            {label}
            <input
              className={CONTROL + " mt-2 block w-full"}
              type={type}
              value={String(values[key])}
              required={key === "title"}
              maxLength={
                key === "title" ? 160 : key === "summary" ? 300 : undefined
              }
              min={type === "number" ? 1 : undefined}
              step={type === "number" ? 1 : undefined}
              onChange={(e) => {
                set(key, e.target.value);
                if (key === "date" && !values.endDate)
                  set("endDate", e.target.value);
              }}
            />
          </label>
        ))}
        <label>
          カテゴリ
          <select
            aria-label="カテゴリ"
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className={CONTROL + " mt-2 block w-full"}
          >
            <option value="">未設定</option>
            {categoryOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          開催形式
          <select
            value={values.format}
            onChange={(e) => set("format", e.target.value)}
            className={CONTROL + " mt-2 block w-full"}
          >
            <option value="">未設定</option>
            <option value="offline">会場開催</option>
            <option value="online">オンライン</option>
            <option value="hybrid">ハイブリッド</option>
          </select>
        </label>
        <fieldset className="md:col-span-2">
          <legend>タグ（最大30件）</legend>
          <input
            type="search"
            aria-label="タグを検索"
            placeholder="タグを検索"
            maxLength={80}
            value={tagSearch}
            onChange={(event) => setTagSearch(event.target.value)}
            className={CONTROL + " mb-4 w-full"}
          />
          {!tags.data && <ApiState error={tags.error} retry={tags.reload} />}
          <div className="flex flex-wrap gap-4">
            {tagOptions.map((tag) => (
              <label key={tag.id}>
                <input
                  type="checkbox"
                  checked={values.tags.includes(tag.id)}
                  disabled={
                    !values.tags.includes(tag.id) && values.tags.length >= 30
                  }
                  onChange={(e) => {
                    if (e.target.checked)
                      setKnownTags((previous) => [
                        ...previous.filter((item) => item.id !== tag.id),
                        tag,
                      ]);
                    set(
                      "tags",
                      e.target.checked
                        ? [...values.tags, tag.id]
                        : values.tags.filter((id) => id !== tag.id),
                    );
                  }}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="md:col-span-2">
          イベント内容
          <textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            className={CONTROL + " mt-2 block min-h-40 w-full"}
          />
        </label>
        <label className="md:col-span-2">
          参加条件
          <textarea
            maxLength={10000}
            value={values.participationConditions}
            onChange={(e) => set("participationConditions", e.target.value)}
            className={CONTROL + " mt-2 block w-full"}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={values.waitlistEnabled}
            onChange={(e) => set("waitlistEnabled", e.target.checked)}
          />
          キャンセル待ちを受け付ける
        </label>
      </fieldset>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <p>
            編集競合の場合は入力内容を控え、画面を再読み込みして最新の内容を確認してください。
          </p>
        </div>
      )}
      <div className="flex gap-4">
        <button
          type="button"
          disabled={busy || !values.title.trim()}
          className={CONTROL}
          onClick={() => void save(false)}
        >
          {busy
            ? "保存中…"
            : initialEvent?.status === "published"
              ? "保存"
              : "下書き保存"}
        </button>
        <button
          type="submit"
          disabled={busy || !values.title.trim()}
          className={BUTTON}
        >
          保存して公開する
        </button>
      </div>
      <ConfirmDialog
        isOpen={leave}
        title="入力内容が保存されていません"
        description="入力内容を破棄して一覧に戻りますか？"
        confirmLabel="破棄して戻る"
        cancelLabel="編集を続ける"
        onConfirm={() => router.push("/organizer/event-management")}
        onCancel={() => setLeave(false)}
      />
    </form>
  );
}

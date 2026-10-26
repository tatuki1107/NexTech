"use client";

import { useRouter } from "next/navigation";
import { useState, type SyntheticEvent } from "react";

import {
  DEFAULT_EVENT_DURATION_HOURS,
  DESCRIPTION_MAX_LENGTH,
  addHoursToTime,
  getTodayString,
  type EventFormValues,
} from "../_lib/event-form";
import ConfirmDialog from "./ConfirmDialog";
import FormField from "./FormField";
import TagInput from "./TagInput";

type EventFormProps = {
  mode: "new" | "edit";
  initialValues: EventFormValues;
  lastUpdated?: string;
};

const LIST_PATH = "/organizer/event-management";
// 幅と枠線の色は、同じ種類のクラスが重複しないよう各入力で指定する
const INPUT_BASE =
  "h-14 rounded-xl border bg-white px-4 text-base text-fg-neutral-primary placeholder:text-fg-neutral-secondary focus:outline-2 focus:outline-fg-brand-primary";
const INPUT_BORDER = "border-ol-neutral-primary";
const FORM_BUTTON =
  "flex h-12 w-50 items-center justify-center rounded-xl border-2 text-base";

export default function EventForm({
  mode,
  initialValues,
  lastUpdated,
}: EventFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<EventFormValues>(initialValues);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  const handleChange = <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartTimeChange = (startTime: string) => {
    setValues((prev) => ({
      ...prev,
      startTime,
      // 入力済みの終了時刻は上書きしない
      endTime:
        prev.endTime === ""
          ? addHoursToTime(startTime, DEFAULT_EVENT_DURATION_HOURS)
          : prev.endTime,
    }));
  };

  const hasInvalidTimeRange =
    values.startTime !== "" &&
    values.endTime !== "" &&
    values.endTime <= values.startTime;

  // 空白だけの入力は未入力として扱う
  const hasEmptyRequiredField =
    values.title.trim() === "" ||
    values.date === "" ||
    values.startTime === "" ||
    values.endTime === "" ||
    values.venue.trim() === "" ||
    values.capacity === "" ||
    values.description.trim() === "";

  const canPublish = !hasEmptyRequiredField && !hasInvalidTimeRange;
  // 下書きは作成途中でも保存できるよう、タイトルだけを必須にする
  const canSaveDraft = values.title.trim() !== "";

  const navigateBack = () => {
    // 詳細・一覧のどちらから来ても直前の画面に戻す。
    // 履歴がない場合(直接URLを開いたとき)は一覧へ移動する
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(LIST_PATH);
  };

  const handleBack = () => {
    if (isDirty) {
      setIsLeaveDialogOpen(true);
      return;
    }
    navigateBack();
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 保存処理はAPI接続のPRで実装
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-250 space-y-8">
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-base font-bold text-fg-neutral-primary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {mode === "new" ? "イベント一覧に戻る" : "戻る"}
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-fg-neutral-primary">
            {mode === "new" ? "新規作成" : "編集"}
          </h1>
          <p className="text-sm text-fg-neutral-primary">編集中</p>
        </div>
      </div>

      <FormField label="イベントタイトル" htmlFor="event-title" isRequired>
        <input
          id="event-title"
          type="text"
          required
          value={values.title}
          onChange={(event) => handleChange("title", event.target.value)}
          placeholder="イベントタイトルを入力"
          className={`${INPUT_BASE} ${INPUT_BORDER} w-full`}
        />
      </FormField>

      <FormField label="開催日時" htmlFor="event-date" isRequired>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <input
              id="event-date"
              type="date"
              required
              aria-label="開催日"
              // 編集では既存の日付を保てるよう、過去日の制限は新規作成のみ
              min={mode === "new" ? getTodayString() : undefined}
              value={values.date}
              onChange={(event) => handleChange("date", event.target.value)}
              className={`${INPUT_BASE} ${INPUT_BORDER} w-75`}
            />
            <input
              type="time"
              required
              aria-label="開始時刻"
              value={values.startTime}
              onChange={(event) => handleStartTimeChange(event.target.value)}
              className={`${INPUT_BASE} ${INPUT_BORDER} w-33`}
            />
            <span aria-hidden="true" className="text-base">
              〜
            </span>
            <input
              type="time"
              required
              aria-label="終了時刻"
              aria-invalid={hasInvalidTimeRange}
              aria-describedby={
                hasInvalidTimeRange ? "event-time-error" : undefined
              }
              value={values.endTime}
              onChange={(event) => handleChange("endTime", event.target.value)}
              className={`${INPUT_BASE} w-33 ${
                hasInvalidTimeRange ? "border-fg-warning-primary" : INPUT_BORDER
              }`}
            />
          </div>
          {hasInvalidTimeRange && (
            <p
              id="event-time-error"
              role="alert"
              className="text-xs text-fg-warning-primary"
            >
              終了時刻は開始時刻より後にしてください
            </p>
          )}
        </div>
      </FormField>

      <FormField label="開催場所" htmlFor="event-venue" isRequired>
        <div className="space-y-3">
          <input
            id="event-venue"
            type="text"
            required
            value={values.venue}
            onChange={(event) => handleChange("venue", event.target.value)}
            placeholder="開催場所を入力"
            className={`${INPUT_BASE} ${INPUT_BORDER} w-full`}
          />
          <input
            type="url"
            aria-label="MAP / 配信URL(任意)"
            value={values.venueUrl}
            onChange={(event) => handleChange("venueUrl", event.target.value)}
            placeholder="MAP / 配信URL (任意)"
            className={`${INPUT_BASE} ${INPUT_BORDER} w-full`}
          />
        </div>
      </FormField>

      <FormField label="定員" htmlFor="event-capacity" isRequired>
        <div className="flex items-end gap-4">
          <input
            id="event-capacity"
            type="number"
            required
            min={1}
            value={values.capacity}
            onChange={(event) => handleChange("capacity", event.target.value)}
            placeholder="定員人数を入力"
            className={`${INPUT_BASE} ${INPUT_BORDER} w-75`}
          />
          <span className="text-sm text-fg-neutral-primary">名</span>
        </div>
      </FormField>

      <FormField label="タグ / カテゴリ">
        <TagInput
          tags={values.tags}
          onChange={(tags) => handleChange("tags", tags)}
        />
      </FormField>

      <FormField label="イベント内容" htmlFor="event-description" isRequired>
        <div className="relative">
          <textarea
            id="event-description"
            required
            maxLength={DESCRIPTION_MAX_LENGTH}
            value={values.description}
            onChange={(event) =>
              handleChange("description", event.target.value)
            }
            placeholder="イベント内容を入力"
            className="h-40 w-full resize-none rounded-xl border border-ol-neutral-primary bg-white p-4 pb-8 text-base text-fg-neutral-primary placeholder:text-fg-neutral-secondary focus:outline-2 focus:outline-fg-brand-primary"
          />
          <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-fg-neutral-secondary">
            {values.description.length}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </FormField>

      {mode === "edit" && lastUpdated && (
        <p className="text-sm text-fg-neutral-secondary">
          最終更新：{lastUpdated}
        </p>
      )}

      <div className="flex gap-4">
        {mode === "edit" && (
          // 削除の動作は確認モーダルと一緒に別PRで実装
          <button
            type="button"
            className={`${FORM_BUTTON} border-fg-warning-primary bg-white text-fg-warning-primary`}
          >
            削除
          </button>
        )}
        {/* 下書き保存の動作はAPI接続のPRで実装 */}
        <button
          type="button"
          disabled={!canSaveDraft}
          className={`${FORM_BUTTON} border-fg-neutral-secondary bg-white text-fg-neutral-secondary disabled:opacity-50`}
        >
          下書き保存
        </button>
        <button
          type="submit"
          disabled={!canPublish}
          className={`${FORM_BUTTON} border-fg-brand-primary bg-fg-brand-primary text-fg-inverse-primary disabled:opacity-50`}
        >
          保存して公開する
        </button>
      </div>

      <ConfirmDialog
        isOpen={isLeaveDialogOpen}
        title="入力内容が保存されていません"
        description="このまま戻ると、入力した内容は破棄されます。"
        confirmLabel="破棄して戻る"
        cancelLabel="編集を続ける"
        onConfirm={navigateBack}
        onCancel={() => setIsLeaveDialogOpen(false)}
      />
    </form>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";

import { AVAILABLE_TAGS } from "../_lib/event-form";

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export default function TagInput({ tags, onChange }: TagInputProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>(tags);

  // Escキーとフォーカス制御をブラウザ標準の<dialog>に任せる
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const handleOpen = () => {
    setDraftTags(tags);
    setIsOpen(true);
  };

  const handleToggle = (tag: string) => {
    setDraftTags((prev) =>
      prev.includes(tag)
        ? prev.filter((selected) => selected !== tag)
        : [...prev, tag],
    );
  };

  const handleConfirm = () => {
    // 表示順を一定に保つため、選んだ順ではなく選択肢の並び順で保存する
    onChange(AVAILABLE_TAGS.filter((tag) => draftTags.includes(tag)));
    setIsOpen(false);
  };

  const handleRemove = (tag: string) => {
    onChange(tags.filter((selected) => selected !== tag));
  };

  return (
    <>
      <div className="flex min-h-14 w-full flex-wrap items-center gap-3 rounded-xl border border-ol-neutral-primary bg-white px-4 py-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-2 rounded-lg bg-bg-neutral-primary px-3 py-2 text-sm text-fg-neutral-primary"
          >
            {tag}
            <button
              type="button"
              aria-label={`${tag}を削除`}
              onClick={() => handleRemove(tag)}
              className="text-base leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={handleOpen}
          className="rounded-lg border border-ol-neutral-primary px-3 py-2 text-sm text-fg-neutral-secondary"
        >
          ＋追加
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          setIsOpen(false);
        }}
        className="m-auto w-full max-w-md rounded-xl p-6 backdrop:bg-black/40"
      >
        <h2 id={titleId} className="text-lg font-bold text-fg-neutral-primary">
          タグを選択
        </h2>
        <ul className="mt-4 space-y-2">
          {AVAILABLE_TAGS.map((tag) => (
            <li key={tag}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-base text-fg-neutral-primary hover:bg-bg-neutral-primary">
                <input
                  type="checkbox"
                  checked={draftTags.includes(tag)}
                  onChange={() => handleToggle(tag)}
                  className="h-4 w-4 accent-fg-brand-primary"
                />
                {tag}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="h-12 rounded-xl border-2 border-fg-neutral-secondary px-6 text-base text-fg-neutral-secondary"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="h-12 rounded-xl bg-fg-brand-primary px-6 text-base text-fg-inverse-primary"
          >
            決定
          </button>
        </div>
      </dialog>
    </>
  );
}
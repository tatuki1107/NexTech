"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // 開閉はブラウザ標準の<dialog>に任せる(Escキー・フォーカス制御つき)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-full max-w-md rounded-xl p-6 backdrop:bg-black/40"
    >
      <h2 id={titleId} className="text-lg font-bold text-fg-neutral-primary">
        {title}
      </h2>
      <p className="mt-3 text-sm text-fg-neutral-secondary">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-xl border-2 border-fg-neutral-secondary px-6 text-base font-bold text-fg-neutral-secondary"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-12 rounded-xl bg-fg-warning-primary px-6 text-base font-bold text-fg-inverse-primary"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
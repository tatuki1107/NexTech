import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  isRequired?: boolean;
  children: ReactNode;
};

const LABEL_CLASS = "text-xl font-bold text-fg-neutral-primary";

export default function FormField({
  label,
  htmlFor,
  isRequired = false,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={LABEL_CLASS}>
            {label}
          </label>
        ) : (
          <p className={LABEL_CLASS}>{label}</p>
        )}
        {isRequired && (
          <span className="pb-1 text-xs font-bold text-fg-warning-primary">
            ※ 必須
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
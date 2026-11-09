"use client";

import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import { useId, useRef, useState } from "react";

export function EventQuickFilter({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: string;
  choices: string[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const optionsId = useId();
  const selected = value || "すべて";
  const options = [...new Set(["すべて", selected, ...choices])];

  const close = () => {
    trigger.current?.focus({ preventScroll: true });
    setIsOpen(false);
  };

  return (
    <div
      className="quick-filter"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (isOpen && event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="quick-filter-trigger"
        aria-expanded={isOpen}
        aria-controls={optionsId}
        onClick={() => {
          trigger.current?.focus({ preventScroll: true });
          setIsOpen((open) => !open);
        }}
      >
        <span>{label}</span>
        <span className="quick-filter-value">
          <span>{selected}</span>
          <ExpandMoreOutlinedIcon />
        </span>
      </button>
      <div
        className="quick-filter-options"
        id={optionsId}
        role="group"
        aria-label={`${label}の候補`}
        inert={!isOpen}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === selected}
            onClick={() => {
              onChange(option);
              close();
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

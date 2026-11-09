import {
  EVENT_FORMAT_OPTIONS,
  type EventFormatFilter,
} from "../_lib/event-format";

export function EventFormatOptions({
  value,
  onChange,
}: {
  value: EventFormatFilter;
  onChange: (value: EventFormatFilter) => void;
}) {
  return (
    <div className="date-chip-grid event-format-grid" role="group" aria-label="開催形式">
      {EVENT_FORMAT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-selected" : ""}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

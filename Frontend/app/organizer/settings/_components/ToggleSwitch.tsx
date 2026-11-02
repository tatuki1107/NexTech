type ToggleSwitchProps = {
  isOn: boolean;
  labelledBy: string;
  describedBy?: string;
  onToggle: () => void;
};

export default function ToggleSwitch({
  isOn,
  labelledBy,
  describedBy,
  onToggle,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={onToggle}
      className={`relative h-8 w-12 shrink-0 rounded-full transition-colors ${
        isOn ? "bg-fg-brand-primary" : "bg-ol-neutral-primary"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          isOn ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

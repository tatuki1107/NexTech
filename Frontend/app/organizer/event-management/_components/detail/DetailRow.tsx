type DetailRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

export default function DetailRow({
  label,
  value,
  valueClassName = "text-fg-neutral-primary",
}: DetailRowProps) {
  return (
    <div className="flex items-center gap-8 border-b border-ol-neutral-primary py-4 last:border-b-0">
      <dt className="w-30 shrink-0 text-sm text-fg-neutral-secondary">
        {label}
      </dt>
      <dd className={`text-base font-bold ${valueClassName}`}>{value}</dd>
    </div>
  );
}

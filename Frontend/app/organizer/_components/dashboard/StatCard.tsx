type StatCardProps = {
  label: string;
  value: string;
  note: string;
  valueClassName: string;
};

export default function StatCard({
  label,
  value,
  note,
  valueClassName,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-ol-neutral-primary bg-white p-5">
      <p className="text-xs text-fg-neutral-secondary">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</p>
      <p className="mt-4 text-xs text-fg-neutral-secondary">{note}</p>
    </div>
  );
}
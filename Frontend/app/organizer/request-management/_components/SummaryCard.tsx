type SummaryCardProps = {
  label: string;
  value: string;
  note?: string;
};

export default function SummaryCard({ label, value, note }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-ol-neutral-primary bg-white p-5">
      <p className="text-xs text-fg-neutral-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold text-fg-brand-primary">{value}</p>
      {note && <p className="mt-4 text-xs text-fg-neutral-secondary">{note}</p>}
    </div>
  );
}

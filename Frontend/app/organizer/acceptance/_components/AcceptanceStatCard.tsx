type AcceptanceStatCardProps = {
  label: string;
  value: number;
};

export default function AcceptanceStatCard({
  label,
  value,
}: AcceptanceStatCardProps) {
  return (
    <div className="rounded-xl border border-ol-neutral-primary bg-white p-5">
      <p className="text-sm font-bold text-fg-neutral-primary">{label}</p>
      <p className="mt-2 text-4xl font-bold text-fg-neutral-primary">{value}</p>
    </div>
  );
}

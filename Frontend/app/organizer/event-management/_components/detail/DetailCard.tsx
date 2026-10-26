import type { ReactNode } from "react";

type DetailCardProps = {
  title: string;
  children: ReactNode;
};

export default function DetailCard({ title, children }: DetailCardProps) {
  return (
    <section className="rounded-xl border border-ol-neutral-primary bg-white p-6">
      <h2 className="text-xl font-bold text-fg-neutral-primary">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

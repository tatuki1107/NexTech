import type { Insight } from "../_lib/analytics";

type InsightCardProps = {
  insight: Insight;
};

export default function InsightCard({ insight }: InsightCardProps) {
  return (
    <div className={`min-h-33 rounded-xl p-5 ${insight.className}`}>
      <h3 className="text-base font-bold text-fg-neutral-primary">
        {insight.title}
      </h3>
      <p className="mt-4 text-sm text-fg-neutral-secondary">
        {insight.description}
      </p>
    </div>
  );
}

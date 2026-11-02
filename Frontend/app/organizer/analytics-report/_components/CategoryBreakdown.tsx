import type { CategoryCount } from "../_lib/analytics";

type CategoryBreakdownProps = {
  categories: CategoryCount[];
};

// 上位2件だけ色を変え、それ以外は同じ色にする
const RANK_COLORS = [
  { bar: "bg-fg-brand-primary", text: "text-fg-brand-primary" },
  { bar: "bg-fg-accent-green", text: "text-fg-accent-green" },
];
const DEFAULT_COLOR = {
  bar: "bg-fg-neutral-primary",
  text: "text-fg-neutral-primary",
};

export default function CategoryBreakdown({
  categories,
}: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-fg-neutral-secondary">
        この期間の申込はありません。
      </p>
    );
  }

  const sorted = [...categories].sort((a, b) => b.count - a.count);
  const maxCount = sorted[0].count;

  return (
    <ul className="space-y-5">
      {sorted.map((category, index) => {
        const color = RANK_COLORS[index] ?? DEFAULT_COLOR;
        const widthRate = maxCount > 0 ? (category.count / maxCount) * 100 : 0;

        return (
          <li key={category.name} className="space-y-2">
            <p className="text-sm text-fg-neutral-primary">{category.name}</p>
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="h-2 flex-1 overflow-hidden rounded-full bg-bg-neutral-primary"
              >
                <div
                  className={`h-full rounded-full ${color.bar}`}
                  style={{ width: `${widthRate}%` }}
                />
              </div>
              <span
                className={`w-12 shrink-0 text-right text-sm font-bold ${color.text}`}
              >
                {category.count}件
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

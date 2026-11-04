import type { WeeklyCount } from "../_lib/analytics";

type WeeklyChartProps = {
  weeks: WeeklyCount[];
};

export default function WeeklyChart({ weeks }: WeeklyChartProps) {
  if (weeks.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-fg-neutral-secondary">
        この期間の申込はありません。
      </p>
    );
  }

  const maxCount = Math.max(...weeks.map((week) => week.count));

  return (
    <div className="relative overflow-x-auto">
      <ul
        aria-label="期間ごとの申込数"
        className="flex h-64 items-end gap-4"
        style={{ minWidth: weeks.length * 72 }}
      >
        {weeks.map((week, index) => {
          // 直近の週だけを強調する
          const isLatest = index === weeks.length - 1;
          const heightRate = maxCount > 0 ? (week.count / maxCount) * 100 : 0;

          return (
            <li
              key={week.label}
              className="flex h-full flex-1 flex-col items-center gap-2"
            >
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  title={`${week.label}: ${week.count}件`}
                  className={`w-full max-w-10 rounded-lg ${
                    isLatest ? "bg-fg-brand-primary" : "bg-bg-accent-blue"
                  }`}
                  style={{ height: `${heightRate}%` }}
                />
              </div>
              <span className="text-xs text-fg-neutral-secondary">
                {week.label}
                <span className="sr-only">: {week.count}件</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

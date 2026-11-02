export type AnalyticsStat = {
  label: string;
  value: string;
  note: string;
  colorClassName: string;
};

export type WeeklyCount = {
  label: string;
  count: number;
};

export type CategoryCount = {
  name: string;
  count: number;
};

export type Insight = {
  title: string;
  description: string;
  className: string;
};
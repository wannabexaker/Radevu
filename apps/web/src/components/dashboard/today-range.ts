export const todayRangeOptions = [7, 14, 30] as const;

export type TodayRangeDays = (typeof todayRangeOptions)[number];

export const todayRangeLabels: Record<TodayRangeDays, string> = {
  7: "7 ημέρες",
  14: "14 ημέρες",
  30: "1 μήνας"
};

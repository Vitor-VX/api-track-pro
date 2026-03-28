import { v4 as uuidv4 } from "uuid";

export const generateApiKey = (): string => uuidv4();

export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
};

export const startOfToday = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

export const endOfToday = (): Date => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now;
};

export const last7Days = (): Date[] => {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
};

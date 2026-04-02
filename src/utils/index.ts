import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";

const TZ = "America/Sao_Paulo";
export const generateApiKey = (): string => uuidv4();

export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
};

export const startOfToday = (): Date => {
  return moment.tz(TZ).startOf("day").toDate();
};

export const endOfToday = (): Date => {
  return moment.tz(TZ).endOf("day").toDate();
};

export const last7Days = (): Date[] => {
  const days: Date[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = moment
      .tz(TZ)
      .startOf("day")
      .subtract(i, "days")
      .toDate();

    days.push(date);
  }

  return days;
};
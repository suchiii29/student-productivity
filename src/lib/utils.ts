import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ⚠️ Do NOT remove this — it is already used across your UI
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ⬇️ Add this below — new helper for calculating sleep duration
export function calculateSleepHours(sleepTime: string, wakeTime: string): number {
  // sleepTime & wakeTime expected to be in "HH:MM" 24-hour format
  const parse = (s: string) => {
    const [hStr, mStr] = s.split(":");
    const h = Number(hStr ?? 0);
    const m = Number(mStr ?? 0);
    return h * 60 + m;
  };

  const sleepMin = parse(sleepTime);
  const wakeMin = parse(wakeTime);

  // if wake < sleep → means next day
  let wake = wakeMin;
  if (wake < sleepMin) wake += 24 * 60;

  const diffMin = Math.max(0, wake - sleepMin);
  return Math.round((diffMin / 60) * 10) / 10; // returns hours with one decimal (e.g., 7.5)
}

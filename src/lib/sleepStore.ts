// src/lib/sleepStore.ts
export type SleepRecord = {
  date: string;
  hours: number;
  score: number;
  verdict: string;
};

const KEY = "sleepRecords";

export function saveSleepRecord(rec: SleepRecord) {
  const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
  existing.push(rec);
  localStorage.setItem(KEY, JSON.stringify(existing));
}

export function getSleepRecords() {
  return JSON.parse(localStorage.getItem(KEY) || "[]") as SleepRecord[];
}

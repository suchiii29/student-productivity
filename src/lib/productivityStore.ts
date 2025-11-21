// src/lib/productivityStore.ts

export interface ProductivityEntry {
  date: string;
  score: number;
}

/**
 * Add or subtract productivity points
 * +10 points when task completed
 * -5 points when task marked uncompleted
 */
export function saveDailyProductivity(completed: boolean) {
  const today = new Date().toISOString().split("T")[0];

  const stored = localStorage.getItem("productivity");
  let data: ProductivityEntry[] = stored ? JSON.parse(stored) : [];

  // find today's record
  const index = data.findIndex((entry) => entry.date === today);

  let scoreChange = completed ? 10 : -5;

  if (index !== -1) {
    data[index].score += scoreChange;
  } else {
    data.push({ date: today, score: scoreChange });
  }

  localStorage.setItem("productivity", JSON.stringify(data));
}

/** Get last 7 days productivity for dashboard */
export function getDailyProductivity(): ProductivityEntry[] {
  const stored = localStorage.getItem("productivity");
  if (!stored) return [];

  const data: ProductivityEntry[] = JSON.parse(stored);
  return data.slice(-7);
}

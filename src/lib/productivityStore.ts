
// src/lib/productivityStore.ts

export interface ProductivityEntry {
  date: string;
  score: number;
}

// 📌 Save productivity score for the day
export function saveDailyProductivity(score: number) {
  const today = new Date().toISOString().split("T")[0];

  const stored = localStorage.getItem("productivity");
  let data: ProductivityEntry[] = stored ? JSON.parse(stored) : [];

  // If today's record already exists → update instead of adding duplicate
  const index = data.findIndex((entry) => entry.date === today);
  if (index !== -1) {
    data[index].score = score;
  } else {
    data.push({ date: today, score });
  }

  localStorage.setItem("productivity", JSON.stringify(data));
}

// 📌 Get productivity trend for the dashboard
export function getDailyProductivity(): ProductivityEntry[] {
  const stored = localStorage.getItem("productivity");
  if (!stored) return [];

  const data: ProductivityEntry[] = JSON.parse(stored);

  // Keep only last 7 days
  return data.slice(-7);
}

// src/lib/analyticsAI.ts (Robust - Gemini with safe fallback)
// Note: Put your Gemini key in .env as VITE_GEMINI_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface RoutineLog {
  id: string;
  date: string;
  sleepHours: number;
  studyHours: number;
  exerciseMinutes: number;
  breaks: number;
  score?: number;
}

export interface TaskData {
  id: string;
  title: string;
  category?: string;
  priority?: string;
  duration?: number;
  status: "pending" | "completed" | string;
  completedAt?: string;
  completedHour?: number;
}

export interface AIAnalyticsInsight {
  type: "sleep" | "productivity" | "focus" | "trend" | "warning" | "tip";
  title: string;
  description: string;
  metric?: string;
  confidence: number;
}

export interface AnalyticsAIResult {
  insights: AIAnalyticsInsight[];
  sleepProductivityCorrelation: string;
  peakFocusHours: string[];
  weeklyTrend: "improving" | "declining" | "stable";
  overallScore: number;
  topRecommendation: string;
}

/**
 * Try to extract JSON object substring from a block of text.
 * Returns null if nothing parsable found.
 */
function extractJSON(text: string): string | null {
  if (!text || typeof text !== "string") return null;
  // Try to find the first top-level { ... } block (greedy)
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

/**
 * Local deterministic fallback analysis (used if API fails or returns bad JSON).
 * Keeps return shape consistent with AnalyticsAIResult.
 */
function localFallbackAnalysis(routineLogs: RoutineLog[], tasks: TaskData[]): AnalyticsAIResult {
  const completedTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.status === "completed");
  const pendingTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.status === "pending");

  const avgSleepNum =
    routineLogs.length > 0 ? routineLogs.reduce((s, r) => s + (r.sleepHours || 0), 0) / routineLogs.length : NaN;
  const avgStudyNum =
    routineLogs.length > 0 ? routineLogs.reduce((s, r) => s + (r.studyHours || 0), 0) / routineLogs.length : NaN;

  // completion rate
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // simple best hours from completedHour counts
  const hourCounts: Record<number, number> = {};
  completedTasks.forEach(t => {
    if (typeof t.completedHour === "number") hourCounts[t.completedHour] = (hourCounts[t.completedHour] || 0) + 1;
  });
  const sortedHours = Object.entries(hourCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([h]) => {
      const hr = Number(h);
      const label = hr === 0 ? "12AM" : hr < 12 ? `${hr}AM` : hr === 12 ? "12PM" : `${hr - 12}PM`;
      return label;
    });

  // worst hours: choose hours with zero or low counts from a typical day range
  const typicalHours = [8, 10, 12, 14, 16, 18, 20];
  const worst = typicalHours
    .map(h => ({ h, c: hourCounts[h] || 0 }))
    .sort((a, b) => a.c - b.c)
    .slice(0, 2)
    .map(x => (x.h < 12 ? `${x.h}AM` : x.h === 12 ? "12PM" : `${x.h - 12}PM`));

  // compute a simple overall score
  let score = Math.round((completionRate * 0.6) + (Math.max(0, Math.min(100, (avgStudyNum / 8) * 100)) * 0.3));
  if (!Number.isFinite(score)) score = 50;

  // sleep-productivity correlation placeholder
  let sleepCorrelation = "Not enough routine data to determine correlation.";
  if (Number.isFinite(avgSleepNum) && Number.isFinite(avgStudyNum)) {
    if (avgSleepNum >= 7.5) sleepCorrelation = `Good sleep (avg ${avgSleepNum.toFixed(1)}h) seems to support study time (${avgStudyNum.toFixed(1)}h).`;
    else sleepCorrelation = `Average sleep ${isNaN(avgSleepNum) ? "N/A" : avgSleepNum.toFixed(1)}h — may be impacting productivity.`;
  }

  // insights
  const insights: AIAnalyticsInsight[] = [
    {
      type: "productivity",
      title: "Completion Rate",
      description: `You completed ${completedTasks.length} out of ${tasks.length} tasks (${completionRate}%).`,
      metric: `${completionRate}%`,
      confidence: 80,
    },
    {
      type: "focus",
      title: "Probable Peak Hours",
      description: sortedHours.length > 0 ? `Most completed tasks happened at ${sortedHours.slice(0,3).join(", ")}.` : "No clear peak hour from data.",
      metric: sortedHours.slice(0,3).join(", "),
      confidence: sortedHours.length > 0 ? 70 : 50,
    },
  ];

  if (Number.isFinite(avgSleepNum) && avgSleepNum < 7) {
    insights.push({
      type: "sleep",
      title: "Low Average Sleep",
      description: `Your average sleep is ${avgSleepNum.toFixed(1)} hours; aim for 7-8 hours to improve focus.`,
      metric: `${avgSleepNum.toFixed(1)} hrs`,
      confidence: 90,
    });
  } else if (Number.isFinite(avgSleepNum)) {
    insights.push({
      type: "sleep",
      title: "Healthy Sleep Average",
      description: `Your average sleep is ${avgSleepNum.toFixed(1)} hours — that's within a healthy range.`,
      metric: `${avgSleepNum.toFixed(1)} hrs`,
      confidence: 75,
    });
  }

  insights.push({
    type: "tip",
    title: "Small Scheduling Tip",
    description: pendingTasks.length > 0 ? `Try scheduling 1 high-priority task during your top peak hour (${sortedHours[0] ?? "evening"}).` : "No pending tasks — keep the momentum!",
    confidence: 70,
  });

  return {
    insights,
    sleepProductivityCorrelation: sleepCorrelation,
    peakFocusHours: sortedHours.slice(0, 3),
    weeklyTrend: "stable",
    overallScore: score,
    topRecommendation: pendingTasks.length > 0 ? `Focus on your highest priority task: ${pendingTasks[0]?.title ?? "—"}` : "Keep up the good work — no pending tasks!",
  };
}

/**
 * Analyze routineLogs & tasks via Gemini (if available). If the AI call fails or returns invalid JSON,
 * the local fallback will be returned instead.
 */
export async function analyzeAnalyticsWithAI(
  routineLogs: RoutineLog[],
  tasks: TaskData[]
): Promise<AnalyticsAIResult> {
  // Protect against bad inputs
  const safeRoutineLogs = Array.isArray(routineLogs) ? routineLogs : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Build lightweight prompt
  const completedTasks = safeTasks.filter(t => t.status === "completed");
  const pendingTasks = safeTasks.filter(t => t.status === "pending");

  const avgSleep = safeRoutineLogs.length > 0
    ? (safeRoutineLogs.reduce((s, r) => s + (r.sleepHours || 0), 0) / safeRoutineLogs.length).toFixed(1)
    : "N/A";

  const avgStudy = safeRoutineLogs.length > 0
    ? (safeRoutineLogs.reduce((s, r) => s + (r.studyHours || 0), 0) / safeRoutineLogs.length).toFixed(1)
    : "N/A";

  const completionRate = safeTasks.length > 0 ? Math.round((completedTasks.length / safeTasks.length) * 100) : 0;

  // Build hour counts
  const hourCounts: Record<number, number> = {};
  completedTasks.forEach(t => {
    if (typeof t.completedHour === "number") hourCounts[t.completedHour] = (hourCounts[t.completedHour] || 0) + 1;
  });

  const prompt = `You are a productivity analytics AI. Return JSON only (no extra text).
DATA:
RoutineLogs: ${JSON.stringify(safeRoutineLogs.slice(0, 7), null, 2)}
TasksSummary: total=${safeTasks.length}, completed=${completedTasks.length}, pending=${pendingTasks.length}, completionRate=${completionRate}%
CompletionByHour: ${JSON.stringify(hourCounts, null, 2)}
Averages: avgSleep=${avgSleep}, avgStudy=${avgStudy}

Return JSON with keys:
insights (array), sleepProductivityCorrelation (string), peakFocusHours (string[]), weeklyTrend ("improving"|"declining"|"stable"), overallScore (number), topRecommendation (string)

Make it concise and use real numbers when possible.
`;

  // If no API key is present, skip the API call and return fallback
  if (!GEMINI_API_KEY) {
    return localFallbackAnalysis(safeRoutineLogs, safeTasks);
  }

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 900 },
      }),
    });

    if (!res.ok) {
      console.warn("Gemini API returned non-ok status:", res.status);
      return localFallbackAnalysis(safeRoutineLogs, safeTasks);
    }

    const data = await res.json().catch(() => null);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Remove fenced json and try to extract JSON block
    const cleaned = String(text).replace(/```json\s?/, "").replace(/```/g, "").trim();
    const jsonText = extractJSON(cleaned);

    if (!jsonText) {
      console.warn("Could not extract JSON from Gemini response, falling back.");
      return localFallbackAnalysis(safeRoutineLogs, safeTasks);
    }

    const parsed = JSON.parse(jsonText);

    // Lightweight validation of expected keys — if missing, fall back
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.insights) || !Array.isArray(parsed.peakFocusHours)) {
      console.warn("Parsed AI JSON missing expected fields, falling back.");
      return localFallbackAnalysis(safeRoutineLogs, safeTasks);
    }

    // Ensure types and return
    const result: AnalyticsAIResult = {
      insights: parsed.insights as AIAnalyticsInsight[],
      sleepProductivityCorrelation: String(parsed.sleepProductivityCorrelation || parsed.sleepProductivityCorrelation === 0 ? parsed.sleepProductivityCorrelation : ""),
      peakFocusHours: (parsed.peakFocusHours || []).slice(0, 10).map(String),
      weeklyTrend: parsed.weeklyTrend === "improving" || parsed.weeklyTrend === "declining" ? parsed.weeklyTrend : "stable",
      overallScore: Number.isFinite(Number(parsed.overallScore)) ? Number(parsed.overallScore) : Math.round((completionRate + 50) / 2),
      topRecommendation: String(parsed.topRecommendation || `Try focusing on ${pendingTasks[0]?.title ?? "your next task"}`),
    };

    return result;
  } catch (err) {
    console.error("Analytics AI call failed:", err);
    return localFallbackAnalysis(safeRoutineLogs, safeTasks);
  }
}

// Generate chart data from real routine logs
export function generateWeeklyChartData(routineLogs: RoutineLog[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const last7 = Array.isArray(routineLogs) ? routineLogs.slice(0, 7).reverse() : [];

  return last7.map((log, i) => {
    const date = new Date(log.date);
    return {
      day: days[date.getDay()] || `Day ${i + 1}`,
      productivity: log.score ?? Math.round(((log.studyHours ?? 0) / 8) * 100),
      sleep: log.sleepHours ?? 0,
    };
  });
}

// Generate hourly focus data from completed tasks
export function generateHourlyFocusData(tasks: TaskData[]) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const hours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
  const hourLabels = ["6AM", "8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM", "10PM"];

  const completed = safeTasks.filter(t => t.status === "completed" && typeof t.completedHour === "number");

  return hours.map((h, i) => {
    const count = completed.filter(t => t.completedHour === h || t.completedHour === (h + 1)).length;
    const focus = Math.min(100, Math.round(count * 25 + Math.random() * 15));
    return {
      hour: hourLabels[i],
      focus,
      tasks: count,
    };
  });
}

// Generate task completion pie data
export function generateTaskCompletionData(tasks: TaskData[]) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const completed = safeTasks.filter(t => t.status === "completed").length;
  const pending = safeTasks.filter(t => t.status === "pending").length;
  const total = completed + pending;

  return [
    { name: "Completed", value: total > 0 ? Math.round((completed / total) * 100) : 0, color: "hsl(var(--primary))" },
    { name: "Pending", value: total > 0 ? Math.round((pending / total) * 100) : 0, color: "hsl(var(--muted))" },
  ];
}

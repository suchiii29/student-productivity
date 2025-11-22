// src/lib/timeAnalyzer.ts
import { getCompletedTasks, getTasks, EnhancedTask } from "./taskStore";

// Time slot productivity data
export interface HourlyProductivity {
  hour: number;
  label: string;          // "6 AM", "7 PM", etc.
  tasksCompleted: number;
  totalDuration: number;  // minutes of work done in this hour
  avgDuration: number;
  categories: string[];
  score: number;          // 0-100 productivity score
}

export interface TimeRecommendation {
  type: "peak" | "avoid" | "insight" | "sleep" | "category";
  icon: string;
  title: string;
  description: string;
  confidence: number; // 0-100
}

export interface ProductivityAnalysis {
  hourlyData: HourlyProductivity[];
  peakHours: number[];
  lowHours: number[];
  recommendations: TimeRecommendation[];
  totalTasksAnalyzed: number;
  bestCategory: { name: string; count: number } | null;
}

// Convert hour (0-23) to readable label
function hourToLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

// Analyze productivity by hour of day
export function analyzeProductivityByHour(): ProductivityAnalysis {
  const tasks = getCompletedTasks();
  
  // Initialize hourly buckets (0-23)
  const hourlyBuckets: Map<number, EnhancedTask[]> = new Map();
  for (let i = 0; i < 24; i++) {
    hourlyBuckets.set(i, []);
  }
  
  // Group tasks by completion hour
  tasks.forEach(task => {
    if (task.completedHour !== undefined) {
      hourlyBuckets.get(task.completedHour)?.push(task);
    } else if (task.completedAt) {
      // Fallback: parse from completedAt
      const hour = new Date(task.completedAt).getHours();
      hourlyBuckets.get(hour)?.push(task);
    }
  });
  
  // Calculate max tasks in any hour (for normalization)
  let maxTasks = 0;
  hourlyBuckets.forEach(bucket => {
    if (bucket.length > maxTasks) maxTasks = bucket.length;
  });
  
  // Build hourly productivity data
  const hourlyData: HourlyProductivity[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const bucket = hourlyBuckets.get(hour) || [];
    const totalDuration = bucket.reduce((sum, t) => sum + (t.duration || 0), 0);
    const categories = [...new Set(bucket.map(t => t.category).filter(Boolean))];
    
    // Score: weighted combination of task count and duration
    const taskScore = maxTasks > 0 ? (bucket.length / maxTasks) * 60 : 0;
    const durationScore = Math.min(totalDuration / 120, 1) * 40; // Cap at 120 mins
    const score = Math.round(taskScore + durationScore);
    
    hourlyData.push({
      hour,
      label: hourToLabel(hour),
      tasksCompleted: bucket.length,
      totalDuration,
      avgDuration: bucket.length > 0 ? Math.round(totalDuration / bucket.length) : 0,
      categories,
      score,
    });
  }
  
  // Find peak hours (top 3 with score > 0)
  const sortedByScore = [...hourlyData]
    .filter(h => h.tasksCompleted > 0)
    .sort((a, b) => b.score - a.score);
  
  const peakHours = sortedByScore.slice(0, 3).map(h => h.hour);
  
  // Find low productivity hours (bottom 3 among hours with some activity)
  const lowHours = sortedByScore
    .slice(-3)
    .filter(h => h.score < 30)
    .map(h => h.hour);
  
  // Category analysis
  const categoryCount: Map<string, number> = new Map();
  tasks.forEach(t => {
    if (t.category) {
      categoryCount.set(t.category, (categoryCount.get(t.category) || 0) + 1);
    }
  });
  
  let bestCategory: { name: string; count: number } | null = null;
  categoryCount.forEach((count, name) => {
    if (!bestCategory || count > bestCategory.count) {
      bestCategory = { name, count };
    }
  });
  
  // Generate recommendations
  const recommendations = generateRecommendations(hourlyData, peakHours, lowHours, bestCategory);
  
  return {
    hourlyData,
    peakHours,
    lowHours,
    recommendations,
    totalTasksAnalyzed: tasks.length,
    bestCategory,
  };
}

// Generate smart recommendations
function generateRecommendations(
  hourlyData: HourlyProductivity[],
  peakHours: number[],
  lowHours: number[],
  bestCategory: { name: string; count: number } | null
): TimeRecommendation[] {
  const recommendations: TimeRecommendation[] = [];
  
  // Not enough data
  if (hourlyData.every(h => h.tasksCompleted === 0)) {
    recommendations.push({
      type: "insight",
      icon: "📊",
      title: "Start Tracking!",
      description: "Complete some tasks to see your productivity patterns. We need at least 5-10 completed tasks for accurate insights.",
      confidence: 100,
    });
    return recommendations;
  }
  
  // Peak hours recommendation
  if (peakHours.length > 0) {
    const peakLabels = peakHours.map(h => hourToLabel(h)).join(", ");
    const peakData = hourlyData.filter(h => peakHours.includes(h.hour));
    const avgScore = Math.round(peakData.reduce((s, h) => s + h.score, 0) / peakData.length);
    
    recommendations.push({
      type: "peak",
      icon: "🔥",
      title: "Your Peak Productivity Hours",
      description: `You're most productive around ${peakLabels}. Schedule important or difficult tasks during these times for best results.`,
      confidence: Math.min(avgScore + 20, 95),
    });
  }
  
  // Consecutive peak hours insight
  if (peakHours.length >= 2) {
    const sorted = [...peakHours].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) {
        recommendations.push({
          type: "insight",
          icon: "⚡",
          title: "Power Block Detected",
          description: `You have a strong productivity block from ${hourToLabel(sorted[i])} to ${hourToLabel(sorted[i + 1] + 1)}. Consider protecting this time for deep work.`,
          confidence: 80,
        });
        break;
      }
    }
  }
  
  // Low hours warning
  if (lowHours.length > 0) {
    const lowLabels = lowHours.slice(0, 2).map(h => hourToLabel(h)).join(" and ");
    recommendations.push({
      type: "avoid",
      icon: "😴",
      title: "Low Focus Periods",
      description: `Your productivity dips around ${lowLabels}. Consider taking breaks or doing lighter tasks during these times.`,
      confidence: 70,
    });
  }
  
  // Morning vs Evening analysis
  const morningScore = hourlyData.slice(5, 12).reduce((s, h) => s + h.score, 0);
  const eveningScore = hourlyData.slice(17, 23).reduce((s, h) => s + h.score, 0);
  
  if (morningScore > eveningScore * 1.5) {
    recommendations.push({
      type: "insight",
      icon: "🌅",
      title: "You're a Morning Person!",
      description: "Your data shows you complete more tasks in the morning. Try front-loading your important work early in the day.",
      confidence: 75,
    });
  } else if (eveningScore > morningScore * 1.5) {
    recommendations.push({
      type: "insight",
      icon: "🌙",
      title: "You're a Night Owl!",
      description: "You're more productive in the evening. Schedule demanding tasks for later in the day when you're at your best.",
      confidence: 75,
    });
  }
  
  // Category insight
  if (bestCategory && bestCategory.count >= 3) {
    recommendations.push({
      type: "category",
      icon: "📚",
      title: `${bestCategory.name} Champion`,
      description: `You've completed ${bestCategory.count} ${bestCategory.name.toLowerCase()} tasks! Keep up the great work in this area.`,
      confidence: 85,
    });
  }
  
  // Sleep/late night warning
  const lateNightTasks = hourlyData.slice(0, 5).reduce((s, h) => s + h.tasksCompleted, 0);
  if (lateNightTasks >= 3) {
    recommendations.push({
      type: "sleep",
      icon: "💤",
      title: "Watch Your Sleep!",
      description: "You've been completing tasks between midnight and 5 AM. Consider adjusting your schedule for better rest.",
      confidence: 80,
    });
  }
  
  return recommendations;
}

// Get best time for a specific category
export function getBestTimeForCategory(category: string): number | null {
  const tasks = getCompletedTasks().filter(t => t.category === category);
  
  if (tasks.length < 2) return null;
  
  const hourCounts: Map<number, number> = new Map();
  tasks.forEach(t => {
    if (t.completedHour !== undefined) {
      hourCounts.set(t.completedHour, (hourCounts.get(t.completedHour) || 0) + 1);
    }
  });
  
  let bestHour = null;
  let maxCount = 0;
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count;
      bestHour = hour;
    }
  });
  
  return bestHour;
}

// Suggest optimal time for a new task
export function suggestTimeForTask(category: string, priority: string): string {
  const analysis = analyzeProductivityByHour();
  
  // For high priority, suggest peak hours
  if (priority === "High" && analysis.peakHours.length > 0) {
    return `Best time: ${hourToLabel(analysis.peakHours[0])} (your peak hour)`;
  }
  
  // Check category-specific best time
  const categoryBest = getBestTimeForCategory(category);
  if (categoryBest !== null) {
    return `Suggested: ${hourToLabel(categoryBest)} (you complete ${category} tasks well at this time)`;
  }
  
  // Default to first peak hour
  if (analysis.peakHours.length > 0) {
    return `Try: ${hourToLabel(analysis.peakHours[0])}`;
  }
  
  return "Complete more tasks to get personalized suggestions!";
}

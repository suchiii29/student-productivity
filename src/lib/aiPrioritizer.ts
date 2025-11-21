
export interface RawTask {
  id: string;
  title: string;
  duration: number; // in minutes
  priority: "High" | "Medium" | "Low";
  deadline?: string;
  status?: string;
}

export interface ScheduledTask extends RawTask {
  aiScore: number;
  scheduledStart: string;
  scheduledEnd: string;
}

// 🔹 Main scoring logic
export function prioritizeTasks(tasks: RawTask[]) {
  const pending = tasks.filter(t => t.status !== "completed");

  return pending
    .map(task => {
      let score = 0;

      if (task.priority === "High") score += 50;
      else if (task.priority === "Medium") score += 30;
      else score += 10;

      if (task.deadline) {
        const days = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (!isNaN(days)) {
          if (days <= 0) score += 40;
          else score += Math.max(0, 40 - days * 4);
        }
      }

      if (task.duration <= 60) score += 10;
      if (task.duration > 120) score -= 5;

      return { ...task, aiScore: score };
    })
    .sort((a, b) => b.aiScore - a.aiScore);
}

// 🔹 Scheduling without overlapping
export function prioritizeAndSchedule(tasks: RawTask[]): ScheduledTask[] {
  const ranked = prioritizeTasks(tasks);
  const scheduled: ScheduledTask[] = [];

  let currentTime = 6 * 60; // Start at 6:00 AM

  ranked.forEach(task => {
    const duration = task.duration || 60;

    const start = currentTime;
    const end = start + duration;

    scheduled.push({
      ...task,
      aiScore: task.aiScore,
      scheduledStart: minutesToTime(start),
      scheduledEnd: minutesToTime(end),
    });

    currentTime = end + 10; // 10min buffer
  });

  return scheduled;
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

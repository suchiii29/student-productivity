// src/lib/aiRecommendationEngine.ts
import OpenAI from "openai";



const client = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "missing",
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true,
});
export interface AIRecommendation {
  title: string;
  description: string;
  type: "peak" | "avoid" | "study" | "break" | "sleep" | "insight" | "category";
  icon: string;
  timeSlot?: string;
  confidence: number;
}

export interface AIAnalysisResult {
  productivityScore: number;
  bestHours: string[];
  worstHours: string[];
  summary: string;
  recommendations: AIRecommendation[];
  insights: string[];
}

export interface TaskForAI {
  id: string;
  title: string;
  duration?: number;
  priority?: string;
  deadline?: string;
  category?: string;
  status?: string;
  completedAt?: string;
  completedHour?: number;
}

function cleanAIResponse(text: string): string {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const jsonMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) cleaned = objectMatch[0];
  return cleaned;
}

export async function analyzeProductivityWithAI(
  tasks: TaskForAI[],
  routineLogs: any[]
): Promise<AIAnalysisResult> {
  try {
    const completedTasks = tasks.filter(t => t.status === "completed");
    
    const taskSummary = {
      total: tasks.length,
      completed: completedTasks.length,
      pending: tasks.filter(t => t.status !== "completed").length,
      categories: [...new Set(tasks.map(t => t.category).filter(Boolean))],
      averageDuration: tasks.length > 0 ? tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / tasks.length : 0,
      highPriority: tasks.filter(t => t.priority === "High").length,
      completedByHour: completedTasks.reduce((acc: any, t) => {
        if (t.completedHour !== undefined) {
          acc[t.completedHour] = (acc[t.completedHour] || 0) + 1;
        }
        return acc;
      }, {}),
    };

    const routineSummary = {
      totalLogs: routineLogs.length,
      avgSleep: routineLogs.length > 0 ? routineLogs.reduce((sum, l) => sum + (l.sleepHours || 0), 0) / routineLogs.length : 0,
      avgStudy: routineLogs.length > 0 ? routineLogs.reduce((sum, l) => sum + (l.studyHours || 0), 0) / routineLogs.length : 0,
      avgScore: routineLogs.length > 0 ? routineLogs.reduce((sum, l) => sum + (l.score || 0), 0) / routineLogs.length : 0,
    };

    const prompt = `Analyze this data and return ONLY valid JSON:
Task Summary: ${JSON.stringify(taskSummary)}
Routine Summary: ${JSON.stringify(routineSummary)}

Return:
{
  "productivityScore": <0-100>,
  "bestHours": ["9 AM", "2 PM"],
  "worstHours": ["12 PM", "4 PM"],
  "summary": "<brief analysis>",
  "recommendations": [
    {"title": "<title>", "description": "<desc>", "type": "peak", "icon": "🔥", "timeSlot": "9-11 AM", "confidence": 85}
  ],
  "insights": ["<insight 1>", "<insight 2>"]
}`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let aiResponse = response.choices[0].message.content || "{}";
    aiResponse = cleanAIResponse(aiResponse);
    const result = JSON.parse(aiResponse) as AIAnalysisResult;
    
    return {
      productivityScore: result.productivityScore || 50,
      bestHours: result.bestHours || ["9 AM", "2 PM"],
      worstHours: result.worstHours || ["12 PM", "4 PM"],
      summary: result.summary || "Not enough data yet.",
      recommendations: result.recommendations || [],
      insights: result.insights || [],
    };
  } catch (error) {
    console.error("AI Error:", error);
    return {
      productivityScore: 50,
      bestHours: ["9 AM", "2 PM"],
      worstHours: ["12 PM", "4 PM"],
      summary: "AI unavailable. Complete more tasks.",
      recommendations: [{
        title: "Track More Data",
        description: "Complete 10+ tasks for AI insights.",
        type: "insight",
        icon: "📊",
        confidence: 100,
      }],
      insights: ["Need more data"],
    };
  }
}

export async function prioritizeTasksWithAI(tasks: TaskForAI[]): Promise<any[]> {
  try {
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    if (pendingTasks.length === 0) return [];

    const prompt = `Prioritize tasks, return ONLY JSON:
Tasks: ${JSON.stringify(pendingTasks)}
Return: {"rankedTasks": [{"id": "<id>", "title": "<title>", "aiScore": <0-100>, "reasoning": "<why>", "suggestedTime": "<time>", "category": "<cat>", "priority": "<pri>", "deadline": "<date>", "duration": <num>}]}`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    let aiResponse = response.choices[0].message.content || "{}";
    aiResponse = cleanAIResponse(aiResponse);
    const result = JSON.parse(aiResponse);
    return result.rankedTasks || [];
  } catch (error) {
    console.error("AI Prioritization Error:", error);
    return fallbackPrioritization(tasks);
  }
}

function fallbackPrioritization(tasks: TaskForAI[]): any[] {
  return tasks
    .filter(t => t.status !== "completed")
    .map(task => {
      let score = 0;
      if (task.priority === "High") score += 50;
      else if (task.priority === "Medium") score += 30;
      else score += 10;

      if (task.deadline) {
        const days = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (days <= 1) score += 40;
        else if (days <= 3) score += 30;
        else if (days <= 7) score += 20;
      }

      if (task.duration && task.duration <= 30) score += 10;

      return {
        ...task,
        aiScore: score,
        reasoning: "Rule-based prioritization",
        suggestedTime: "Morning (9-11 AM)",
      };
    })
    .sort((a, b) => b.aiScore - a.aiScore);
}

export const prioritizeTasks = fallbackPrioritization;
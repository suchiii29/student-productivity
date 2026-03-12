// src/lib/geminiAI.ts (SAFE QROQ VERSION)

import OpenAI from "openai";
const client = new OpenAI({
apiKey: import.meta.env.VITE_GROQ_API_KEY,
baseURL: "https://api.groq.com/openai/v1",
});
export interface AIRecommendation {
  title: string;
  description: string;
  type: "peak" | "avoid" | "study" | "break" | "sleep";
  timeSlot: string;
  confidence: number;
}

export interface AIAnalysisResult {
  productivityScore: number;
  bestHours: string[];
  worstHours: string[];
  summary: string;
  recommendations: AIRecommendation[];
}

function extractJSON(text: string) {
  const match = text.match(/\{[\s\S]*\}$/);
  return match ? match[0] : null;
}

export async function analyzeWithGemini(tasks: any[]): Promise<AIAnalysisResult> {
  const prompt = `
You are an AI that analyzes user tasks and identifies productivity patterns.
Return JSON only (no explanation, no notes).

Tasks:
${JSON.stringify(tasks, null, 2)}

Return strictly:
{
  "productivityScore": number,
  "bestHours": string[],
  "worstHours": string[],
  "summary": string,
  "recommendations": [
    {
      "title": string,
      "description": string,
      "type": "peak" | "avoid" | "study" | "break" | "sleep",
      "timeSlot": string,
      "confidence": number
    }
  ]
}
`;

  const response = await client.chat.completions.create({
    model: "deepseek-r1:latest",
    messages: [{ role: "user", content: prompt }],
  });

  let text = response.choices[0].message.content;

  // remove <think> blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  // extract JSON only
  const jsonText = extractJSON(text);
  if (!jsonText) throw new Error("AI did not return valid JSON.");

  return JSON.parse(jsonText);
}

export async function getQuickRecommendation(tasks: any[]): Promise<string> {
  const response = await client.chat.completions.create({
    model: "deepseek-r1:latest",
    messages: [
      {
        role: "user",
        content: `Give ONE short productivity tip from this: ${JSON.stringify(tasks)}`,
      },
    ],
  });

  let text = response.choices[0].message.content;
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  return text;
}

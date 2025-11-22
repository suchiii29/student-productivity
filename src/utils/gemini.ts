// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function askGemini(question: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",  // ← Use gemini-pro instead
    });
    const result = await model.generateContent(question);
    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error using Gemini API.";
  }
}
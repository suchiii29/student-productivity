// src/components/AIChatbot.tsx - Fixed: await getTasks() and async buildContext
import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTasks } from "@/lib/taskStore";

type Role = "user" | "assistant";
interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Explain quantum physics simply",
  "Help me solve this math problem",
  "What should I study today?",
  "Explain photosynthesis",
];

export default function AIChatbot(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI study assistant. Ask me anything — homework, doubts, planning, concepts! 📚",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("openAIChat", handler);
    return () => window.removeEventListener("openAIChat", handler);
  }, []);

  // ---- FIXED: buildContext is async and awaits getTasks()
  const buildContext = async (): Promise<string> => {
    try {
      const tasks = await getTasks(); // <-- await here (getTasks is async)
      // ensure tasks is an array fallback
      const safeTasks = Array.isArray(tasks) ? tasks : [];

      const pending = safeTasks.filter((t) => t.status === "pending");
      const high = pending.filter((t) => t.priority === "High");

      if (pending.length === 0) return "The student has no pending tasks right now.";

      const list = pending
        .slice(0, 3)
        .map((t) => `- ${t.title} (${t.priority} priority)`)
        .join("\n");

      return `The student has ${pending.length} pending tasks (including ${high.length} high-priority):\n${list}`;
    } catch (err) {
      // If anything goes wrong, return an empty context but don't crash
      console.warn("buildContext error:", err);
      return "";
    }
  };

  const appendAssistantMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + Math.random()).toString(), role: "assistant", content: text, timestamp: new Date() },
    ]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      if (!apiKey || apiKey.trim() === "") {
        appendAssistantMessage(
          "⚠️ Groq API key missing. Get your FREE key at: https://console.groq.com/keys (No payment needed!)"
        );
        setIsLoading(false);
        return;
      }

      // ---- FIXED: await the async context builder
      const context = await buildContext();

      const systemPrompt = `You are a friendly, patient AI tutor. Help the student with:
- Clear explanations
- Step-by-step solutions for math/science problems
- Study and planning advice
- Asking clarifying questions if needed

Context:
${context}

Guidelines:
- Be concise and helpful
- Show steps where appropriate
- Use simple language and examples
- Use emojis sparingly to stay friendly`;

      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content
        }));

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Fast and FREE model
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
            { role: "user", content: content }
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? "Sorry — I couldn't generate a reply.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      console.error("Groq API Error:", err);

      let errorText = "An error occurred. Please try again.";

      const msg = String(err?.message || "").toLowerCase();
      if (msg.includes("401") || msg.includes("authentication") || msg.includes("invalid")) {
        errorText = "❌ Invalid API key. Get a FREE key at: https://console.groq.com/keys";
      } else if (msg.includes("429") || msg.includes("rate limit")) {
        errorText = "⏱️ Rate limit reached. Wait a moment and try again (still FREE!).";
      } else if (msg.includes("fetch") || msg.includes("network")) {
        errorText = "🌐 Network error. Check your internet connection.";
      } else {
        errorText = `Error: ${err?.message ?? String(err)}`;
      }

      appendAssistantMessage(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-14 h-14 shadow-2xl flex items-center justify-center z-50 transition-transform transform hover:scale-105"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed right-6 bottom-6 w-96 h-[32rem] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Study Assistant</h3>
                <p className="text-xs text-white/70">100% Free! ⚡</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"}`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "bg-indigo-600 text-white rounded-br-md" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && !isLoading && (
            <div className="px-4 pb-2 border-t pt-2">
              <p className="text-xs text-gray-500 mb-2">💡 Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... homework, doubts, planning..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button 
                onClick={() => sendMessage(input)} 
                disabled={!input.trim() || isLoading} 
                className="rounded-xl px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">Powered by Groq (Llama 3.3) - 100% FREE</p>
          </div>
        </div>
      )}
    </>
  );
}

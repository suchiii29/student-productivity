// src/pages/Recommendations.tsx - AI-POWERED VERSION
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Clock,
  TrendingUp,
  Brain,
  Sparkles,
  RefreshCw,
  Zap,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import {
  analyzeProductivityWithAI,
  prioritizeTasksWithAI,
  AIAnalysisResult,
} 
from "../lib/aiRecommendationEngine";

const Recommendations = () => {
  const { uid } = useAuth();
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [prioritizedTasks, setPrioritizedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Load tasks and logs from Firebase
  useEffect(() => {
    if (!uid) return;

    const tasksRef = ref(db, `tasks/${uid}`);
    const logsRef = ref(db, `routineLogs/${uid}`);

    const unsubTasks = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.entries(data).map(([id, task]: any) => ({ id, ...task }));
        setTasks(arr);
      }
    });

    const unsubLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.values(data);
        setLogs(arr as any[]);
      }
    });

    return () => {
      unsubTasks();
      unsubLogs();
    };
  }, [uid]);

  // Run AI analysis when data loads
  useEffect(() => {
    if (tasks.length > 0 || logs.length > 0) {
      runAIAnalysis();
    }
  }, [tasks, logs]);

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Run AI analysis
      const analysis = await analyzeProductivityWithAI(tasks, logs);
      setAiAnalysis(analysis);

      // Prioritize pending tasks
      const ranked = await prioritizeTasksWithAI(tasks);
      setPrioritizedTasks(ranked.slice(0, 10)); // Top 10
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case "peak":
        return "border-l-green-500 bg-green-50 dark:bg-green-950";
      case "avoid":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-950";
      case "study":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-950";
      case "sleep":
        return "border-l-purple-500 bg-purple-50 dark:bg-purple-950";
      case "category":
        return "border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950";
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-950";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-indigo-600 animate-pulse" />
          <p className="text-lg text-muted-foreground">
            AI is analyzing your productivity patterns...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-6 rounded-2xl border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              AI-Powered Recommendations
            </h2>
            <p className="text-muted-foreground mt-2">
              Machine learning insights based on your productivity patterns
            </p>
          </div>
          <Button
            onClick={runAIAnalysis}
            disabled={analyzing}
            className="gap-2"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
            {analyzing ? "Analyzing..." : "Refresh AI"}
          </Button>
        </div>
      </div>

      {/* AI Productivity Score */}
      {aiAnalysis && (
        <Card className="border-2 border-indigo-200 dark:border-indigo-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              AI Productivity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div
                  className={`text-6xl font-extrabold ${getScoreColor(
                    aiAnalysis.productivityScore
                  )}`}
                >
                  {aiAnalysis.productivityScore}
                </div>
                <p className="text-sm text-muted-foreground mt-2">out of 100</p>
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium mb-2">AI Summary:</p>
                <p className="text-muted-foreground">{aiAnalysis.summary}</p>
              </div>
            </div>

            {/* Best & Worst Hours */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    Peak Hours
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.bestHours.map((hour, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-green-200 dark:bg-green-900">
                      {hour}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold text-orange-900 dark:text-orange-100">
                    Low Focus Hours
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.worstHours.map((hour, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-orange-200 dark:bg-orange-900">
                      {hour}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h3 className="text-xl font-semibold">AI-Generated Insights</h3>
          <Badge variant="outline" className="ml-2">
            Machine Learning
          </Badge>
        </div>

        {aiAnalysis && aiAnalysis.recommendations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {aiAnalysis.recommendations.map((rec, index) => (
              <Card
                key={index}
                className={`border-l-4 ${getRecommendationColor(rec.type)} transition-all hover:shadow-lg`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{rec.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg">{rec.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {rec.confidence}% AI
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      {rec.timeSlot && (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                          <Clock className="w-3 h-3" />
                          <span>{rec.timeSlot}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center border-dashed">
            <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-muted-foreground">
              Complete more tasks to unlock AI-powered recommendations!
            </p>
            <p className="text-sm text-gray-400 mt-1">
              The AI needs at least 5-10 completed tasks to analyze patterns.
            </p>
          </Card>
        )}
      </section>

      {/* AI Behavioral Insights */}
      {aiAnalysis && aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              Behavioral Patterns Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiAnalysis.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                  <span className="text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* AI Task Prioritizer */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-indigo-600" />
          <h3 className="text-xl font-semibold">AI Task Prioritization</h3>
          <Badge variant="outline" className="ml-2">
            Smart Ranking
          </Badge>
        </div>
        <p className="text-muted-foreground mb-4">
          AI-ranked tasks based on urgency, importance, and optimal timing.
        </p>

        {prioritizedTasks.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground text-lg">
              🎉 All tasks completed! Add new tasks to see AI prioritization.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {prioritizedTasks.map((task, index) => (
              <Card
                key={task.id}
                className="hover:border-indigo-500 transition-all hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{task.title}</h4>
                        <Badge variant="secondary" className="ml-2">
                          AI: {Math.round(task.aiScore)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-2">
                        {task.category && (
                          <div>
                            <strong>Category:</strong> {task.category}
                          </div>
                        )}
                        {task.priority && (
                          <div>
                            <strong>Priority:</strong> {task.priority}
                          </div>
                        )}
                        {task.duration && (
                          <div>
                            <strong>Duration:</strong> {task.duration}min
                          </div>
                        )}
                        {task.deadline && (
                          <div>
                            <strong>Deadline:</strong>{" "}
                            {new Date(task.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {task.reasoning && (
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded text-xs italic">
                          💡 <strong>AI Reasoning:</strong> {task.reasoning}
                        </div>
                      )}

                      {task.suggestedTime && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            <strong>Best Time:</strong> {task.suggestedTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* AI Model Info */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              ✨ Powered by <strong>Groq AI (Llama 3.3 70B)</strong> - A
              state-of-the-art machine learning model
            </p>
            <p className="text-xs text-muted-foreground">
              Recommendations improve as you complete more tasks. The AI learns your
              patterns over time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recommendations;
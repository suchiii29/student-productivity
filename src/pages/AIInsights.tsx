// src/pages/AIInsights.tsx - FIXED VERSION

import { useEffect, useState } from "react";
import { getTasks } from "@/lib/taskStore";
import { analyzeWithGemini, AIAnalysisResult, getQuickRecommendation } from "@/lib/geminiAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Zap,
  RefreshCw,
  Sun,
  Moon,
  Coffee,
  BookOpen,
  AlertCircle
} from "lucide-react";

const AIInsights = () => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [quickTip, setQuickTip] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      // FIXED: getTasks() is now async, so we need to await it
      const tasks = await getTasks();
      
      const [result, tip] = await Promise.all([
        analyzeWithGemini(tasks),
        getQuickRecommendation(tasks),
      ]);
      
      setAnalysis(result);
      setQuickTip(tip);
    } catch (err: any) {
      setError(err.message || "Failed to analyze. Please check your API key.");
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "peak": return <Sun className="h-5 w-5 text-amber-500" />;
      case "avoid": return <Moon className="h-5 w-5 text-slate-500" />;
      case "study": return <BookOpen className="h-5 w-5 text-blue-500" />;
      case "break": return <Coffee className="h-5 w-5 text-orange-500" />;
      case "sleep": return <Moon className="h-5 w-5 text-indigo-500" />;
      default: return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "peak": return "border-l-amber-500 bg-amber-50 dark:bg-amber-950";
      case "avoid": return "border-l-slate-400 bg-slate-50 dark:bg-slate-950";
      case "study": return "border-l-blue-500 bg-blue-50 dark:bg-blue-950";
      case "break": return "border-l-orange-500 bg-orange-50 dark:bg-orange-950";
      case "sleep": return "border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950";
      default: return "border-l-purple-500 bg-purple-50 dark:bg-purple-950";
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 p-6 rounded-2xl border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-600" />
              AI Time Recommendations
            </h2>
            <p className="text-muted-foreground mt-1">
              Powered by AI • Analyzes your productivity patterns
            </p>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Tip Banner */}
      {quickTip && !loading && (
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-6 w-6 shrink-0" />
            <p className="font-medium">{quickTip}</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-4 flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="h-12 w-12 text-purple-500 mx-auto animate-pulse" />
            <p className="mt-4 text-muted-foreground">AI is analyzing your patterns...</p>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && !analysis && (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete some tasks to get AI-powered insights!
            </p>
            <Button onClick={() => window.location.href = "/tasks"}>
              Go to Tasks
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && analysis && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Productivity Score */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Productivity Score</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {analysis.productivityScore}%
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Hours */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Peak Hours</p>
                    <p className="text-lg font-semibold text-green-600">
                      {analysis.bestHours.slice(0, 3).join(", ")}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                    <Sun className="h-7 w-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Worst Hours */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Focus Hours</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {analysis.worstHours.slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                    <TrendingDown className="h-7 w-7 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-center text-muted-foreground">
                <Sparkles className="h-4 w-4 inline mr-2" />
                {analysis.summary}
              </p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Personalized Recommendations
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {analysis.recommendations.map((rec, index) => (
                <Card
                  key={index}
                  className={`border-l-4 ${getTypeColor(rec.type)} transition-all hover:shadow-md`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(rec.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">{rec.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {rec.confidence}% match
                          </Badge>
                        </div>
                        {rec.timeSlot && (
                          <Badge variant="outline" className="mb-2 text-xs">
                            🕐 {rec.timeSlot}
                          </Badge>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How it works */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <p className="text-sm text-center text-muted-foreground">
                🤖 This AI analyzes your task completion times, categories, and priorities to find your optimal productivity windows. 
                Complete more tasks to improve accuracy!
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AIInsights;
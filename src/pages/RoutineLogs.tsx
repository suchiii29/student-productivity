// src/pages/RoutineLogs.tsx - FIXED VERSION
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoutineLogModal from "@/components/routine/RoutineLogModal";
import { format } from "date-fns";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";

interface RoutineEntry {
  id?: string;
  date: string;
  sleepHours: number;
  studyHours: number;
  exerciseMinutes: number;
  breaks: number;
  score?: number;
  productivityScore?: number;
  verdict?: string;
  recommendation?: string;
  timestamp?: number;
}

const RoutineLogs = () => {
  const { uid } = useAuth();
  const [logs, setLogs] = useState<RoutineEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch logs live from Firebase for current user
  useEffect(() => {
    if (!uid) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const logsRef = ref(db, `routineLogs/${uid}`);
    
    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setLogs([]);
        setLoading(false);
        return;
      }

      const data = snapshot.val();
      let arr: RoutineEntry[] = [];

      if (Array.isArray(data)) {
        arr = data.filter(Boolean).map((log, idx) => ({
          id: idx.toString(),
          ...log,
        }));
      } else {
        arr = Object.entries(data).map(([id, log]: any) => ({
          id,
          ...log,
        }));
      }

      // Sort by date descending (newest first)
      arr.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      setLogs(arr);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
    if (score >= 70) return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
    if (score >= 50) return "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800";
    return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl text-white">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Routine Logs</h2>
            <p className="text-muted-foreground mt-1">
              Track daily habits & productivity
            </p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Log
        </Button>
      </div>

      {/* Stats Summary */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  logs.reduce((acc, log) => acc + (log.score || log.productivityScore || 0), 0) /
                    logs.length
                )}
                /100
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Sleep
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(logs.reduce((acc, log) => acc + log.sleepHours, 0) / logs.length).toFixed(1)}h
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Study
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(logs.reduce((acc, log) => acc + log.studyHours, 0) / logs.length).toFixed(1)}h
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-muted-foreground mt-4">Loading logs...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-4">
          {logs.map((log) => {
            const score = log.score || log.productivityScore || 0;
            return (
              <Card key={log.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(new Date(log.date), "EEEE, MMMM dd, yyyy")}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-5 h-5 ${getScoreColor(score)}`} />
                      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Sleep Hours</p>
                      <p className="text-lg font-semibold">{log.sleepHours} h</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Study Hours</p>
                      <p className="text-lg font-semibold">{log.studyHours} h</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Exercise</p>
                      <p className="text-lg font-semibold">{log.exerciseMinutes} min</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Breaks</p>
                      <p className="text-lg font-semibold">{log.breaks}</p>
                    </div>
                  </div>

                  {/* Score Card */}
                  <div className={`p-4 border rounded-lg ${getScoreBgColor(score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">
                        Productivity Score:{" "}
                        <span className={`text-xl ${getScoreColor(score)}`}>
                          {score}/100
                        </span>
                      </p>
                    </div>
                    {log.verdict && (
                      <p className="text-sm mb-2">
                        Verdict: <span className="font-medium">{log.verdict}</span>
                      </p>
                    )}
                    {log.recommendation && (
                      <p className="text-xs italic text-muted-foreground">
                        💡 {log.recommendation}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No routine logs yet</h3>
            <p className="text-muted-foreground mb-6">
              Start tracking your daily habits to see productivity insights
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Log
            </Button>
          </div>
        </Card>
      )}

      {/* Modal */}
      <RoutineLogModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
};

export default RoutineLogs;
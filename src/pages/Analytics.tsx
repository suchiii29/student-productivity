// src/pages/Analytics.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Brain, RefreshCw } from "lucide-react";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";

interface RoutineLog {
  date: string;
  sleepHours: number;
  studyHours: number;
  score: number;
}

interface Task {
  id: string;
  title: string;
  status?: string;
  completedHour?: number;
  duration?: number;
}

const Analytics = () => {
  const { uid } = useAuth();
  const [routineLogs, setRoutineLogs] = useState<RoutineLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [hourlyFocus, setHourlyFocus] = useState<any[]>([]);
  const [taskCompletion, setTaskCompletion] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;

    const logsRef = ref(db, `routineLogs/${uid}`);
    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRoutineLogs([]);
        return;
      }
      const val = snapshot.val();
      let arr: RoutineLog[] = [];
      if (Array.isArray(val)) {
        arr = val.filter(Boolean);
      } else {
        arr = Object.values(val) as RoutineLog[];
      }
      setRoutineLogs(arr.reverse());
    });

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const tasksRef = ref(db, `tasks/${uid}`);
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      if (!snapshot.exists()) {
        setTasks([]);
        setLoading(false);
        return;
      }
      const val = snapshot.val();
      let arr: Task[] = [];
      if (Array.isArray(val)) {
        arr = val.filter(Boolean);
      } else {
        arr = Object.entries(val).map(([id, task]: any) => ({ id, ...task }));
      }
      setTasks(arr);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (routineLogs.length > 0) generateWeeklyData();
    if (tasks.length > 0) {
      generateHourlyData();
      generateTaskData();
    }
  }, [routineLogs, tasks]);

  const generateWeeklyData = () => {
    const data = routineLogs.slice(0, 7).reverse().map(log => ({
      day: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
      productivity: log.score,
      sleep: log.sleepHours,
    }));
    setWeeklyData(data);
  };

  const generateHourlyData = () => {
    const hourlyMap: any = {};
    tasks.filter(t => t.completedHour !== undefined).forEach(task => {
      const hour = task.completedHour!;
      if (!hourlyMap[hour]) hourlyMap[hour] = { count: 0, duration: 0 };
      hourlyMap[hour].count++;
      hourlyMap[hour].duration += task.duration || 0;
    });

    const result = [];
    for (let h = 0; h < 24; h++) {
      const data = hourlyMap[h] || { count: 0, duration: 0 };
      result.push({
        hour: h,
        label: h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`,
        focus: data.count * 10 + data.duration / 10,
        tasksCompleted: data.count,
      });
    }
    setHourlyFocus(result);
  };

  const generateTaskData = () => {
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status !== "completed").length;
    const total = tasks.length || 1;
    setTaskCompletion([
      { name: "Completed", value: Math.round((completed / total) * 100), color: "#10b981" },
      { name: "Pending", value: Math.round((pending / total) * 100), color: "#f59e0b" },
    ]);
  };

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      generateWeeklyData();
      generateHourlyData();
      generateTaskData();
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Analytics
          </h2>
          <p className="text-muted-foreground mt-1">Track your productivity</p>
        </div>
        <Button onClick={refresh} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-12 w-12 text-purple-500 mx-auto animate-pulse mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      )}

      {!loading && routineLogs.length === 0 && tasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-4">Add tasks and routine logs!</p>
          </CardContent>
        </Card>
      )}

      {!loading && (routineLogs.length > 0 || tasks.length > 0) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold text-primary mt-1">{tasks.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {tasks.filter(t => t.status === "completed").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Routine Logs</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{routineLogs.length}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">📊 Overview</TabsTrigger>
              <TabsTrigger value="focus">🎯 Focus Patterns</TabsTrigger>
              <TabsTrigger value="tasks">✅ Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Productivity vs Sleep</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weeklyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="productivity" stroke="#8b5cf6" strokeWidth={2} />
                          <Line type="monotone" dataKey="sleep" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Add routine logs
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Task Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    {taskCompletion.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={taskCompletion}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {taskCompletion.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Complete tasks
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="focus" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Focus Score</CardTitle>
                </CardHeader>
                <CardContent>
                  {hourlyFocus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={hourlyFocus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="focus" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      Complete tasks to see patterns
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Task Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {taskCompletion.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={taskCompletion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      Complete tasks
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Analytics;
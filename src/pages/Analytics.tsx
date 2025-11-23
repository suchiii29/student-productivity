// src/pages/Analytics.tsx - COMPLETE FIXED VERSION
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  ScatterChart,
  Scatter,
  Legend
} from "recharts";
import { Brain, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";

interface RoutineLog {
  date: string;
  sleepHours: number;
  studyHours: number;
  score: number;
  productivityScore?: number;
}

interface Task {
  id: string;
  title: string;
  status?: string;
  completedHour?: number;
  duration?: number;
  completedAt?: string;
}

const Analytics = () => {
  const { uid } = useAuth();
  const [routineLogs, setRoutineLogs] = useState<RoutineLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chart data states
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [hourlyFocus, setHourlyFocus] = useState<any[]>([]);
  const [taskCompletion, setTaskCompletion] = useState<any[]>([]);
  const [sleepCorrelation, setSleepCorrelation] = useState<any[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<any[]>([]);
  const [focusStats, setFocusStats] = useState<{ best: any; worst: any }>({ best: null, worst: null });

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
      setRoutineLogs(arr);
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
    if (routineLogs.length > 0) {
      generateWeeklyData();
      generateSleepCorrelation();
      generateMonthlyProgress();
    }
    if (tasks.length > 0) {
      generateHourlyData();
      generateTaskData();
    }
  }, [routineLogs, tasks]);

  // 1. Weekly Productivity Chart - FIXED
  const generateWeeklyData = () => {
    const today = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().slice(0, 10);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const log = routineLogs.find(l => l.date === dateKey);
      
      data.push({
        day: dayName,
        productivity: log ? (log.score || log.productivityScore || 0) : 0,
        sleep: log ? (log.sleepHours || 0) : 0,
        study: log ? (log.studyHours || 0) : 0,
      });
    }
    
    setWeeklyData(data);
  };

  // 2. High & Low Focus Hours
  const extractHourFromTimestamp = (timestamp: string): number | undefined => {
    const match = timestamp.match(/T(\d{2}):/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return undefined;
  };

  const generateHourlyData = () => {
    const hourlyMap: Record<number, { count: number; duration: number; tasks: string[] }> = {};
    
    const completedTasks = tasks.filter(t => t.status === "completed");
    
    completedTasks.forEach(task => {
      let hour: number | undefined;
      
      if (task.completedAt) {
        hour = extractHourFromTimestamp(task.completedAt);
      }
      
      if (hour === undefined && task.completedHour && task.completedHour !== 0) {
        hour = task.completedHour;
      }
      
      if (hour !== undefined && hour >= 0 && hour < 24) {
        if (!hourlyMap[hour]) {
          hourlyMap[hour] = { count: 0, duration: 0, tasks: [] };
        }
        hourlyMap[hour].count++;
        hourlyMap[hour].duration += task.duration || 30;
        hourlyMap[hour].tasks.push(task.title || "Untitled");
      }
    });

    const result = [];
    const hoursWithData = Object.keys(hourlyMap).map(Number).sort((a, b) => a - b);
    
    for (const h of hoursWithData) {
      const data = hourlyMap[h];
      if (data && data.count > 0) {
        const focusScore = (data.count * 10) + (data.duration * 0.5);
        
        let label: string;
        if (h === 0) label = '12 AM';
        else if (h < 12) label = `${h} AM`;
        else if (h === 12) label = '12 PM';
        else label = `${h - 12} PM`;
        
        result.push({
          hour: h,
          label,
          focus: Math.round(focusScore),
          tasksCompleted: data.count,
          totalMinutes: data.duration,
          taskList: data.tasks,
        });
      }
    }
    
    setHourlyFocus(result);

    if (result.length > 0) {
      const sorted = [...result].sort((a, b) => b.focus - a.focus);
      setFocusStats({
        best: sorted[0],
        worst: sorted[sorted.length - 1],
      });
    }
  };

  // 3. Task Completion Rate
  const generateTaskData = () => {
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status !== "completed").length;
    const total = tasks.length || 1;
    setTaskCompletion([
      { name: "Completed", value: Math.round((completed / total) * 100), count: completed, color: "#10b981" },
      { name: "Pending", value: Math.round((pending / total) * 100), count: pending, color: "#f59e0b" },
    ]);
  };

  // 4. Sleep vs Performance Correlation - FIXED
  const generateSleepCorrelation = () => {
    const data = routineLogs
      .map(log => ({
        sleep: parseFloat((log.sleepHours || 0).toFixed(1)),
        performance: log.score || log.productivityScore || 0,
        date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
      .filter(d => d.sleep > 0 && d.performance > 0);
    
    setSleepCorrelation(data);
  };

  // 5. Monthly Progress Chart - COMPLETELY FIXED
  const generateMonthlyProgress = () => {
    if (routineLogs.length === 0) {
      setMonthlyProgress([]);
      return;
    }

    // Group logs by month
    const monthlyData: Record<string, {
      logs: RoutineLog[];
      monthLabel: string;
      sortKey: string;
    }> = {};

    routineLogs.forEach(log => {
      const logDate = new Date(log.date);
      const year = logDate.getFullYear();
      const month = logDate.getMonth(); // 0-11
      const sortKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthLabel = logDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      if (!monthlyData[sortKey]) {
        monthlyData[sortKey] = {
          logs: [],
          monthLabel,
          sortKey,
        };
      }
      monthlyData[sortKey].logs.push(log);
    });

    // Calculate averages for each month
    const chartData = Object.values(monthlyData)
      .map(({ logs, monthLabel, sortKey }) => {
        const totalLogs = logs.length;
        const totalProductivity = logs.reduce((sum, log) => sum + (log.score || log.productivityScore || 0), 0);
        const totalSleep = logs.reduce((sum, log) => sum + (log.sleepHours || 0), 0);
        const totalStudy = logs.reduce((sum, log) => sum + (log.studyHours || 0), 0);

        return {
          month: monthLabel,
          sortKey,
          avgProductivity: Math.round(totalProductivity / totalLogs),
          avgSleep: parseFloat((totalSleep / totalLogs).toFixed(1)),
          avgStudy: parseFloat((totalStudy / totalLogs).toFixed(1)),
          daysLogged: totalLogs,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6); // Get last 6 months

    setMonthlyProgress(chartData);
  };

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      if (routineLogs.length > 0) {
        generateWeeklyData();
        generateSleepCorrelation();
        generateMonthlyProgress();
      }
      if (tasks.length > 0) {
        generateHourlyData();
        generateTaskData();
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">Track your productivity patterns</p>
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
            <p className="text-muted-foreground">Loading analytics...</p>
          </CardContent>
        </Card>
      )}

      {!loading && routineLogs.length === 0 && tasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding tasks and routine logs to see your analytics!</p>
          </CardContent>
        </Card>
      )}

      {!loading && (routineLogs.length > 0 || tasks.length > 0) && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Avg Productivity</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {routineLogs.length > 0 
                    ? Math.round(routineLogs.reduce((a, b) => a + (b.score || b.productivityScore || 0), 0) / routineLogs.length)
                    : 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart 1: Weekly Productivity */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Weekly Productivity Trend</CardTitle>
              <p className="text-sm text-muted-foreground">Your productivity, sleep, and study hours over the last 7 days</p>
            </CardHeader>
            <CardContent>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={weeklyData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="productivity" stroke="#8b5cf6" strokeWidth={3} name="Productivity %" />
                    <Line type="monotone" dataKey="sleep" stroke="#10b981" strokeWidth={2} name="Sleep (hrs)" />
                    <Line type="monotone" dataKey="study" stroke="#f59e0b" strokeWidth={2} name="Study (hrs)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  Add routine logs to see weekly trends
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 2 & 3: High/Low Focus Hours + Task Completion */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* High & Low Focus Hours */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 High & Low Focus Hours</CardTitle>
                <p className="text-sm text-muted-foreground">When you're most and least productive</p>
              </CardHeader>
              <CardContent>
                {focusStats.best && focusStats.worst ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700 dark:text-green-400">Best Focus Hour</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600">{focusStats.best.label}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {focusStats.best.tasksCompleted} tasks completed
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {focusStats.best.totalMinutes} minutes worked
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Tasks completed:</p>
                        {focusStats.best.taskList.slice(0, 3).map((task: string, i: number) => (
                          <p key={i} className="truncate">• {task}</p>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-amber-700 dark:text-amber-400">Lowest Focus Hour</span>
                      </div>
                      <p className="text-3xl font-bold text-amber-600">{focusStats.worst.label}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {focusStats.worst.tasksCompleted} tasks completed
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {focusStats.worst.totalMinutes} minutes worked
                      </p>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      💡 Try scheduling important tasks during your best focus hours
                    </p>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Complete tasks to see your focus patterns
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Completion */}
            <Card>
              <CardHeader>
                <CardTitle>✅ Completed vs Pending Tasks</CardTitle>
                <p className="text-sm text-muted-foreground">Your task completion rate</p>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {taskCompletion.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={taskCompletion}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, count }) => `${name}: ${count}`}
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
                    Add tasks to see completion rate
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart 4: Sleep vs Performance Correlation - FIXED */}
          <Card>
            <CardHeader>
              <CardTitle>😴 Sleep vs Performance Correlation</CardTitle>
              <p className="text-sm text-muted-foreground">How your sleep affects productivity</p>
            </CardHeader>
            <CardContent>
              {sleepCorrelation.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="sleep" 
                      name="Sleep Hours"
                      type="number"
                      domain={[0, 12]}
                      ticks={[0, 2, 4, 6, 8, 10, 12]}
                      label={{ value: 'Sleep Hours', position: 'insideBottom', offset: -20 }}
                    />
                    <YAxis 
                      dataKey="performance" 
                      name="Performance %"
                      type="number"
                      domain={[0, 100]}
                      label={{ value: 'Performance %', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">{payload[0].payload.date}</p>
                              <p className="text-sm text-purple-600">Sleep: {payload[0].payload.sleep}h</p>
                              <p className="text-sm text-indigo-600">Performance: {payload[0].payload.performance}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Days" data={sleepCorrelation} fill="#8b5cf6" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  Add routine logs to see sleep correlation
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 5: Monthly Progress - COMPLETELY FIXED */}
          <Card>
            <CardHeader>
              <CardTitle>📈 Monthly Progress Chart</CardTitle>
              <p className="text-sm text-muted-foreground">
                {monthlyProgress.length > 1 
                  ? "Compare your performance across different months"
                  : "Add more logs from different months to see comparison"}
              </p>
            </CardHeader>
            <CardContent>
              {monthlyProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyProgress} margin={{ top: 20, right: 30, bottom: 50, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold mb-2">{data.month}</p>
                              <p className="text-sm text-purple-600">Avg Productivity: {data.avgProductivity}%</p>
                              <p className="text-sm text-green-600">Avg Sleep: {data.avgSleep}h</p>
                              <p className="text-sm text-amber-600">Avg Study: {data.avgStudy}h</p>
                              <p className="text-xs text-muted-foreground mt-1">{data.daysLogged} days logged</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="avgProductivity" fill="#8b5cf6" name="Productivity %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgSleep" fill="#10b981" name="Sleep (hrs)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgStudy" fill="#f59e0b" name="Study (hrs)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex flex-col items-center justify-center text-center">
                  <Brain className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-muted-foreground">
                    Add more routine logs from different months to see monthly trends
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Analytics;
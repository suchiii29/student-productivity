// src/pages/Dashboard.tsx - COMPLETE WITH FIXED ADD TASK
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Bolt,
  MessageCircle,
  DownloadCloud,
  Star,
  Zap,
  Bell,
  X,
} from "lucide-react";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import AddLogModal from "@/components/AddLogModal";
import { addTaskStore, initTaskStore } from "@/lib/taskStore";

interface RoutineLog {
  date: string;
  productivityScore?: number;
  score?: number;
  sleepHours?: number;
  studyHours?: number;
  exerciseMinutes?: number;
  userId?: string;
}

interface Goal {
  id: string;
  title: string;
  deadline?: string;
  progress?: number;
  status?: string;
  estimatedTime?: number;
}

const ASSET_URL = "/student.png";

const Dashboard: React.FC = () => {
  const { uid, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; score: number }[]>([]);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addLogOpen, setAddLogOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // Initialize task store when user logs in
  useEffect(() => {
    if (uid) {
      initTaskStore(uid);
    }
  }, [uid]);

  // Load routine logs for current user only
  useEffect(() => {
    if (!uid) return;

    const logsRef = ref(db, `routineLogs/${uid}`);

    const unsubscribe = onValue(logsRef, (snapshot) => {
      const val = snapshot.val();
      let arr: RoutineLog[] = [];

      if (val) {
        if (Array.isArray(val)) {
          arr = val;
        } else {
          arr = Object.values(val) as RoutineLog[];
        }
      }

      setLogs(arr);

      // Generate last 7 days data with day names
      const finalGraph: { date: string; score: number }[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const dayName = dayNames[d.getDay()];

        const match = arr.find((x) => x.date === key);
        const scoreValue = match
          ? Number(match.productivityScore ?? match.score ?? 0)
          : 0;

        finalGraph.push({
          date: dayName,
          score: scoreValue,
        });
      }
      setTrendData(finalGraph);
    });

    return () => unsubscribe();
  }, [uid]);

  // Load goals from Firebase
  useEffect(() => {
    if (!uid) return;

    const goalsRef = ref(db, `goals/${uid}`);
    const unsubscribe = onValue(goalsRef, (snapshot) => {
      const val = snapshot.val();
      let arr: Goal[] = [];

      if (val) {
        if (Array.isArray(val)) {
          arr = val.filter(Boolean);
        } else {
          arr = Object.entries(val).map(([id, data]: any) => ({
            id,
            ...data,
          }));
        }
      }

      setGoals(arr);
    });

    return () => unsubscribe();
  }, [uid]);

  // Generate smart notifications - runs when logs or goals change
  useEffect(() => {
    const newNotifications: string[] = [];
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayLog = logs.find((l) => l.date === todayKey);

    // Check if today's log is missing
    if (!todayLog) {
      newNotifications.push("📝 Don't forget to log your routine for today!");
    }

    // Check average sleep
    if (logs.length >= 3) {
      const recentLogs = logs.slice(-3);
      const avgSleep = recentLogs.reduce((a, b) => a + Number(b.sleepHours || 0), 0) / 3;
      if (avgSleep < 6) {
        newNotifications.push("😴 Your sleep is below 6 hours. Try sleeping earlier tonight!");
      }
    }

    // Check goals near deadline
    const goalsNearDeadline = goals.filter((g) => {
      if (!g.deadline || g.status === "completed") return false;
      const daysLeft = Math.ceil(
        (new Date(g.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 3 && daysLeft > 0;
    });

    if (goalsNearDeadline.length > 0) {
      newNotifications.push(
        `⏰ ${goalsNearDeadline.length} goal(s) are due in 3 days or less!`
      );
    }

    // Check for low productivity streak
    if (logs.length >= 5) {
      const recentLogs = logs.slice(-5);
      const avgScore = recentLogs.reduce((a, b) => a + Number(b.score || b.productivityScore || 0), 0) / 5;
      if (avgScore < 50) {
        newNotifications.push("📊 Your productivity has been low recently. Time to bounce back!");
      }
    }

    setNotifications(newNotifications);
  }, [logs, goals]);

  // Listen for custom events
  useEffect(() => {
    const handleOpenTask = () => setAddTaskOpen(true);
    const handleOpenLog = () => setAddLogOpen(true);

    window.addEventListener("openAddTaskModal", handleOpenTask);
    window.addEventListener("openAddLogModal", handleOpenLog);

    return () => {
      window.removeEventListener("openAddTaskModal", handleOpenTask);
      window.removeEventListener("openAddLogModal", handleOpenLog);
    };
  }, []);

  // Calculate today's stats
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = logs.find((l) => l.date === todayKey) || null;
  const todayScore = today
    ? Number(today.productivityScore ?? today.score ?? 0)
    : 0;

  const avgSleep =
    logs.length > 0
      ? (logs.reduce((a, b) => a + Number(b.sleepHours || 0), 0) / logs.length).toFixed(1)
      : "0";

  const avgStudy =
    logs.length > 0
      ? (logs.reduce((a, b) => a + Number(b.studyHours || 0), 0) / logs.length).toFixed(1)
      : "0";

  const avgExercise =
    logs.length > 0
      ? (logs.reduce((a, b) => a + Number(b.exerciseMinutes || 0), 0) / logs.length).toFixed(0)
      : "0";

  // Generate dynamic insights
  const getSmartInsight = () => {
    if (logs.length < 3) {
      return "Keep logging your routine to unlock personalized AI insights!";
    }

    const recentLogs = logs.slice(-7);
    const avgScore = recentLogs.reduce((a, b) => a + Number(b.score || 0), 0) / recentLogs.length;

    if (avgScore >= 75) {
      return "🎉 Excellent work! You're maintaining a productivity score above 75%. Keep it up!";
    } else if (avgScore >= 60) {
      return "📈 You're doing well! Consider adding 30 more minutes of focused study to boost your score.";
    } else {
      return "💪 Focus on consistency. Try starting with small 25-minute Pomodoro sessions.";
    }
  };

  // Generate dynamic recommendations
  const getRecommendations = () => {
    const recommendations = [];

    if (Number(avgSleep) < 7) {
      recommendations.push({
        title: "Improve Sleep Quality",
        description: `Current avg: ${avgSleep}h. Target 7-8 hours for better focus.`,
        type: "warning",
      });
    }

    if (Number(avgStudy) < 4) {
      recommendations.push({
        title: "Increase Study Time",
        description: `Current avg: ${avgStudy}h. Try adding 2 Pomodoro sessions daily.`,
        type: "info",
      });
    } else {
      recommendations.push({
        title: "Great Study Habits!",
        description: `You're averaging ${avgStudy}h daily. Maintain this momentum!`,
        type: "success",
      });
    }

    if (Number(avgExercise) < 30) {
      recommendations.push({
        title: "Add More Movement",
        description: "Even 15-minute walks can boost productivity by 20%.",
        type: "info",
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  // Button handlers
  const handleAddTask = () => setAddTaskOpen(true);
  const handleAddLog = () => setAddLogOpen(true);
  const handleAskAI = () => window.dispatchEvent(new CustomEvent("openAIChat"));
  const handleGoToRecommendations = () => navigate("/recommendations");
  const handleGoToGoals = () => navigate("/goals");
  const handleGoToAnalytics = () => navigate("/analytics");
  const handleGoToScheduler = () => navigate("/scheduler");

  const handleExportChart = () => {
    const csvContent = [
      ["Date", "Productivity Score"],
      ...trendData.map((d) => [d.date, d.score.toString()]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productivity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const onAddTask = async (taskData: any) => {
    try {
      // Double-check user is logged in
      if (!uid) {
        alert("❌ Please log in to add tasks");
        return;
      }

      // Ensure task store is initialized
      initTaskStore(uid);

      // Map the modal data to match addTaskStore expected format
      const taskForStore = {
        title: taskData.title,
        description: taskData.description || "",
        duration: taskData.duration || 60,
        priority: taskData.priority || "Medium",
        deadline: taskData.deadline || "",
        category: taskData.category || "General",
        status: taskData.status || "pending",
      };
      
      await addTaskStore(taskForStore);
      setAddTaskOpen(false);
      alert("✅ Task added successfully!");
    } catch (error) {
      console.error("Error adding task:", error);
      alert("❌ Failed to add task: " + (error as Error).message);
    }
  };

  // Get today's goals (deadline is today or in progress)
  const todaysGoals = goals.filter((g) => {
    if (g.status === "completed") return false;
    if (!g.deadline) return g.status === "in-progress";
    const deadline = new Date(g.deadline);
    const today = new Date();
    return deadline >= today || g.status === "in-progress";
  }).slice(0, 3);

  return (
    <>
      <div className="space-y-8 animate-fadeIn pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="inline-flex w-fit rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 p-0.5 shadow-xl">
              <div className="bg-white dark:bg-gray-900 rounded-md px-3 py-2 flex items-center gap-3">
                <img
                  src={ASSET_URL}
                  alt="Student"
                  className="w-10 h-10 rounded-md object-contain shadow"
                />
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Your productivity overview
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-sm hover:shadow-md transition relative"
                title="View notifications"
              >
                <Bell className="w-5 h-5 text-indigo-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">Notifications</div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-muted rounded-md transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {notifications.map((notif, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg border border-indigo-100 dark:border-indigo-900 hover:shadow-sm transition"
                        >
                          {notif}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No notifications</p>
                      <p className="text-xs mt-1">You're all caught up! 🎉</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleAddTask}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-border px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <Plus className="w-4 h-4 text-indigo-600" /> Add Task
            </button>

            <button
              onClick={handleAddLog}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-border px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <Bolt className="w-4 h-4 text-amber-500" /> Add Log
            </button>

            <button
              onClick={handleAskAI}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:scale-[1.02] transition"
            >
              <MessageCircle className="w-4 h-4" /> Ask AI
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card
                className="transition-all hover:shadow-xl rounded-2xl border border-border cursor-pointer"
                onClick={handleGoToAnalytics}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold">Today's Score</CardTitle>
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="max-w-[140px]">
                      <div className="text-3xl xl:text-4xl font-extrabold break-words">
                        {todayScore}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on routine log
                      </p>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      +{Math.max(0, todayScore - 50)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-xl rounded-2xl border border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold">Avg Sleep</CardTitle>
                  <Clock className="h-5 w-5 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgSleep}h</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all logs</p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-xl rounded-2xl border border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold">Avg Study</CardTitle>
                  <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgStudy}h</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all logs</p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-xl rounded-2xl border border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold">Avg Exercise</CardTitle>
                  <AlertCircle className="h-5 w-5 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgExercise} min</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all logs</p>
                </CardContent>
              </Card>
            </div>

            {/* Productivity Chart - FIXED HEIGHT AND MARGINS */}
            <Card className="rounded-2xl shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Productivity Trend (Last 7 Days)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportChart}
                    className="text-sm px-3 py-1 rounded-md border hover:bg-muted flex items-center gap-1 transition"
                  >
                    <DownloadCloud className="w-4 h-4" /> Export
                  </button>
                  <button
                    onClick={handleAddLog}
                    className="text-sm px-3 py-1 rounded-md border hover:bg-muted flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-4 h-4" /> Add Log
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {trendData.length > 0 ? (
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={trendData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="4 4" opacity={0.35} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 14 }}
                          tickMargin={15}
                          height={70}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                          labelStyle={{ 
                            fontWeight: 'bold', 
                            marginBottom: '4px',
                            color: '#111827'
                          }}
                          itemStyle={{ color: '#6366f1' }}
                        />
                        <Bar
                          dataKey="score"
                          fill="#6366f1"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center text-center">
                    <Zap className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No data yet! Start logging your routine.
                    </p>
                    <button
                      onClick={handleAddLog}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Add Your First Log
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-2xl border border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Smart Insights</CardTitle>
                <Star className="w-5 h-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 p-3 rounded-lg">
                    <div className="font-medium">AI Insight</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getSmartInsight()}
                    </div>
                  </div>
                  {recommendations.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-border">
                      <div className="font-medium">{recommendations[0].title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {recommendations[0].description}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAskAI}
                      className="flex-1 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
                    >
                      Ask AI for a plan
                    </button>
                    <button
                      onClick={handleGoToRecommendations}
                      className="px-3 py-2 rounded-md border border-border text-sm hover:bg-muted transition"
                    >
                      View More
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="rounded-2xl border border-border cursor-pointer hover:shadow-lg transition"
              onClick={handleGoToGoals}
            >
              <CardHeader>
                <CardTitle className="text-base font-semibold">Daily Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {todaysGoals.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {todaysGoals.map((goal) => (
                      <div key={goal.id} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{goal.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {goal.estimatedTime ? `Est. ${goal.estimatedTime} min` : "No time estimate"}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-indigo-600 capitalize">
                          {goal.status || "To Do"}
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground">Progress</div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                        <div
                          style={{
                            width: `${Math.min(100, (todaysGoals.filter((g) => g.status === "completed").length / todaysGoals.length) * 100)}%`,
                          }}
                          className="h-2 bg-indigo-600 transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">
                      No goals set for today
                    </p>
                    <button
                      onClick={handleGoToGoals}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                    >
                      Add Your First Goal
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Streaks & Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Study Streak</div>
                      <div className="text-xs text-muted-foreground">
                        {logs.length} days logged
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                      🔥 {logs.length}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Sleep Consistency</div>
                      <div className="text-xs text-muted-foreground">Past 7 days</div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-sm font-medium">
                      ⭐ {Math.floor(Number(avgSleep))}
                    </div>
                  </div>

                  <button
                    className="w-full px-3 py-2 rounded-md bg-indigo-600 text-white text-sm mt-2 hover:bg-indigo-700 transition"
                    onClick={handleGoToAnalytics}
                  >
                    View Analytics
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card
              className="rounded-2xl border border-border cursor-pointer hover:shadow-lg transition"
              onClick={handleGoToRecommendations}
            >
              <CardHeader>
                <CardTitle className="text-base font-semibold">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {recommendations.slice(0, 2).map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          rec.type === "warning"
                            ? "bg-amber-500"
                            : rec.type === "success"
                            ? "bg-emerald-500"
                            : "bg-indigo-600"
                        }`}
                      />
                      <div>
                        <div className="font-medium">{rec.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {rec.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed left-6 bottom-8 z-40">
          <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-border rounded-full p-2 shadow-lg">
            <button
              onClick={handleAddTask}
              className="px-3 py-2 rounded-full bg-indigo-600 text-white flex items-center gap-2 text-sm hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
            <button
              onClick={handleAddLog}
              className="px-3 py-2 rounded-full border border-border text-sm hover:bg-muted transition"
            >
              Add Log
            </button>
            <button
              onClick={handleGoToScheduler}
              className="px-3 py-2 rounded-full border border-border text-sm hover:bg-muted transition"
            >
              Scheduler
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTaskModal open={addTaskOpen} onOpenChange={setAddTaskOpen} onAddTask={onAddTask} />
      <AddLogModal open={addLogOpen} onOpenChange={setAddLogOpen} />
    </>
  );
};

export default Dashboard;
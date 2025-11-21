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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";

const Dashboard = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; score: number }[]>([]);

  useEffect(() => {
    const logsRef = ref(db, "routineLogs");

    const unsubscribe = onValue(logsRef, (snapshot) => {
      const val = snapshot.val();
      const arr = val ? Object.values(val) : [];
      setLogs(arr);

      // Build trend (last 7 days)
      const finalGraph: { date: string; score: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD

        const match = arr.find((x: any) => x.date === key);
        finalGraph.push({
          date: key.slice(5), // display as MM-DD
          score: match ? Number((match as any).productivityScore ?? (match as any).score ?? 0) : 0,

        });
      }
      setTrendData(finalGraph);
    });

    return () => unsubscribe();
  }, []);
  const today =
    logs.find((l) => l.date === new Date().toISOString().slice(0, 10)) || null;

  const todayScore = today ? Number(today.productivityScore ?? today.score ?? 0) : 0;
  const avgSleep =
    logs.length > 0
      ? (logs.reduce((a, b) => a + Number(b.sleepHours || 0), 0) / logs.length).toFixed(1)
      : 0;
  const avgStudy =
    logs.length > 0
      ? (logs.reduce((a, b) => a + Number(b.studyHours || 0), 0) / logs.length).toFixed(1)
      : 0;
  const avgExercise =
    logs.length > 0
      ? (logs.reduce((a, b) => a + Number(b.exerciseMinutes || 0), 0) / logs.length).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Your productivity overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayScore}%</div>
            <p className="text-xs text-muted-foreground">Based on routine log</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Sleep</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSleep}h</div>
            <p className="text-xs text-muted-foreground">Across all logs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Study</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgStudy}h</div>
            <p className="text-xs text-muted-foreground">Across all logs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Exercise</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgExercise} min</div>
            <p className="text-xs text-muted-foreground">Across all logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

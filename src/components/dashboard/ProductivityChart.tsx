import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ProductivityChart = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const logsRef = ref(db, `users/${user.uid}/productivityLogs`);
    onValue(logsRef, (snapshot) => {
      const logs = snapshot.val();
      if (!logs) {
        setData([]);
        return;
      }

      const map: Record<string, number> = {};

      Object.values<any>(logs).forEach((log) => {
        const date = log.completedAt.split("T")[0];
        map[date] = (map[date] || 0) + 1;
      });

      const converted = Object.entries(map).map(([date, count]) => ({
        date,
        count,
      }));

      setData(converted);
    });
  }, [user]);

  return (
    <div className="rounded-xl border p-4 bg-card">
      <h2 className="text-xl font-semibold mb-4">Productivity Trend</h2>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm">No completed task logs yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ProductivityChart;

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoutineLogModal from "@/components/routine/RoutineLogModal";
import { format } from "date-fns";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { RoutineEntry } from "@/lib/routineStore";

const RoutineLogs = () => {
  const [logs, setLogs] = useState<RoutineEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch logs live from Firebase
  useEffect(() => {
    const logsRef = ref(db, "routineLogs");
    onValue(logsRef, (snapshot) => {
      if (!snapshot.exists()) return setLogs([]);
      const arr = Object.entries(snapshot.val()).map(([id, data]: any) => ({
        id,
        ...data,
      }));
      setLogs(arr.reverse());
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Routine Logs</h2>
          <p className="text-muted-foreground mt-1">
            Track daily habits & productivity
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Log
        </Button>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <CardTitle>{format(new Date(log.date), "MMMM dd, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                <div><p className="text-muted-foreground">Sleep Hours</p><p>{log.sleepHours} h</p></div>
                <div><p className="text-muted-foreground">Study Hours</p><p>{log.studyHours} h</p></div>
                <div><p className="text-muted-foreground">Exercise</p><p>{log.exerciseMinutes} min</p></div>
                <div><p className="text-muted-foreground">Breaks</p><p>{log.breaks}</p></div>
              </div>

              <div className="p-4 border rounded-md bg-muted/40">
                <p className="text-sm font-semibold">
                  Productivity Score:{" "}
                  <span className="text-primary">{log.score}/100</span>
                </p>
                <p className="text-sm">
                  Verdict: <span className="font-medium">{log.verdict}</span>
                </p>
                <p className="text-xs italic text-muted-foreground mt-1">
                  💡 {log.recommendation}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 🔥 MODAL — no onAddLog prop anymore */}
      <RoutineLogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default RoutineLogs;

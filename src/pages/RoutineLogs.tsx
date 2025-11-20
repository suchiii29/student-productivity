import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoutineLogModal from "@/components/routine/RoutineLogModal";
import { format } from "date-fns";

export interface RoutineLog {
  id: string;
  date: Date;
  wakeTime: string;
  sleepTime: string;
  studyHours: number;
  exercise: number;
  breaks: number;
  classTimings: string;
}

const mockLogs: RoutineLog[] = [
  {
    id: "1",
    date: new Date(2025, 11, 20),
    wakeTime: "06:30",
    sleepTime: "22:30",
    studyHours: 6,
    exercise: 45,
    breaks: 4,
    classTimings: "9:00-12:00, 14:00-16:00",
  },
  {
    id: "2",
    date: new Date(2025, 11, 19),
    wakeTime: "07:00",
    sleepTime: "23:00",
    studyHours: 5,
    exercise: 30,
    breaks: 3,
    classTimings: "9:00-12:00, 14:00-16:00",
  },
];

const RoutineLogs = () => {
  const [logs, setLogs] = useState<RoutineLog[]>(mockLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddLog = (log: Omit<RoutineLog, "id">) => {
    const newLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
    };
    setLogs([newLog, ...logs]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Routine Logs</h2>
          <p className="text-muted-foreground mt-1">Track your daily routines and habits</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Log
        </Button>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <CardTitle className="text-lg">{format(log.date, "MMMM dd, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Wake Time</p>
                  <p className="font-medium">{log.wakeTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sleep Time</p>
                  <p className="font-medium">{log.sleepTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Study Hours</p>
                  <p className="font-medium">{log.studyHours}h</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exercise</p>
                  <p className="font-medium">{log.exercise} min</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Breaks</p>
                  <p className="font-medium">{log.breaks}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Class Timings</p>
                  <p className="font-medium">{log.classTimings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RoutineLogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddLog={handleAddLog}
      />
    </div>
  );
};

export default RoutineLogs;

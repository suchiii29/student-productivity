import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TimeBlock {
  id: string;
  time: string;
  task: string;
  type: "study" | "break" | "class" | "exercise";
  suggested?: boolean;
}

const schedule: TimeBlock[] = [
  { id: "1", time: "06:30 - 07:00", task: "Morning Routine", type: "break" },
  { id: "2", time: "07:00 - 08:00", task: "Exercise & Breakfast", type: "exercise" },
  { id: "3", time: "08:00 - 09:00", task: "Language Memorization", type: "study", suggested: true },
  { id: "4", time: "09:00 - 12:00", task: "Classes", type: "class" },
  { id: "5", time: "12:00 - 13:00", task: "Lunch Break", type: "break" },
  { id: "6", time: "13:00 - 14:00", task: "Light Study Session", type: "study" },
  { id: "7", time: "14:00 - 16:00", task: "Classes", type: "class" },
  { id: "8", time: "16:00 - 16:30", task: "Rest Period (Low Energy)", type: "break", suggested: true },
  { id: "9", time: "16:30 - 18:00", task: "Assignment Work", type: "study" },
  { id: "10", time: "18:00 - 19:00", task: "Dinner & Break", type: "break" },
  { id: "11", time: "19:00 - 21:00", task: "Math & Problem Solving", type: "study", suggested: true },
  { id: "12", time: "21:00 - 22:00", task: "Light Reading", type: "study" },
  { id: "13", time: "22:00 - 22:30", task: "Night Routine", type: "break" },
];

const Scheduler = () => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "study":
        return "bg-primary/10 border-primary/30";
      case "break":
        return "bg-muted border-border";
      case "class":
        return "bg-accent border-accent";
      case "exercise":
        return "bg-secondary border-border";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Smart Scheduler</h2>
          <p className="text-muted-foreground mt-1">
            AI-optimized daily schedule based on your productivity patterns
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reschedule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {schedule.map((block) => (
              <div
                key={block.id}
                className={`flex items-center gap-4 p-3 rounded-lg border ${getTypeColor(
                  block.type
                )} transition-colors`}
              >
                <div className="text-sm font-medium text-muted-foreground min-w-[140px]">
                  {block.time}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{block.task}</span>
                    {block.suggested && (
                      <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                        Suggested
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground capitalize">{block.type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.5 hours</div>
            <p className="text-xs text-muted-foreground">Scheduled study blocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Break Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 hours</div>
            <p className="text-xs text-muted-foreground">Rest and recovery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">Alignment with your peak hours</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Scheduler;

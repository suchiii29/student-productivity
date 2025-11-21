import { useEffect, useState } from "react";
import { getTasks } from "@/lib/taskStore";
import { prioritizeTasks } from "@/lib/aiPrioritizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecommendedTask {
  id: string;
  title: string;
  aiScore: number;
  category?: string;
  deadline?: string;
  duration?: number;
  priority?: string;
}

const Recommendations = () => {
  const [recommended, setRecommended] = useState<RecommendedTask[]>([]);

  useEffect(() => {
    try {
      const tasks = getTasks() || [];
      console.log("TASKS DEBUG ->", tasks);

      const ranked = prioritizeTasks(tasks) || [];
      setRecommended(ranked);
    } catch (err) {
      console.error("AI PRIORITIZER ERROR:", err);
      setRecommended([]);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">AI Task Prioritizer</h2>
        <p className="text-muted-foreground mt-1">
          Smart ordering of your pending tasks based on urgency, duration, priority & deadlines.
        </p>
      </div>

      {/* Empty state */}
      {recommended.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-lg">
            🎉 You have completed all tasks. Nothing to prioritize!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommended.map((task, index) => (
            <Card
              key={task.id}
              className="hover:border-primary/50 transition-colors"
            >
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    #{index + 1} — {task.title}
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    AI Score: {Math.round(task.aiScore)}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="text-sm space-y-1 text-muted-foreground">
                {task.category && <p><strong>Category:</strong> {task.category}</p>}
                {task.deadline && <p><strong>Deadline:</strong> {task.deadline}</p>}
                {task.duration && <p><strong>Duration:</strong> {task.duration} mins</p>}
                {task.priority && <p><strong>Priority:</strong> {task.priority}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer info */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            Task priority updates automatically whenever new tasks are added or completed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recommendations;

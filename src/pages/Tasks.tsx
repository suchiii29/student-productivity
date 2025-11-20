import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import TaskTable from "@/components/tasks/TaskTable";
import AddTaskModal from "@/components/tasks/AddTaskModal";

import { db } from "@/firebase"; // <-- FIXED PATH
import { ref, onValue, push, update, off } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { saveDailyProductivity } from "@/lib/productivityStore";

export interface Task {
  id: string;
  title: string;
  category: "Study" | "Health" | "Personal";
  deadline: string;
  duration: number;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "completed";
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    const tasksRef = ref(db, "tasks");

    onValue(
      tasksRef,
      (snapshot) => {
        setLoading(true);
        const data = snapshot.val();

        if (!data) {
          setTasks([]);
          setError(null);
          setLoading(false);
          return;
        }

        const loadedTasks = Object.entries(data).map(([id, value]: any) => ({
          id,
          title: value.title || "Untitled",
          category: value.category || "Personal",
          deadline: value.deadline || "",
          duration: value.duration || 0,
          priority: value.priority || "Medium",
          status: value.status || "pending",
        }));

        setTasks(loadedTasks);
        setError(null);
        setLoading(false);
      },
      (error) => {
        setError(`Failed to load tasks: ${error.message}`);
        setLoading(false);
        setTasks([]);
      }
    );

    return () => off(tasksRef);
  }, []);

  // Add task
  const handleAddTask = async (task: Omit<Task, "id">) => {
    try {
      const tasksRef = ref(db, "tasks");
      await push(tasksRef, {
        ...task,
        status: "pending",
      });
      setIsModalOpen(false);
    } catch {
      setError("Failed to add task");
    }
  };

  // Toggle status + productivity score
  const handleToggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const taskRef = ref(db, `tasks/${id}`);
      await update(taskRef, { status: newStatus });

      // If completed, add to logs and increase score
      if (newStatus === "completed" && user?.uid) {
        const logsRef = ref(db, `users/${user.uid}/productivityLogs`);
        await push(logsRef, {
          taskId: task.id,
          title: task.title,
          completedAt: new Date().toISOString(),
          durationMin: task.duration ?? 30,
          category: task.category,
        });

        await saveDailyProductivity(user.uid, true);
      }
      // If undone, decrease score
      else if (user?.uid) {
        await saveDailyProductivity(user.uid, false);
      }
    } catch {
      setError("Failed to update task");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Tasks</h2>
          <p className="text-muted-foreground mt-1">
            Manage your daily tasks and priorities
          </p>
          <p className="text-sm text-muted-foreground">{tasks.length} task(s) found</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-lg text-muted-foreground">No tasks yet</p>
          <p className="text-sm text-muted-foreground">Create your first task to get started</p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Task
          </Button>
        </div>
      ) : (
        <TaskTable tasks={tasks} onToggleTask={handleToggleTask} />
      )}

      <AddTaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddTask={handleAddTask}
      />
    </div>
  );
};

export default Tasks;

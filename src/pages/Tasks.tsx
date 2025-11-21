// src/pages/Tasks.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskTable from "@/components/tasks/TaskTable";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getTasks, addTaskStore, updateTaskStore } from "@/lib/taskStore";

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  deadline: string;
  duration: number;
  startTime?: string | null;
  endTime?: string | null;
  status: "pending" | "completed";
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTasks(getTasks());
  }, []);

  const addTask = (task: Omit<Task, "id">) => {
    addTaskStore(task);
    setTasks(getTasks());
  };

  const toggleTask = (id: string) => {
    const current = getTasks().find((t) => t.id === id);
    if (!current) return;

    updateTaskStore(id, {
      status: current.status === "completed" ? "pending" : "completed",
    });

    setTasks(getTasks());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Tasks</h2>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskTable tasks={tasks} onToggleTask={toggleTask} />
        </CardContent>
      </Card>

      <AddTaskModal open={open} onOpenChange={setOpen} onAddTask={addTask} />
    </div>
  );
};

export default Tasks;

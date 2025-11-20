import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TaskTable from "@/components/tasks/TaskTable";
import AddTaskModal from "@/components/tasks/AddTaskModal";

export interface Task {
  id: string;
  title: string;
  category: "Study" | "Health" | "Personal";
  deadline: Date;
  duration: number;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "completed";
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Complete Math Assignment",
    category: "Study",
    deadline: new Date(2025, 11, 22),
    duration: 120,
    priority: "High",
    status: "pending",
  },
  {
    id: "2",
    title: "Morning Workout",
    category: "Health",
    deadline: new Date(2025, 11, 21),
    duration: 45,
    priority: "Medium",
    status: "completed",
  },
  {
    id: "3",
    title: "Read Research Paper",
    category: "Study",
    deadline: new Date(2025, 11, 25),
    duration: 90,
    priority: "High",
    status: "pending",
  },
];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddTask = (task: Omit<Task, "id">) => {
    const newTask = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTasks([...tasks, newTask]);
    setIsModalOpen(false);
  };

  const handleToggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, status: task.status === "completed" ? "pending" : "completed" }
          : task
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Tasks</h2>
          <p className="text-muted-foreground mt-1">Manage your daily tasks and priorities</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <TaskTable tasks={tasks} onToggleTask={handleToggleTask} />
      <AddTaskModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onAddTask={handleAddTask}
      />
    </div>
  );
};

export default Tasks;

// src/pages/Tasks.tsx - Firebase Version

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskTable from "@/components/tasks/TaskTable";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import { Button } from "@/components/ui/button";
import { Plus, ListChecks, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  subscribeToTasks, 
  createTask, 
  toggleTaskCompletion,
  getTaskStats,
  FirebaseTask 
} from "@/services/taskService";

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
  const { uid, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<FirebaseTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Subscribe to tasks from Firebase
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToTasks(uid, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  // Listen for global add task event (from Dashboard)
  useEffect(() => {
    const handleOpenModal = () => setOpen(true);
    window.addEventListener("openAddTaskModal", handleOpenModal);
    return () => window.removeEventListener("openAddTaskModal", handleOpenModal);
  }, []);

  const addTask = async (task: Omit<Task, "id">) => {
    if (!uid) return;
    await createTask(uid, task);
    // No need to manually update state - Firebase subscription handles it
  };

  const toggleTask = async (id: string) => {
    if (!uid) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await toggleTaskCompletion(uid, id, task.status);
  };

  // Calculate stats
  const stats = getTaskStats(tasks);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!uid) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ListChecks className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">Please log in to view your tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border">
        <div>
          <h2 className="text-4xl font-bold flex items-center gap-2">
            <ListChecks className="h-8 w-8 text-indigo-600" />
            Tasks
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your study tasks and track your progress.
          </p>
        </div>

        <Button
          onClick={() => setOpen(true)}
          className="px-5 py-2 text-md flex items-center gap-2 shadow-md"
        >
          <Plus className="h-5 w-5" /> Add Task
        </Button>
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="shadow-sm border hover:shadow-lg transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Tasks</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
            <ListChecks className="h-10 w-10 text-indigo-600" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border hover:shadow-lg transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Completed</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.completed}</h3>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border hover:shadow-lg transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Pending</p>
              <h3 className="text-2xl font-bold text-orange-500">{stats.pending}</h3>
            </div>
            <Clock className="h-10 w-10 text-orange-500" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border hover:shadow-lg transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">High Priority</p>
              <h3 className="text-2xl font-bold text-red-500">{stats.highPriority}</h3>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate Banner */}
      {stats.total > 0 && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Overall Completion Rate</p>
              <p className="text-xs text-muted-foreground">
                Keep up the great work!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
              <span className="text-lg font-bold text-green-600">
                {stats.completionRate}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Task List</span>
            {stats.todayTasks > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {stats.todayCompleted}/{stats.todayTasks} tasks due today
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <ListChecks className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
              <Button onClick={() => setOpen(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" /> Add Task
              </Button>
            </div>
          ) : (
            <TaskTable tasks={tasks} onToggleTask={toggleTask} />
          )}
        </CardContent>
      </Card>

      {/* Add Task Modal */}
      <AddTaskModal open={open} onOpenChange={setOpen} onAddTask={addTask} />
    </div>
  );
};

export default Tasks;

// src/lib/taskStore.ts
import { Task } from "@/pages/Tasks";

const STORAGE_KEY = "tasks";

export const getTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load tasks:", error);
    return [];
  }
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

export const addTaskStore = (task: Omit<Task, "id">): Task => {
  const newTask: Task = { id: crypto.randomUUID(), ...task };
  const tasks = getTasks();
  const updated = [newTask, ...tasks];
  saveTasks(updated);
  return newTask;
};

export const updateTaskStore = (id: string, data: Partial<Task>) => {
  const tasks = getTasks().map((t) => (t.id === id ? { ...t, ...data } : t));
  saveTasks(tasks);
};

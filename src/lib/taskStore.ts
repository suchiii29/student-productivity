// src/lib/taskStore.ts - FIXED VERSION
import { db } from "@/firebase";
import { ref, push, set, update, remove, onValue } from "firebase/database";

export interface EnhancedTask {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  priority?: "High" | "Medium" | "Low";
  deadline?: string;
  category?: string;
  status?: "pending" | "in-progress" | "completed";
  completedAt?: string;
  completedHour?: number;
  createdAt?: number;
  userId?: string;
}

// In-memory cache (updates from Firebase)
let tasksCache: EnhancedTask[] = [];
let currentUserId: string | null = null;

// Initialize real-time listener
export function initTaskStore(userId: string) {
  currentUserId = userId;
  const tasksRef = ref(db, `tasks/${userId}`);
  
  onValue(tasksRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      tasksCache = Array.isArray(data)
        ? data.filter(Boolean).map((task, idx) => ({ ...task, id: task.id || idx.toString() }))
        : Object.entries(data).map(([id, task]: any) => ({ ...task, id }));
    } else {
      tasksCache = [];
    }
  });
}

// Get all tasks
export function getTasks(): EnhancedTask[] {
  return tasksCache;
}

// Get completed tasks only
export function getCompletedTasks(): EnhancedTask[] {
  return tasksCache.filter(t => t.status === "completed");
}

// Get pending tasks
export function getPendingTasks(): EnhancedTask[] {
  return tasksCache.filter(t => t.status !== "completed");
}

// Add a new task
export async function addTaskStore(task: Partial<EnhancedTask>) {
  if (!currentUserId) throw new Error("User not logged in");
  
  const tasksRef = ref(db, `tasks/${currentUserId}`);
  const newTaskRef = push(tasksRef);
  
  const newTask: EnhancedTask = {
    id: newTaskRef.key!,
    title: task.title || "Untitled Task",
    description: task.description || "",
    duration: task.duration || 60,
    priority: task.priority || "Medium",
    deadline: task.deadline || "",
    category: task.category || "General",
    status: task.status || "pending",
    createdAt: Date.now(),
    userId: currentUserId,
  };
  
  await set(newTaskRef, newTask);
  return newTask;
}

// Update task
export async function updateTask(taskId: string, updates: Partial<EnhancedTask>) {
  if (!currentUserId) throw new Error("User not logged in");
  
  const taskRef = ref(db, `tasks/${currentUserId}/${taskId}`);
  await update(taskRef, updates);
}

// Mark task as completed
export async function completeTask(taskId: string) {
  const now = new Date();
  const completedHour = now.getHours();
  
  await updateTask(taskId, {
    status: "completed",
    completedAt: now.toISOString(),
    completedHour,
  });
}

// Delete task
export async function deleteTask(taskId: string) {
  if (!currentUserId) throw new Error("User not logged in");
  
  const taskRef = ref(db, `tasks/${currentUserId}/${taskId}`);
  await remove(taskRef);
}
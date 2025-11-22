// src/services/taskService.ts - FIXED VERSION
// Firebase-based task service (replaces localStorage taskStore.ts)

import { db } from "@/firebase";
import { ref, push, set, update, remove, onValue, off, get } from "firebase/database";
import { Task } from "@/pages/Tasks";

export interface FirebaseTask extends Task {
  createdAt: string;
  completedAt?: string;
  completedHour?: number;
  userId: string;
}

// Refs
const getUserTasksRef = (userId: string) => ref(db, `tasks/${userId}`);
const getTaskRef = (userId: string, taskId: string) => ref(db, `tasks/${userId}/${taskId}`);

// Subscribe to user's tasks (real-time)
export const subscribeToTasks = (
  userId: string,
  callback: (tasks: FirebaseTask[]) => void
) => {
  const tasksRef = getUserTasksRef(userId);

  onValue(tasksRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const tasks = Object.entries(data).map(([id, task]: [string, any]) => ({
        id,
        ...task,
      }));
      // Sort by creation date (newest first)
      tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(tasks);
    } else {
      callback([]);
    }
  });

  return () => off(tasksRef);
};

// Get tasks once (non-reactive)
export const getTasks = async (userId: string): Promise<FirebaseTask[]> => {
  const tasksRef = getUserTasksRef(userId);
  const snapshot = await get(tasksRef);
  const data = snapshot.val();
  
  if (!data) return [];
  
  return Object.entries(data).map(([id, task]: [string, any]) => ({
    id,
    ...task,
  }));
};

// Create task
export const createTask = async (
  userId: string,
  taskData: Omit<Task, "id">
): Promise<FirebaseTask> => {
  const tasksRef = getUserTasksRef(userId);
  const newTaskRef = push(tasksRef);
  
  const now = new Date();
  const task: Omit<FirebaseTask, "id"> = {
    ...taskData,
    userId,
    createdAt: now.toISOString(),
  };

  await set(newTaskRef, task);
  
  return {
    id: newTaskRef.key!,
    ...task,
  };
};

// Update task
export const updateTask = async (
  userId: string,
  taskId: string,
  updates: Partial<Task>
): Promise<void> => {
  const taskRef = getTaskRef(userId, taskId);
  
  const updateData: any = { ...updates };
  
  // Handle completion timestamp - FIXED
  if (updates.status === "completed") {
    const now = new Date();
    updateData.completedAt = now.toISOString();
    updateData.completedHour = now.getHours();
    console.log(`Task marked complete at hour: ${now.getHours()}`);
  } else if (updates.status === "pending") {
    // Clear completion data when marking as pending
    updateData.completedAt = null;
    updateData.completedHour = null;
  }
  
  await update(taskRef, updateData);
};

// Delete task
export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  const taskRef = getTaskRef(userId, taskId);
  await remove(taskRef);
};

// Toggle task completion - FIXED
export const toggleTaskCompletion = async (
  userId: string,
  taskId: string,
  currentStatus: "pending" | "completed"
): Promise<void> => {
  const newStatus = currentStatus === "completed" ? "pending" : "completed";
  const now = new Date();
  
  const updates: any = { status: newStatus };
  
  // Add timestamp and hour when marking as completed
  if (newStatus === "completed") {
    updates.completedAt = now.toISOString();
    updates.completedHour = now.getHours();
    console.log(`✅ Task completed at ${now.getHours()}:00 (${now.toISOString()})`);
  } else {
    // Clear timestamp when marking as pending
    updates.completedAt = null;
    updates.completedHour = null;
  }
  
  const taskRef = getTaskRef(userId, taskId);
  await update(taskRef, updates);
};

// Get task statistics
export const getTaskStats = (tasks: FirebaseTask[]) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const pending = tasks.filter(t => t.status === "pending").length;
  const highPriority = tasks.filter(t => t.priority === "High" && t.status === "pending").length;
  
  // Get today's tasks
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.deadline === today);
  const todayCompleted = todayTasks.filter(t => t.status === "completed").length;
  
  // Completion rate
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Most productive hour (based on completed tasks)
  const completedTasks = tasks.filter(t => t.completedHour !== undefined);
  const hourCounts: Record<number, number> = {};
  completedTasks.forEach(t => {
    if (t.completedHour !== undefined) {
      hourCounts[t.completedHour] = (hourCounts[t.completedHour] || 0) + 1;
    }
  });
  
  let productiveHour = 10; // default
  let maxCount = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      productiveHour = parseInt(hour);
    }
  });

  return {
    total,
    completed,
    pending,
    highPriority,
    todayTasks: todayTasks.length,
    todayCompleted,
    completionRate,
    productiveHour,
  };
};

// Get tasks completed in date range
export const getTasksInRange = (
  tasks: FirebaseTask[],
  startDate: Date,
  endDate: Date
): FirebaseTask[] => {
  return tasks.filter(t => {
    if (!t.completedAt) return false;
    const completed = new Date(t.completedAt);
    return completed >= startDate && completed <= endDate;
  });
};

// Get overdue tasks
export const getOverdueTasks = (tasks: FirebaseTask[]): FirebaseTask[] => {
  const today = new Date().toISOString().slice(0, 10);
  return tasks.filter(t => 
    t.status === "pending" && t.deadline < today
  );
};
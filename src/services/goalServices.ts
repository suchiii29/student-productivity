// src/services/goalService.ts

import { db } from "@/firebase";
import { ref, push, set, update, remove, onValue, off, get } from "firebase/database";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: "academic" | "health" | "skill" | "personal";
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., "hours", "tasks", "pages", "sessions"
  deadline: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "completed" | "paused";
}

export interface GoalProgress {
  id: string;
  goalId: string;
  value: number;
  note?: string;
  timestamp: string;
}

// Get goals path for a user
const getUserGoalsRef = (userId: string) => ref(db, `goals/${userId}`);
const getGoalRef = (userId: string, goalId: string) => ref(db, `goals/${userId}/${goalId}`);
const getProgressRef = (userId: string, goalId: string) => ref(db, `goalProgress/${userId}/${goalId}`);

// Subscribe to user's goals
export const subscribeToGoals = (
  userId: string,
  callback: (goals: Goal[]) => void
) => {
  const goalsRef = getUserGoalsRef(userId);
  
  onValue(goalsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const goals = Object.entries(data).map(([id, goal]: [string, any]) => ({
        id,
        ...goal,
      }));
      callback(goals);
    } else {
      callback([]);
    }
  });

  // Return unsubscribe function
  return () => off(goalsRef);
};

// Create a new goal
export const createGoal = async (
  userId: string,
  goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt" | "currentValue" | "status">
): Promise<Goal> => {
  const goalsRef = getUserGoalsRef(userId);
  const newGoalRef = push(goalsRef);
  
  const now = new Date().toISOString();
  const goal: Omit<Goal, "id"> = {
    ...goalData,
    userId,
    currentValue: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await set(newGoalRef, goal);
  
  return {
    id: newGoalRef.key!,
    ...goal,
  };
};

// Update goal
export const updateGoal = async (
  userId: string,
  goalId: string,
  updates: Partial<Goal>
): Promise<void> => {
  const goalRef = getGoalRef(userId, goalId);
  await update(goalRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

// Delete goal
export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  const goalRef = getGoalRef(userId, goalId);
  await remove(goalRef);
};

// Add progress to a goal - FIXED VERSION
export const addProgress = async (
  userId: string,
  goalId: string,
  value: number,
  note?: string
): Promise<void> => {
  console.log("addProgress called with:", { userId, goalId, value, note });
  
  if (!userId || !goalId || !value) {
    throw new Error("Missing required parameters");
  }

  // Get the goal reference
  const goalRef = getGoalRef(userId, goalId);
  
  // Use get() to fetch current goal data once
  const snapshot = await get(goalRef);
  
  if (!snapshot.exists()) {
    throw new Error("Goal not found");
  }
  
  const goal = snapshot.val() as Goal;
  console.log("Current goal data:", goal);
  
  // Calculate new values
  const newValue = (goal.currentValue || 0) + value;
  const isCompleted = newValue >= goal.targetValue;
  
  console.log("Calculated values:", { currentValue: goal.currentValue, addedValue: value, newValue, isCompleted });
  
  // Save the progress entry
  const progressRef = getProgressRef(userId, goalId);
  const newProgressRef = push(progressRef);
  
  await set(newProgressRef, {
    goalId,
    value,
    note: note || "",
    timestamp: new Date().toISOString(),
  });
  
  console.log("Progress entry saved");
  
  // Update the goal's current value and status
  await update(goalRef, {
    currentValue: newValue,
    status: isCompleted ? "completed" : "active",
    updatedAt: new Date().toISOString(),
  });
  
  console.log("Goal updated successfully");
};

// Subscribe to goal progress
export const subscribeToProgress = (
  userId: string,
  goalId: string,
  callback: (progress: GoalProgress[]) => void
) => {
  const progressRef = getProgressRef(userId, goalId);
  
  onValue(progressRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const progress = Object.entries(data).map(([id, p]: [string, any]) => ({
        id,
        ...p,
      }));
      callback(progress);
    } else {
      callback([]);
    }
  });

  return () => off(progressRef);
};

// Calculate goal statistics
export const calculateGoalStats = (goals: Goal[]) => {
  const active = goals.filter(g => g.status === "active");
  const completed = goals.filter(g => g.status === "completed");
  
  const totalProgress = active.reduce((acc, g) => {
    const progress = Math.min((g.currentValue / g.targetValue) * 100, 100);
    return acc + progress;
  }, 0);
  
  const avgProgress = active.length > 0 ? totalProgress / active.length : 0;
  
  return {
    total: goals.length,
    active: active.length,
    completed: completed.length,
    avgProgress: Math.round(avgProgress),
  };
};
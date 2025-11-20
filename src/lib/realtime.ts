// src/lib/realtime.ts
import { ref, push, set, update, remove, onValue, get, child } from "firebase/database";
import { rtdb } from "@/firebase"; // adjust path if needed
import { getAuth } from "firebase/auth";

/**
 * Data layout (recommended)
 * /users/{uid}/profile
 * /users/{uid}/tasks/{taskId}
 * /users/{uid}/routines/{routineId}
 * /users/{uid}/analytics/{dateId}
 * /users/{uid}/recommendations/{dateId}
 */

// Create task
export async function addTask(uid: string, taskData: {
  title: string;
  category?: string;
  durationMinutes: number;
  deadlineISO: string;
  priority?: number;
  status?: string;
}) {
  const tasksRef = ref(rtdb, `users/${uid}/tasks`);
  const newTaskRef = push(tasksRef);
  const payload = {
    ...taskData,
    priority: taskData.priority ?? 3,
    status: taskData.status ?? "pending",
    createdAt: Date.now()
  };
  await set(newTaskRef, payload);
  return newTaskRef.key;
}

// Update task
export async function updateTask(uid: string, taskId: string, updates: any) {
  const taskRef = ref(rtdb, `users/${uid}/tasks/${taskId}`);
  await update(taskRef, { ...updates, updatedAt: Date.now() });
}

// Delete task
export async function deleteTask(uid: string, taskId: string) {
  const taskRef = ref(rtdb, `users/${uid}/tasks/${taskId}`);
  await remove(taskRef);
}

// List tasks once
export async function getTasksOnce(uid: string) {
  const tasksSnap = await get(ref(rtdb, `users/${uid}/tasks`));
  return tasksSnap.exists() ? tasksSnap.val() : {};
}

// Subscribe to tasks (realtime)
export function subscribeTasks(uid: string, callback: (data: any) => void) {
  const tasksRef = ref(rtdb, `users/${uid}/tasks`);
  const unsub = onValue(tasksRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
  // onValue returns unsubscribe function via the listener handle; we return a function to call removeListener
  return () => unsub(); // usually onValue returns a function — check usage: in v9 onValue returns off function when you pass callback; safe to return unsubscribe
}

// Log a routine
export async function logRoutine(uid: string, routine: {
  type: string;
  startISO: string;
  endISO: string;
  notes?: string;
}) {
  const routinesRef = ref(rtdb, `users/${uid}/routines`);
  const newR = push(routinesRef);
  await set(newR, {
    ...routine,
    durationMinutes: Math.round((new Date(routine.endISO).getTime() - new Date(routine.startISO).getTime()) / 60000),
    createdAt: Date.now()
  });
  return newR.key;
}

// Recommendations and analytics can be stored similarly:
export async function setRecommendations(uid: string, dateId: string, suggestions: any[]) {
  const refNode = ref(rtdb, `users/${uid}/recommendations/${dateId}`);
  await set(refNode, { generatedAt: Date.now(), suggestions });
}

export async function setAnalytics(uid: string, dateId: string, metrics: any) {
  await set(ref(rtdb, `users/${uid}/analytics/${dateId}`), { generatedAt: Date.now(), metrics });
}

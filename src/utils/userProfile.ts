// src/utils/userProfile.ts
import { db } from "@/firebase.js"; // ✅ changed from rtdb to db
import { ref, set } from "firebase/database";
import type { User } from "firebase/auth";

/**
 * createProfile(user, name)
 * - writes a small profile object to Realtime Database at /users/{uid}/profile
 */
export async function createProfile(user: User, name: string) {
  if (!user || !user.uid) throw new Error("Invalid user");
  const profileRef = ref(db, `users/${user.uid}/profile`);
  await set(profileRef, {
    name: name || "",
    email: user.email || "",
    createdAt: Date.now(),
  });
}

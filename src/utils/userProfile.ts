// src/utils/userProfile.ts
import { db } from "@/firebase.js";
import { ref, set, get, child } from "firebase/database";
import type { User } from "firebase/auth";

/**
 * createProfile(user, name)
 * Writes a profile object to /users/{uid}/profile ONLY for the logged-in user.
 */
export async function createProfile(user: User, name: string) {
  if (!user || !user.uid) throw new Error("Invalid user");

  const uid = user.uid;
  const profileRef = ref(db, `users/${uid}/profile`);

  try {
    // Optional: check rules allow this user to write
    const testRef = child(ref(db), `users/${uid}`);
    await get(testRef); // will throw permission_denied if not allowed

    await set(profileRef, {
      name: name || "",
      email: user.email || "",
      createdAt: Date.now(),
    });

    console.log("🔥 Profile created for:", uid);

  } catch (err: any) {
    console.error("❌ Failed to create profile:", err?.message || err);
    throw err;
  }
}

/**
 * updateProfileData(user, data)
 * More flexible updating function
 */
export async function updateProfileData(user: User, data: Record<string, any>) {
  if (!user?.uid) throw new Error("Invalid user");

  const uid = user.uid;
  const profileRef = ref(db, `users/${uid}/profile`);

  try {
    await set(profileRef, {
      ...data,
      updatedAt: Date.now(),
    });

    console.log("🔥 Profile updated for:", uid);

  } catch (err: any) {
    console.error("❌ Failed to update profile:", err?.message || err);
    throw err;
  }
}

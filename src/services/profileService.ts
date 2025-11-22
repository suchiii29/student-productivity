// src/services/profileService.ts
// NO FIREBASE STORAGE REQUIRED - Uses Firestore only
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "@/firebase";

/**
 * Compress and convert image to base64 data URL
 * This reduces file size while maintaining quality
 */
const compressImage = (file: File, maxWidth: number = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize image
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 (JPEG with 80% quality for smaller size)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload profile picture (stored in Firestore as base64)
 * No Firebase Storage required!
 */
export const uploadProfilePicture = async (
  uid: string, 
  file: File
): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Compress image to base64 data URL
    const photoURL = await compressImage(file, 400);

    // Update user stats with new photo URL
    const statsRef = doc(firestore, "userStats", uid);
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
      await updateDoc(statsRef, { photoURL });
    }

    // Update profile with new photo URL
    const profileRef = doc(firestore, "profiles", uid);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      await updateDoc(profileRef, { photoURL });
    }

    return photoURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

/**
 * Get profile picture URL from Firestore
 */
export const getProfilePicture = async (uid: string): Promise<string | null> => {
  try {
    const profileRef = doc(firestore, "profiles", uid);
    const docSnap = await getDoc(profileRef);
    
    if (docSnap.exists()) {
      return docSnap.data()?.photoURL || null;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting profile picture:", error);
    return null;
  }
};
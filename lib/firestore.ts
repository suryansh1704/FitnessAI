"use client";

import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Save user profile data to Firestore
 * @param userId The user's ID
 * @param data The profile data to save
 */
export const saveUserProfile = async (userId: string, data: any) => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    
    // Reference to the user document
    const userRef = doc(db, "users", userId);
    
    // Check if the document already exists
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new document
      await setDoc(userRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving user profile:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};

/**
 * Get user profile data from Firestore
 * @param userId The user's ID
 */
export const getUserProfile = async (userId: string) => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return { 
        success: true, 
        data: docSnap.data() 
      };
    } else {
      return { 
        success: false, 
        error: "User profile not found" 
      };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}; 
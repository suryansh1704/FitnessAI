"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator, FirebaseStorage } from "firebase/storage";

// Hardcoded Firebase configuration - this ensures the app works even if env vars fail
const hardcodedConfig = {
  apiKey: "AIzaSyC_de-W4MKr9QWJt3ViFTE5fj3D7e-vzIs",
  authDomain: "fitness-app-47f3f.firebaseapp.com",
  projectId: "fitness-app-47f3f",
  storageBucket: "fitness-app-47f3f.firebasestorage.app",
  messagingSenderId: "843463635545",
  appId: "1:843463635545:web:b43b97cbd1a6919b6d3748",
  measurementId: "G-64FMHWDM85"
};

// Try to load from environment variables first
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || hardcodedConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || hardcodedConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || hardcodedConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || hardcodedConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || hardcodedConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || hardcodedConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || hardcodedConfig.measurementId,
};

// Debug Firebase config
console.log("Firebase Config API key:", 
  firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 6)}...` : "undefined");

// Check if required Firebase config is present
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

if (!isConfigValid) {
  console.error("Firebase configuration is incomplete or invalid!");
}

// Only initialize Firebase on the client side
let app;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== 'undefined') {
  try {
    // Initialize Firebase or get existing instance
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Connect to emulators for local development if needed
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      // Auth emulator
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      
      // Firestore emulator
      connectFirestoreEmulator(db, 'localhost', 8080);
      
      // Storage emulator
      connectStorageEmulator(storage, 'localhost', 9199);
      
      console.log('Connected to Firebase emulators');
    }

    console.log('Firebase initialized successfully!');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

export { app, auth, db, storage }; 
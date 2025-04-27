"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";

export default function FirebaseTestPage() {
  const [authStatus, setAuthStatus] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Firebase Auth is initialized
    if (auth) {
      setAuthStatus("Firebase Auth is initialized");
    } else {
      setAuthStatus("Firebase Auth is NOT initialized");
    }
  }, []);

  const testGoogleSignIn = async () => {
    try {
      setError(null);
      
      if (!auth) {
        throw new Error("Firebase Auth is not initialized");
      }
      
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setAuthStatus("Google Sign-in successful!");
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An unknown error occurred");
      setAuthStatus("Sign-in failed");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Authentication Test</h1>
      
      <div className="mb-8 p-4 border rounded-md">
        <h2 className="text-lg font-semibold mb-2">Status:</h2>
        <p className={`${authStatus.includes("NOT") ? "text-red-500" : "text-green-500"}`}>
          {authStatus}
        </p>
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <h3 className="font-semibold">Error:</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <Button onClick={testGoogleSignIn} className="w-full">
          Test Google Sign-In
        </Button>
        
        <div className="p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Config Status</h3>
          <pre className="text-xs overflow-auto p-2 bg-white border rounded-md">
            {`NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅" : "❌"}\n`}
            {`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅" : "❌"}\n`}
            {`NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅" : "❌"}\n`}
          </pre>
        </div>
      </div>
    </div>
  );
} 
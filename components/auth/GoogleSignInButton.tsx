"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ArrowRight } from "lucide-react";
import { doc, getDoc, setDoc, Firestore } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Only run auth on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const signInWithGoogle = async () => {
    if (!isClient) return;
    
    setIsLoading(true);
    
    try {
      // Check if auth is initialized
      if (!auth) {
        throw new Error("Firebase auth is not initialized. Please refresh the page and try again.");
      }
      
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        try {
          // Make sure Firestore is initialized
          if (!db) {
            throw new Error("Firestore is not initialized");
          }
          
          // Check if user has a profile in Firestore
          const userProfileRef = doc(db, 'users', result.user.uid);
          const userProfileSnap = await getDoc(userProfileRef);
          
          if (userProfileSnap.exists()) {
            // User has a profile, redirect to dashboard
            toast({
              title: "Welcome back!",
              description: "You're now signed in.",
            });
            router.push('/dashboard');
          } else {
            // First-time user, create minimal profile
            await setDoc(userProfileRef, {
              email: result.user.email,
              name: result.user.displayName,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            });
            
            // Redirect to onboarding
            toast({
              title: "Welcome to FitAI!",
              description: "Let's set up your profile.",
            });
            router.push('/onboarding');
          }
        } catch (firestoreError) {
          console.error("Firestore error:", firestoreError);
          // Even if there's a Firestore error, still redirect to onboarding
          router.push('/onboarding');
        }
      }
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      
      // Handle specific Firebase auth errors
      const errorCode = error.code;
      let errorMessage = "There was a problem signing you in. Please try again.";
      
      if (errorCode === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was canceled. Please try again.";
      } else if (errorCode === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups for this site.";
      } else if (errorCode === 'auth/api-key-not-valid') {
        errorMessage = "Authentication configuration issue. Please contact support.";
        console.error("API key invalid error. Check your environment variables.");
      } else if (error.message) {
        // Use the error message if available
        errorMessage = error.message;
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      size="lg" 
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
      onClick={signInWithGoogle}
      disabled={isLoading || !isClient}
    >
      {isLoading ? "Signing in..." : "Login with Google"}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
} 
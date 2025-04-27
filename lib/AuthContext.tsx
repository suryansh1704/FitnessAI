"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { Auth, User, onAuthStateChanged } from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null
});

export const useAuth = () => useContext(AuthContext);

interface AuthContextProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthContextProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize auth listener immediately
    let unsubscribe: () => void;
    
    try {
      // Set up auth state listener with optimized error handling
      unsubscribe = onAuthStateChanged(
        auth, 
        (user) => {
          setUser(user);
          setLoading(false);
        },
        (error) => {
          console.error("Auth state change error:", error);
          setError(error.message);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Error setting up auth listener:", err);
      setError(err instanceof Error ? err.message : "Authentication error");
      setLoading(false);
    }

    // Clean up subscription
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []); // Remove isClient dependency

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}; 
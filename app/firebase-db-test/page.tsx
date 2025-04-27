"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function FirestoreTestPage() {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<string>("Checking...");
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if Firestore is initialized
    if (db) {
      setDbStatus("Firestore is initialized");
    } else {
      setDbStatus("Firestore is NOT initialized");
    }
  }, []);

  const runTests = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to run the tests",
        variant: "destructive",
      });
      return;
    }

    if (!db) {
      toast({
        title: "Error",
        description: "Firestore is not initialized",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Write to a test collection
      setTestResults(prev => [...prev, "Test 1: Writing to 'test' collection..."]);
      const testCollectionRef = collection(db, "test");
      const docRef = await addDoc(testCollectionRef, { 
        message: "Test document",
        createdAt: serverTimestamp(),
        userId: user.uid
      });
      setTestResults(prev => [...prev, `Test 1: Success! Document written with ID: ${docRef.id}`]);

      // Test 2: Write to user profile
      setTestResults(prev => [...prev, "Test 2: Writing to user profile..."]);
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        test: "Profile test successful",
        lastLogin: serverTimestamp()
      }, { merge: true });
      setTestResults(prev => [...prev, "Test 2: Success! User profile updated"]);

      // Test 3: Read from test collection
      setTestResults(prev => [...prev, "Test 3: Reading from 'test' collection..."]);
      const querySnapshot = await getDocs(collection(db, "test"));
      setTestResults(prev => [...prev, `Test 3: Success! Found ${querySnapshot.size} documents`]);

      toast({
        title: "Tests Complete",
        description: "All Firestore tests completed successfully!",
      });
    } catch (error) {
      console.error("Firestore test error:", error);
      setTestResults(prev => [...prev, `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`]);
      
      toast({
        title: "Test Failed",
        description: "There was an error testing Firestore. See details on the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firestore Database Test</h1>
      
      <div className="mb-8 p-4 border rounded-md">
        <h2 className="text-lg font-semibold mb-2">Status:</h2>
        <p className={`${dbStatus.includes("NOT") ? "text-red-500" : "text-green-500"}`}>
          {dbStatus}
        </p>
        
        <div className="mt-4">
          <p className="text-sm mb-2">User: {user ? user.email : "Not logged in"}</p>
          <Button 
            onClick={runTests} 
            disabled={isLoading || !user || !db}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {isLoading ? "Running Tests..." : "Run Firestore Tests"}
          </Button>
        </div>
      </div>
      
      {testResults.length > 0 && (
        <div className="p-4 border rounded-md">
          <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            {testResults.map((result, index) => (
              <div key={index} className={`mb-2 text-sm ${result.includes("ERROR") ? "text-red-500" : ""}`}>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h3 className="font-semibold mb-2">Next Steps:</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Once tests pass, your Firebase Firestore integration is working</li>
          <li>Go to the <a href="/onboarding" className="text-blue-600 underline">onboarding page</a> to test profile creation</li>
          <li>Check the Firebase console to verify data is being stored</li>
        </ol>
      </div>
    </div>
  );
} 
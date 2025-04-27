"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!loading && user) {
        try {
          // Check if user has a profile in Firestore
          const userProfileRef = doc(db, 'users', user.uid);
          const userProfileSnap = await getDoc(userProfileRef);
          
          if (userProfileSnap.exists()) {
            // User has a profile, redirect to dashboard
            router.push('/dashboard');
          } else {
            // User doesn't have a profile, redirect to onboarding
            router.push('/onboarding');
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
          // If there's an error, default to onboarding
          router.push('/onboarding');
        }
      } else if (!loading && !user) {
        // Not logged in, stay on landing page
        router.push('/');
      }
    };

    checkUserProfile();
  }, [user, loading, router]);

  return { user, loading };
} 
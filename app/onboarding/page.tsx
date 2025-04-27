"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { UserProfileForm } from "@/components/onboarding/UserProfileForm"
import { useAuth } from "@/lib/AuthContext"
import { Card } from "@/components/ui/card"
import { LottiePlayer } from "@/components/ui/lottie-player"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState({
    dietaryPreference: "non-vegetarian",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl backdrop-blur-md bg-white/70 dark:bg-black/70 border-purple-100 dark:border-purple-900 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left side - Illustration */}
          <div className="md:w-2/5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-xs mb-6">
              <LottiePlayer
                autoplay
                loop
                src="https://assets5.lottiefiles.com/packages/lf20_wkebwzpz.json"
                style={{ height: "250px", width: "100%" }}
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                Welcome to FitAI!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Tell us a bit about yourself so we can create your personalized fitness journey.
              </p>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="md:w-3/5 p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold">Complete Your Profile</h3>
                <p className="text-sm text-gray-500">
                  This information helps us tailor your fitness experience
                </p>
              </div>
              
              <UserProfileForm />

              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium">Dietary Preference</h3>
                <RadioGroup 
                  value={userData.dietaryPreference} 
                  onValueChange={(value) => setUserData({...userData, dietaryPreference: value})}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-vegetarian" id="non-vegetarian" />
                    <Label htmlFor="non-vegetarian">Non-Vegetarian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vegetarian" id="vegetarian" />
                    <Label htmlFor="vegetarian">Vegetarian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vegan" id="vegan" />
                    <Label htmlFor="vegan">Vegan</Label>
                  </div>
                </RadioGroup>
              </div>
            </motion.div>
          </div>
        </div>
      </Card>
    </div>
  );
}

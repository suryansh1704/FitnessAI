"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Dumbbell, Salad, Brain, BarChartIcon as ChartMixedIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { LottiePlayer } from "@/components/ui/lottie-player"
import { auth } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if auth is initialized
    if (auth) {
      setAuthInitialized(true)
    } else {
      console.error("Firebase auth not initialized")
      toast({
        title: "Authentication Error",
        description: "There was a problem initializing authentication. Some features may not work.",
        variant: "destructive"
      })
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-purple-300/20 to-pink-300/20 dark:from-purple-500/10 dark:to-pink-500/10"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
            FitAI
          </h1>
        </div>
        <GoogleSignInButton />
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 pt-12 pb-24 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="block">Train Smarter.</span>
              <span className="block">Eat Better.</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                Built with AI.
              </span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-xl"
          >
            Your personal AI fitness companion that helps you track nutrition, generate personalized workout plans, and
            achieve your fitness goals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <GoogleSignInButton />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 flex justify-center"
        >
          <div className="w-full max-w-md">
            <LottiePlayer
              autoplay
              loop
              src="https://assets5.lottiefiles.com/packages/lf20_jqfghjh7.json"
              style={{ height: "400px", width: "100%" }}
            />
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powered by AI, Designed for You</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            FitAI combines cutting-edge artificial intelligence with personalized fitness tracking to help you achieve
            your health goals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Food Analysis",
              description: "Upload food images to get instant nutrition information and health scores.",
              icon: <Salad className="h-10 w-10 text-purple-600 dark:text-purple-400" />,
              delay: 0,
            },
            {
              title: "Diet Plans",
              description: "Get AI-generated meal plans tailored to your goals and preferences.",
              icon: <ChartMixedIcon className="h-10 w-10 text-purple-600 dark:text-purple-400" />,
              delay: 0.1,
            },
            {
              title: "Workout Plans",
              description: "Personalized exercise routines based on your fitness level and equipment.",
              icon: <Dumbbell className="h-10 w-10 text-purple-600 dark:text-purple-400" />,
              delay: 0.2,
            },
            {
              title: "AI Trainer",
              description: "Chat with your AI fitness coach for tips, motivation, and answers.",
              icon: <Brain className="h-10 w-10 text-purple-600 dark:text-purple-400" />,
              delay: 0.3,
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 + feature.delay }}
            >
              <Card className="h-full backdrop-blur-md bg-white/50 dark:bg-black/50 border-purple-100 dark:border-purple-900 hover:shadow-lg transition-shadow duration-300">
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="mb-4 p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="rounded-2xl overflow-hidden backdrop-blur-lg bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-200 dark:border-purple-800"
        >
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold mb-4">Ready to transform your fitness journey?</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Join FitAI today and experience the future of personalized fitness coaching.
              </p>
            </div>
            <div className="w-full max-w-xs">
              <LottiePlayer
                autoplay
                loop
                src="https://assets9.lottiefiles.com/packages/lf20_kkflmtur.json"
                style={{ height: "200px", width: "100%" }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 py-8 border-t border-purple-100 dark:border-purple-900">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              FitAI
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} FitAI. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm">
              Privacy
            </Button>
            <Button variant="ghost" size="sm">
              Terms
            </Button>
            <div className="flex gap-2">
              <a 
                href="mailto:guptasuryansh567@gmail.com" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 bg-transparent overflow-hidden text-ellipsis max-w-[180px] md:max-w-none"
              >
                guptasuryansh567@gmail.com
              </a>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  window.open("https://x.com/YesSuryansh", "_blank", "noopener,noreferrer");
                }}
              >
                X (@YesSuryansh)
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

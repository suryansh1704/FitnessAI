"use client"

import { useState, useEffect, useRef, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/AuthContext"
import { 
  Dumbbell, 
  Salad, 
  Brain, 
  Upload, 
  LineChartIcon, 
  Bell, 
  Search, 
  Home, 
  Settings, 
  LogOut, 
  Flame, 
  Trophy, 
  TrendingUp,
  Star 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarProvider
} from "@/components/ui/sidebar"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { serverTimestamp } from "firebase/firestore"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { format, startOfWeek, addDays } from 'date-fns';

// Lazy load non-critical components
const LottiePlayer = lazy(() => {
  const component = import("@/components/ui/lottie-player").then(mod => ({ default: mod.LottiePlayer }));
  // Trigger preload
  import("@/components/ui/lottie-player");
  return component;
});

interface MealOption {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore?: number;
  imageUrl?: string;
}

interface MealPlan {
  breakfast: MealOption[];
  lunch: MealOption[];
  dinner: MealOption[];
  snacks: MealOption[];
  loading?: boolean;
  error?: string;
}

interface WorkoutPlan {
  workout_name?: string;
  target_muscles?: string[];
  muscle_groups?: string[];
  calories_burned?: string | number;
  exercises?: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: string;
    muscle_group?: string;
    target_muscle?: string;
    instructions?: string;
  }>;
  notes?: string;
  error?: boolean;
  message?: string;
}

interface WeeklyWorkoutPlan {
  monday: WorkoutPlan | null;
  tuesday: WorkoutPlan | null;
  wednesday: WorkoutPlan | null;
  thursday: WorkoutPlan | null;
  friday: WorkoutPlan | null;
  saturday: WorkoutPlan | null;
  sunday: WorkoutPlan | null;
}

interface WeightLog {
  date: string;
  weight: number;
}

interface CalorieLog {
  date: string;
  calories: number;
}

interface WorkoutCompletion {
  date: string;
  completed: boolean;
  caloriesBurned: number;
}

interface CalorieBurnData {
  date: string;
  calories: number;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      delay: i * 0.1,
      duration: 0.5 
    } 
  })
}

// Add this constant at the top with other interfaces
const BACKUP_QUOTES = [
  "The only bad workout is the one that didn't happen. Every rep counts, every step matters.",
  "Your body can stand almost anything. It's your mind that you have to convince.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Fitness is not about being better than someone else. It's about being better than you used to be.",
  "Don't stop when you're tired. Stop when you're done.",
  "Your health is an investment, not an expense.",
  "The harder you work, the luckier you get.",
  "Success starts with self-discipline.",
  "The only person you are destined to become is the person you decide to be.",
  "Make your body the sexiest outfit you own."
];

export default function DashboardPage() {
  const { user, loading: authLoading, error } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [caloriesProgress, setCaloriesProgress] = useState(75)
  const [waterProgress, setWaterProgress] = useState(60)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI fitness trainer. How can I help you today?"
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [aiProvider, setAiProvider] = useState("gemini")
  const [foodInput, setFoodInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [foodAnalysisResult, setFoodAnalysisResult] = useState<any>(null)
  const [hasUserData, setHasUserData] = useState(false)
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false)
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [weeklyWorkoutPlan, setWeeklyWorkoutPlan] = useState<WeeklyWorkoutPlan>({
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null
  })
  const [weeklyStreak, setWeeklyStreak] = useState(0)
  const [weightData, setWeightData] = useState<WeightLog[]>([])
  const [calorieData, setCalorieData] = useState<CalorieLog[]>([])
  const [calorieBurnData, setCalorieBurnData] = useState<CalorieBurnData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    loading: false
  });
  const [selectedCategory, setSelectedCategory] = useState("breakfast");
  const [workoutCompletionToday, setWorkoutCompletionToday] = useState<boolean>(false);
  const [weeklyWorkoutCompletions, setWeeklyWorkoutCompletions] = useState<WorkoutCompletion[]>([]);
  const [motivationalQuote, setMotivationalQuote] = useState<string>("");

  // Get current day of the week
  const getCurrentDay = (): keyof WeeklyWorkoutPlan => {
    const days: (keyof WeeklyWorkoutPlan)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  }
  
  // Current day of the week
  const currentDay = getCurrentDay();

  // Handle authentication redirects and initial data load
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/")
    } else if (!authLoading && user) {
      // Set user data with minimal delay for smooth transition
      setTimeout(() => {
        setHasUserData(true)
      }, 100)
    }
  }, [user, authLoading, router])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Animate progress bars on component mount
  useEffect(() => {
    // In a real app, you would fetch the user's data from an API or database
    // For now, we're using a simulated "no data" state
    const timer = setTimeout(() => {
      if (hasUserData) {
        setCaloriesProgress(75)
        setWaterProgress(60)
      } else {
        setCaloriesProgress(0)
        setWaterProgress(0)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [hasUserData])

  // Check if user has existing data and initialize if needed
  useEffect(() => {
    // In a real app, we would fetch the user's profile from Firestore
    // For now, we'll automatically initialize with data
    if (user && !authLoading) {
      // Set default data state to true for better first-time user experience
      setHasUserData(true);
    }
  }, [user, authLoading]);

  // Load workout plan from Firebase
  useEffect(() => {
    const loadWorkoutPlanFromFirebase = async () => {
      if (!user) return;
      
      try {
        const db = getFirestore();
        const userWorkoutRef = doc(db, "userWorkouts", user.uid);
        const docSnap = await getDoc(userWorkoutRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          if (data.weeklyPlan) {
            console.log("Loaded workout plan from Firebase:", data.weeklyPlan);
            setWeeklyWorkoutPlan(data.weeklyPlan);
            
            // Always show current day's workout
            const today = getCurrentDay();
            setWorkoutPlan(data.weeklyPlan[today]);
            
            if (data.weeklyPlan[today]) {
              setHasUserData(true);
            }
          }
        } else {
          console.log("No workout plan found in Firebase");
        }
      } catch (error) {
        console.error("Error loading workout plan from Firebase:", error);
      }
    };
    
    if (user && !authLoading) {
      loadWorkoutPlanFromFirebase();
    }
  }, [user, authLoading]);

  // Add this effect to load weight and calorie data
  useEffect(() => {
    if (!user || !hasUserData) return;

    // Sample data for weight tracking
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const sampleWeightData = Array.from({ length: 30 }, (_, i) => ({
      date: format(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000), 'MMM dd'),
      weight: 70 + Math.sin(i * 0.2) + (Math.random() * 0.5 - 0.25) // More natural weight progression
    }));
    setWeightData(sampleWeightData);

    // Sample data for calorie tracking with target line
    const targetCalories = 2000; // Daily target
    const sampleCalorieData = Array.from({ length: 30 }, (_, i) => ({
      date: format(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000), 'MMM dd'),
      calories: 2000 + Math.sin(i * 0.3) * 300 + (Math.random() * 200 - 100), // More natural calorie progression
      target: targetCalories // Add target line
    }));
    setCalorieData(sampleCalorieData);
  }, [user, hasUserData]);

  // Function to get weekly workout stats
  const getWeeklyStats = () => {
    const completedWorkouts = weeklyWorkoutCompletions.filter(w => w.completed).length;
    const totalCaloriesBurned = weeklyWorkoutCompletions.reduce((sum, w) => sum + (w.completed ? w.caloriesBurned : 0), 0);
    return { completedWorkouts, totalCaloriesBurned };
  };

  // Function to fetch calorie burn data
  const fetchCalorieBurnData = async () => {
    if (!user) return;

    try {
      const db = getFirestore();
      const workoutCompletionRef = doc(db, "workoutCompletions", user.uid);
      const docSnap = await getDoc(workoutCompletionRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const calorieData: CalorieBurnData[] = [];
        
        for (let i = 0; i < 30; i++) {
          const date = new Date(thirtyDaysAgo);
          date.setDate(date.getDate() + i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayData = data[dateStr] || { completed: false, caloriesBurned: 0 };
          
          calorieData.push({
            date: format(date, 'MMM dd'),
            calories: dayData.caloriesBurned || 0
          });
        }

        setCalorieBurnData(calorieData);
      }
    } catch (error) {
      console.error("Error fetching calorie burn data:", error);
    }
  };

  // Effect to fetch calorie data when user or workout completion changes
  useEffect(() => {
    if (user && !authLoading) {
      fetchCalorieBurnData();
    }
  }, [user, authLoading, workoutCompletionToday]);

  // Function to update workout completion
  const updateWorkoutCompletion = async (completed: boolean) => {
    if (!user) return;

    try {
      const db = getFirestore();
      const today = format(new Date(), 'yyyy-MM-dd');
      const workoutCompletionRef = doc(db, "workoutCompletions", user.uid);

      // Calculate calories burned based on workout plan
      const caloriesBurned = completed ? (workoutPlan?.calories_burned ? 
        parseInt(workoutPlan.calories_burned.toString()) : 300) : 0;

      // Update workout completion for today
      await setDoc(workoutCompletionRef, {
        [`${today}`]: {
          completed,
          caloriesBurned,
          timestamp: serverTimestamp()
        }
      }, { merge: true });

      // Update local state
      setWorkoutCompletionToday(completed);
      
      // Fetch updated data
      await Promise.all([
        fetchWeeklyWorkoutCompletions(),
        fetchCalorieBurnData()
      ]);

      toast({
        title: completed ? "Workout Completed!" : "Workout Status Updated",
        description: completed ? "Great job on completing your workout!" : "Keep pushing, you got this!",
      });
    } catch (error) {
      console.error("Error updating workout completion:", error);
      toast({
        title: "Error",
        description: "Failed to update workout status",
        variant: "destructive",
      });
    }
  };

  // Function to fetch weekly workout completions
  const fetchWeeklyWorkoutCompletions = async () => {
    if (!user) return;

    try {
      const db = getFirestore();
      const workoutCompletionRef = doc(db, "workoutCompletions", user.uid);
      const docSnap = await getDoc(workoutCompletionRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const startOfCurrentWeek = startOfWeek(new Date());
        const weeklyData: WorkoutCompletion[] = [];

        for (let i = 0; i < 7; i++) {
          const date = format(addDays(startOfCurrentWeek, i), 'yyyy-MM-dd');
          const dayData = data[date] || { completed: false, caloriesBurned: 0 };
          weeklyData.push({
            date,
            completed: dayData.completed,
            caloriesBurned: dayData.caloriesBurned
          });
        }

        setWeeklyWorkoutCompletions(weeklyData);

        // Set today's completion status
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = data[today];
        setWorkoutCompletionToday(todayData?.completed || false);
      }
    } catch (error) {
      console.error("Error fetching workout completions:", error);
    }
  };

  // Function to fetch daily motivational quote
  const fetchDailyQuote = async () => {
    try {
      // Try to get a quote from the API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('https://api.quotable.io/random?tags=inspirational|success', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('API response not ok');
      
      const data = await response.json();
      setMotivationalQuote(data.content);
    } catch (error) {
      // If API fails, use a backup quote
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      const quoteIndex = dayOfYear % BACKUP_QUOTES.length;
      setMotivationalQuote(BACKUP_QUOTES[quoteIndex]);
    }
  };

  // Effect to fetch workout completions and quote on mount
  useEffect(() => {
    if (user && !authLoading) {
      fetchWeeklyWorkoutCompletions();
      fetchDailyQuote();
    }
  }, [user, authLoading]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // Add user message to chat
    const userMessage = { role: "user", content: inputMessage }
    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsSending(true)

    try {
      // Prepare the message history for the API
      const messageHistory = [
        {
          role: "system", 
          content: "You are an AI fitness trainer named FitAI. You provide helpful, concise, and accurate information about fitness, nutrition, workout plans, and health. Keep your responses friendly, motivational, and backed by scientific evidence where possible."
        },
        ...messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        })),
        {
          role: "user",
          content: inputMessage
        }
      ]

      // Add a timeout to prevent hanging request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      // Select API endpoint based on provider
      const endpoint = aiProvider === "openai" ? '/api/chat-openai' : '/api/chat';
      console.log(`Using ${aiProvider} provider for chat`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messageHistory }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Add AI response to chat
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.content 
      }]);
    } catch (error) {
      console.error("Error in chat:", error);
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `I'm currently experiencing connection issues. Please try again in a moment.` 
      }]);
      
      // Show error toast for better visibility
      toast({
        title: `Connection Error`,
        description: `Unable to connect to the AI service. Please check your configuration.`,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth)
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  const handleAnalyzeFood = async () => {
    if (!foodInput.trim()) return;
    
    setIsAnalyzing(true);
    setFoodAnalysisResult(null); // Clear previous results
    
    try {
      // Prepare the message for the API
      const messageToSend = [
        {
          role: "system", 
          content: "You are a nutrition expert. Analyze the following food items and provide detailed nutritional information including calories, protein, carbs, fat, and a health score from 0-100. Format your response as JSON."
        },
        {
          role: "user",
          content: `Analyze these food items: ${foodInput}`
        }
      ];

      // Using the same endpoint as the chat
      const endpoint = aiProvider === "openai" ? '/api/chat-openai' : '/api/chat';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messageToSend }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Try to parse the JSON from the response
      try {
        // The AI might return JSON with markdown code blocks, so we need to extract it
        const content = data.content;
        
        // Try to find JSON in code blocks or directly in the content
        let jsonString = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        
        if (jsonMatch && jsonMatch[1]) {
          jsonString = jsonMatch[1].trim();
        }
        
        // Clean up the string for better parsing reliability
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        // Parse the JSON
        let parsedResult;
        try {
          parsedResult = JSON.parse(jsonString);
        } catch (e) {
          // If direct parsing fails, try to extract just the JSON object
          const objectMatch = content.match(/{[\s\S]*?}/);
          if (objectMatch) {
            try {
              parsedResult = JSON.parse(objectMatch[0]);
            } catch (e2) {
              throw new Error("Could not parse JSON response");
            }
          } else {
            throw new Error("No valid JSON found in response");
          }
        }
        
        // Normalize the health score field if needed
        if (parsedResult.analysis?.health_score && typeof parsedResult.health_score === 'undefined') {
          parsedResult.health_score = parsedResult.analysis.health_score;
        }
        
        if (parsedResult.nutritional_information?.health_score && typeof parsedResult.health_score === 'undefined') {
          parsedResult.health_score = parsedResult.nutritional_information.health_score;
        }
        
        console.log("Parsed result:", parsedResult);
        setFoodAnalysisResult(parsedResult);
      } catch (parseError) {
        console.error("Error parsing food analysis result:", parseError);
        setFoodAnalysisResult({ 
          error: true, 
          message: "Could not parse the nutritional information" 
        });
      }
      
      // Show success toast
      toast({
        title: "Food Analysis Complete",
        description: "Check the results below for nutritional information.",
      });
      
    } catch (error) {
      console.error("Error analyzing food:", error);
      
      setFoodAnalysisResult({ 
        error: true, 
        message: "Failed to analyze food items. Please try again." 
      });
      
      toast({
        title: "Analysis Error",
        description: "Unable to analyze food items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to generate personalized workout plan
  const generateWorkoutPlan = async () => {
    setIsGeneratingWorkout(true);
    
    try {
      // In a real app, we would fetch the user's data from Firestore
      // For this demo, we'll use some mock data (in production, you'd get this from user profile)
      const userData = {
        height: 175, // cm
        weight: 70, // kg
        experienceLevel: "beginner", // beginner, intermediate, advanced
        fitnessGoals: ["strength", "general fitness"],
        workoutPreference: "gym"
      };
      
      // We'll use a simpler approach to generate a workout plan
      // This is more reliable than trying to parse complex JSON from the API
      
      // Create a backup workout plan that will be used as a template
      const backupWorkoutPlan = {
        monday: {
          workout_name: "Chest and Triceps",
          target_muscles: ["Chest", "Triceps"],
          calories_burned: "300-350",
          exercises: [
            {
              name: "Push-ups",
              sets: 3,
              reps: 10,
              target_muscle: "Chest",
              instructions: "Keep body straight, lower until chest nearly touches floor"
            },
            {
              name: "Bench Press",
              sets: 3,
              reps: 8,
              target_muscle: "Chest",
              instructions: "Keep back flat on bench, lower bar to mid-chest"
            },
            {
              name: "Tricep Dips",
              sets: 3,
              reps: 10,
              target_muscle: "Triceps",
              instructions: "Lower body until arms are at 90 degrees, then push back up"
            }
          ],
          notes: "Focus on form rather than weight. Rest 60-90 seconds between sets."
        },
        tuesday: {
          workout_name: "Back and Biceps",
          target_muscles: ["Back", "Biceps"],
          calories_burned: "300-350",
          exercises: [
            {
              name: "Dumbbell Rows",
              sets: 3,
              reps: 10,
              target_muscle: "Back",
              instructions: "Keep back straight, pull dumbbell to hip"
            },
            {
              name: "Lat Pulldowns",
              sets: 3,
              reps: 10,
              target_muscle: "Back",
              instructions: "Pull bar down to upper chest, squeeze shoulder blades"
            },
            {
              name: "Bicep Curls",
              sets: 3,
              reps: 12,
              target_muscle: "Biceps",
              instructions: "Keep elbows close to body, curl weights up"
            }
          ],
          notes: "Focus on controlled movements. Avoid swinging the weights."
        },
        wednesday: {
          workout_name: "Legs",
          target_muscles: ["Quads", "Hamstrings", "Glutes"],
          calories_burned: "400-450",
          exercises: [
            {
              name: "Bodyweight Squats",
              sets: 3,
              reps: 15,
              target_muscle: "Quads/Glutes",
              instructions: "Keep chest up, squat until thighs are parallel to floor"
            },
            {
              name: "Lunges",
              sets: 3,
              reps: 10,
              target_muscle: "Quads/Glutes",
              instructions: "Step forward, lower until both knees at 90 degrees"
            },
            {
              name: "Leg Press",
              sets: 3,
              reps: 12,
              target_muscle: "Quads/Hamstrings",
              instructions: "Press weight away without locking knees"
            }
          ],
          notes: "Warm up properly before leg day. Stretch after workout."
        },
        thursday: {
          workout_name: "Shoulders and Arms",
          target_muscles: ["Shoulders", "Arms"],
          calories_burned: "300-350",
          exercises: [
            {
              name: "Overhead Press",
              sets: 3,
              reps: 10,
              target_muscle: "Shoulders",
              instructions: "Press weights directly overhead, don't lock elbows"
            },
            {
              name: "Lateral Raises",
              sets: 3,
              reps: 12,
              target_muscle: "Shoulders",
              instructions: "Raise weights to shoulder height with slight elbow bend"
            },
            {
              name: "Tricep Extensions",
              sets: 3,
              reps: 12,
              target_muscle: "Triceps",
              instructions: "Keep upper arms stationary, extend forearms"
            }
          ],
          notes: "Use lighter weights with proper form for shoulder exercises."
        },
        friday: {
          workout_name: "Full Body",
          target_muscles: ["Full Body"],
          calories_burned: "350-400",
          exercises: [
            {
              name: "Burpees",
              sets: 3,
              reps: 10,
              target_muscle: "Full Body",
              instructions: "Complete movement from plank to jump with good form"
            },
            {
              name: "Mountain Climbers",
              sets: 3,
              reps: 20,
              target_muscle: "Core/Shoulders",
              instructions: "Keep hips level, alternate bringing knees to chest"
            },
            {
              name: "Bodyweight Squats",
              sets: 3,
              reps: 15,
              target_muscle: "Legs",
              instructions: "Keep weight in heels, chest up during movement"
            }
          ],
          notes: "Rest 30-45 seconds between exercises. Focus on keeping heart rate elevated."
        },
        saturday: {
          workout_name: "Active Recovery",
          target_muscles: ["Full Body"],
          calories_burned: "200-250",
          exercises: [
            {
              name: "Brisk Walking",
              sets: 1,
              reps: 30,
              target_muscle: "Full Body",
              instructions: "30 minutes at a moderate pace"
            },
            {
              name: "Light Stretching",
              sets: 1,
              reps: 5,
              target_muscle: "Full Body",
              instructions: "Hold each stretch for 30 seconds"
            },
            {
              name: "Foam Rolling",
              sets: 1,
              reps: 5,
              target_muscle: "Full Body",
              instructions: "Roll each muscle group for 1 minute"
            }
          ],
          notes: "Focus on recovery while keeping active."
        },
        sunday: {
          workout_name: "Rest Day",
          target_muscles: ["None"],
          calories_burned: "0",
          exercises: [],
          notes: "Complete rest day. Allow muscles to recover fully before next week."
        }
      };

      // Prepare a simple message for the API to enhance our workout plan based on user data
      const messageToSend = [
        {
          role: "system", 
          content: `You are a fitness expert. I will provide you with a basic workout plan template and user data. 
          Please suggest 1-2 alternative exercises for each day's workout, keeping the format simple.
          Respond with exercise names only, separated by commas. For example: "Monday: Cable Flyes, Incline Push-ups, Close-grip bench press"`
        },
        {
          role: "user",
          content: `Suggest alternative exercises for a ${userData.experienceLevel} with height ${userData.height}cm and weight ${userData.weight}kg who has these fitness goals: ${userData.fitnessGoals.join(", ")}. 
          Current workout plan:
          Monday (Chest/Triceps): Push-ups, Bench Press, Tricep Dips
          Tuesday (Back/Biceps): Dumbbell Rows, Lat Pulldowns, Bicep Curls
          Wednesday (Legs): Bodyweight Squats, Lunges, Leg Press
          Thursday (Shoulders/Arms): Overhead Press, Lateral Raises, Tricep Extensions
          Friday (Full Body): Burpees, Mountain Climbers, Bodyweight Squats
          Saturday (Active Recovery): Walking, Stretching, Foam Rolling
          Sunday: Rest Day`
        }
      ];

      // Using the chat endpoint to get alternative exercises
      const endpoint = aiProvider === "openai" ? '/api/chat-openai' : '/api/chat';
      
      console.log("Generating workout plan...");
      // Make the API call
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: messageToSend,
          provider: "gemini" 
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Now we have our template plan and potential alternative exercises
      const weeklyPlan = { ...backupWorkoutPlan } as WeeklyWorkoutPlan;
      
      // Try to extract suggested exercises from the response
      // If successful, we'll add them to our plan, but if not, we'll just use the template
      try {
        const content = data.content;
        console.log("API response:", content);
        
        // Extract exercise suggestions for each day
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        days.forEach(day => {
          const dayRegex = new RegExp(`${day}[^:]*:([^\\n]+)`, 'i');
          const match = content.match(dayRegex);
          
          if (match && match[1]) {
            const suggestedExercises = match[1].split(',').map((e: string) => e.trim());
            // Add 1-2 suggested exercises if they exist
            for (let i = 0; i < Math.min(suggestedExercises.length, 2); i++) {
              if (suggestedExercises[i] && weeklyPlan[day as keyof WeeklyWorkoutPlan]) {
                const currentDay = day as keyof WeeklyWorkoutPlan;
                const exerciseToAdd = {
                  name: suggestedExercises[i],
                  sets: 3,
                  reps: 10,
                  target_muscle: weeklyPlan[currentDay]?.target_muscles?.[0] || "Multiple",
                  instructions: `Perform ${suggestedExercises[i]} with proper form`
                };
                
                if (weeklyPlan[currentDay]?.exercises) {
                  weeklyPlan[currentDay]?.exercises?.push(exerciseToAdd);
                }
              }
            }
          }
        });
      } catch (error) {
        console.error("Error processing exercise suggestions:", error);
        // If any error occurs, we'll just continue with the template plan
      }
      
      // Set the weekly plan
      setWeeklyWorkoutPlan(weeklyPlan);
      
      // Set today's workout plan
      setWorkoutPlan(weeklyPlan[currentDay]);
      
      // Save to Firebase
      if (user) {
        try {
          const db = getFirestore();
          const userWorkoutRef = doc(db, "userWorkouts", user.uid);
          
          await setDoc(userWorkoutRef, {
            weeklyPlan: weeklyPlan,
            generatedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          console.log("Workout plan saved to Firebase");
        } catch (error) {
          console.error("Error saving workout plan to Firebase:", error);
        }
      }
      
      setHasUserData(true);
      
      toast({
        title: "Workout Plan Generated",
        description: "Your personalized workout plan is ready!",
      });
    } catch (error) {
      console.error("Error generating workout plan:", error);
      toast({
        title: "Error",
        description: "Could not generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWorkout(false);
    }
  };
  
  // Advanced function to extract and fix JSON from API response
  const extractAndFixJson = (content: string): any => {
    try {
      // Strategy 1: Check if the entire content is valid JSON
      try {
        return JSON.parse(content);
      } catch (e) {
        console.log("Full content is not valid JSON, trying to extract JSON...");
      }
      
      // Strategy 2: Try to extract JSON from code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonString = '';
      
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
        console.log("Extracted JSON from code block");
      } else {
        // Strategy 3: Look for anything that resembles JSON object with { }
        const objectMatch = content.match(/{[\s\S]*}/);
        if (objectMatch) {
          jsonString = objectMatch[0];
          console.log("Extracted JSON-like object from content");
        } else {
          console.error("No JSON-like content found");
          return null;
        }
      }
      
      // Apply multiple JSON fix-up strategies
      jsonString = fixJsonString(jsonString);
      
      // Try to parse the fixed JSON
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.error("Couldn't parse fixed JSON:", e);
        
        // Strategy 4: Try manual JSON construction from content
        return constructWorkoutPlanFromText(content);
      }
    } catch (e) {
      console.error("Failed to extract or fix JSON:", e);
      return null;
    }
  };
  
  // Function to fix common JSON syntax errors
  const fixJsonString = (jsonString: string): string => {
    // Remove any markdown formatting or extra backticks
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    // Fix 1: Remove trailing commas before closing brackets
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix 2: Add missing quotes around property names
    jsonString = jsonString.replace(/(\{|\,)\s*(\w+)\s*\:/g, '$1"$2":');
    
    // Fix 3: Fix quotes - replace smart quotes with straight quotes
    jsonString = jsonString.replace(/[""]/g, '"').replace(/['']/g, "'");
    
    // Fix 4: Fix boolean values - ensure they're lowercase
    jsonString = jsonString.replace(/:\s*True/g, ': true').replace(/:\s*False/g, ': false');
    
    // Fix 5: Add missing quotes around string values
    jsonString = jsonString.replace(/:(\s*)([^{\[\"\'\d\s\n][^,\s\n}]*)/g, ':"$2"');
    
    // Fix 6: Handle multiline strings - replace newlines in string values
    jsonString = jsonString.replace(/:\s*"([^"]*?)\\n(.*?)"/g, ':"$1 $2"');
    
    console.log("Fixed JSON string:", jsonString);
    return jsonString;
  };
  
  // Function to manually construct a workout plan from text if JSON parsing fails
  const constructWorkoutPlanFromText = (content: string): any => {
    console.log("Attempting to manually construct workout plan from text");
    
    // Check if the content contains mentions of days
    const hasWorkoutDays = 
      content.includes("monday") && 
      content.includes("tuesday") && 
      content.includes("wednesday");
    
    if (!hasWorkoutDays) {
      console.log("Content doesn't seem to contain workout days");
      return null;
    }
    
    // Create a minimal workout plan
    const weeklyPlan: WeeklyWorkoutPlan = {
      monday: extractDayWorkout(content, "monday"),
      tuesday: extractDayWorkout(content, "tuesday"),
      wednesday: extractDayWorkout(content, "wednesday"),
      thursday: extractDayWorkout(content, "thursday"),
      friday: extractDayWorkout(content, "friday"),
      saturday: extractDayWorkout(content, "saturday"),
      sunday: {
        workout_name: "Rest Day",
        target_muscles: ["None"],
        calories_burned: "0",
        exercises: [],
        notes: "Rest day. Focus on recovery."
      }
    };
    
    // Check if we were able to extract at least some days
    if (
      weeklyPlan.monday || 
      weeklyPlan.tuesday || 
      weeklyPlan.wednesday || 
      weeklyPlan.thursday || 
      weeklyPlan.friday || 
      weeklyPlan.saturday
    ) {
      console.log("Successfully constructed partial workout plan from text");
      return weeklyPlan;
    }
    
    return null;
  };
  
  // Helper function to extract workout info for a specific day from text
  const extractDayWorkout = (content: string, day: string): WorkoutPlan | null => {
    try {
      // Convert to lowercase and find section for the day
      const lowerContent = content.toLowerCase();
      const dayIndex = lowerContent.indexOf(day);
      
      if (dayIndex === -1) return null;
      
      // Extract the section (rough approximation)
      const nextDayIndex = lowerContent.indexOf(getNextDay(day), dayIndex + day.length);
      const section = nextDayIndex !== -1 
        ? content.substring(dayIndex, nextDayIndex)
        : content.substring(dayIndex);
      
      // Extract workout name
      const workoutNameMatch = section.match(/(workout|routine|training)[\s:]+([\w\s&]+)/i);
      const workoutName = workoutNameMatch ? workoutNameMatch[2].trim() : `${day.charAt(0).toUpperCase() + day.slice(1)} Workout`;
      
      // Extract target muscles
      const muscleMatch = section.match(/(target|muscles|focus)[\s:]+([\w\s,&/]+)/i);
      const targetMuscles = muscleMatch 
        ? muscleMatch[2].split(/[,&/]/).map(m => m.trim()).filter(m => m.length > 0)
        : [workoutName.split(' ')[0]]; // Default to first word of workout name
      
      // Extract calories
      const caloriesMatch = section.match(/(\d+)[\s-]*(\d*)\s*calories/i);
      const caloriesBurned = caloriesMatch 
        ? caloriesMatch[2] ? `${caloriesMatch[1]}-${caloriesMatch[2]}` : caloriesMatch[1]
        : "300-400";
      
      // Try to extract exercises (simplified)
      const exercises = [];
      const exerciseMatches = section.match(/(\d+\.\s*[\w\s-]+)/g);
      
      if (exerciseMatches) {
        for (let i = 0; i < Math.min(exerciseMatches.length, 5); i++) {
          const exerciseName = exerciseMatches[i].replace(/^\d+\.\s*/, '').trim();
          exercises.push({
            name: exerciseName,
            sets: 3,
            reps: 10,
            target_muscle: targetMuscles[0],
            instructions: `Perform ${exerciseName} with proper form`
          });
        }
      }
      
      // If no exercises found but we have a workout name, create at least one exercise
      if (exercises.length === 0 && workoutName) {
        const defaultExercise = workoutName.split(' ')[0];
        exercises.push({
          name: defaultExercise,
          sets: 3,
          reps: 10,
          target_muscle: targetMuscles[0],
          instructions: `Perform ${defaultExercise} with proper form`
        });
      }
      
      return {
        workout_name: workoutName,
        target_muscles: targetMuscles,
        calories_burned: caloriesBurned,
        exercises: exercises,
        notes: `Focus on proper form for all ${day}'s exercises.`
      };
      } catch (e) {
      console.error(`Error extracting ${day} workout:`, e);
      return null;
    }
  };
  
  // Helper function to get the next day of the week
  const getNextDay = (day: string): string => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const index = days.indexOf(day);
    return index < days.length - 1 ? days[index + 1] : "";
  };

  // Function to generate meal plan options using Gemini API
  const generateMealPlan = async (category: string = "all") => {
    setMealPlan(prev => ({ ...prev, loading: true, error: undefined }));
    
    // Define empty meal plan structure for single category requests
    const emptyMealPlan: MealPlan = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: []
    };
    
    // Define backup meal plans in case API fails
    const backupMealPlans: MealPlan = {
      breakfast: [
        { name: "Oatmeal with Berries", description: "Quick and simple breakfast", calories: 350, protein: 10, carbs: 60, fat: 10 },
        { name: "Whole Wheat Toast with Peanut Butter", description: "Simple toast with spread", calories: 280, protein: 12, carbs: 32, fat: 12 }
      ],
      lunch: [
        { name: "Veggie Wrap", description: "Fresh vegetables in a whole wheat wrap", calories: 320, protein: 8, carbs: 50, fat: 8 },
        { name: "Lentil Soup", description: "Hearty and protein-rich soup", calories: 250, protein: 15, carbs: 30, fat: 5 }
      ],
      dinner: [
        { name: "Pasta with Marinara", description: "Simple pasta dish", calories: 450, protein: 15, carbs: 75, fat: 10 },
        { name: "Bean and Rice Bowl", description: "Complete protein meal", calories: 400, protein: 15, carbs: 65, fat: 8 }
      ],
      snacks: [
        { name: "Apple and Peanut Butter", description: "Sweet and satisfying snack", calories: 200, protein: 5, carbs: 25, fat: 8 },
        { name: "Trail Mix", description: "Nuts and dried fruits", calories: 250, protein: 6, carbs: 20, fat: 15 }
      ]
    };
    
    try {
      // Set a longer timeout (20 seconds) for meal plan generation
      const timeoutPromise = new Promise<MealPlan>((_, reject) => 
        setTimeout(() => reject(new Error("Meal plan generation took too long")), 20000)
      );
      
      // Define the prompts for the AI
      const messages = [
        {
          role: "system", 
          content: `You are a nutrition expert. Generate a meal plan with these specific requirements:
            
            1. Use ONLY very common and easily accessible ingredients that most households have
            2. DO NOT include: avocados, pork, fish, eggs, quinoa, chia seeds, or any exotic/hard-to-find items
            3. Format each meal option clearly:
               - Start each meal with a number (1., 2., etc.)
               - Put the meal name on its own line (no asterisks)
               - Include nutritional info in this format: Calories: 350 cal, Protein: 15g, Carbs: 45g, Fat: 12g
            4. Keep all recipes simple and quick to prepare
            
            Provide 2-3 clear options for each meal category requested.`
        },
        {
          role: "user",
          content: category === "all" 
            ? "Create meal plan options for breakfast, lunch, dinner and snacks using only common, accessible ingredients. For each category, provide 2-3 different options."
            : `Create meal plan options for ${category} using only common, accessible ingredients. Provide 3-4 different options.`
        }
      ];

      // Main API function that gets meal plan from AI
      const fetchMealPlanPromise = fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch meal plan: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("API Response:", data);
        
        if (!data || !data.content) {
          throw new Error("Invalid response from API");
        }
        
        // Extract meal options from the AI response
        const extractMealOptionsFromText = (text: string, category: string): MealOption[] => {
          const options: MealOption[] = [];
          const mealSectionRegex = new RegExp(`${category}[^:]*?(?:\\n|:)([\\s\\S]*?)(?=(?:\\n\\*\\*|$))`, 'i');
          const mealSectionMatch = text.match(mealSectionRegex);
          const mealSection = mealSectionMatch && mealSectionMatch[1] ? mealSectionMatch[1] : text;
          
          // Split by numbered list markers (1., 2., 3.) to get individual meals
          const mealItems = mealSection.split(/\n\d+\./).filter(Boolean);
          
          for (let item of mealItems) {
            // Skip empty items
            if (!item.trim()) continue;
            
            // Get the first line as the meal name (the line immediately after the number)
            const lines = item.trim().split('\n');
            if (lines.length < 1) continue;
            
            // The first line is the meal name
            const name = lines[0].replace(/\*/g, '').trim();
            
            // Skip if it's obviously not a meal name
            if (name.toLowerCase() === 'approx' || 
                /^\d+\s*(?:kcal|cal|calories)$/.test(name) || 
                /^\d+g$/.test(name) ||
                /^note:?$/i.test(name) ||
                name.length < 3) {
              continue;
            }
            
            // Look for nutritional information in the text
            const caloriesMatch = item.match(/(?:calories|cals|kcal|cal)(?:\s*:|:?\s+)(\d+)/i);
            const proteinMatch = item.match(/protein(?:\s*:|:?\s+)(\d+)(?:g|grams)?/i);
            const carbsMatch = item.match(/(?:carbs|carbohydrates)(?:\s*:|:?\s+)(\d+)(?:g|grams)?/i);
            const fatMatch = item.match(/fat(?:\s*:|:?\s+)(\d+)(?:g|grams)?/i);
            
            // Create a description from other content
            const description = lines.length > 1 ? lines.slice(1).join(' ').replace(/(?:calories|protein|carbs|carbohydrates|fat):.+/gi, '').trim() : `${name} with common ingredients`;
            
            // Ensure we have realistic nutritional values
            const calories = caloriesMatch && caloriesMatch[1] ? parseInt(caloriesMatch[1]) : 350;
            const protein = proteinMatch && proteinMatch[1] ? parseInt(proteinMatch[1]) : 15;
            const carbs = carbsMatch && carbsMatch[1] ? parseInt(carbsMatch[1]) : 30;
            const fat = fatMatch && fatMatch[1] ? parseInt(fatMatch[1]) : 12;
            
            // Add the meal with nutritional info - ensure minimum values for nutrients
            options.push({
              name,
              description,
              calories,
              protein,
              carbs,
              fat
            });
          }
          
          return options;
        };
        
        // Extract meal options for each category
        if (category === "all") {
          return {
            breakfast: extractMealOptionsFromText(data.content, "Breakfast"),
            lunch: extractMealOptionsFromText(data.content, "Lunch"),
            dinner: extractMealOptionsFromText(data.content, "Dinner"),
            snacks: extractMealOptionsFromText(data.content, "Snack")
          };
        } else {
          return {
            ...emptyMealPlan,
            [category.toLowerCase()]: extractMealOptionsFromText(data.content, category)
          };
        }
      });
      
      // Race between our API call and the timeout
      const result = await Promise.race([fetchMealPlanPromise, timeoutPromise]);
      
          setMealPlan(prev => ({
            ...prev,
        ...result,
            loading: false
          }));
        
    } catch (error) {
      console.error("Error generating meal plan:", error);
      
      // If we have a timeout error, use the backup plans
      setMealPlan({
        ...backupMealPlans,
        error: `Error generating meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        loading: false
      });
    }
  };

  // If loading, show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-purple-600 dark:border-purple-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    router.replace("/")
    return null
  }

  // Only show the dashboard if authenticated
  if (!user && !authLoading) {
    router.push("/")
    return null
  }

  // Generate avatar initials from user display name or email
  const getInitials = () => {
    if (user.displayName) {
      return user.displayName
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return "FI" // FitAI default
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-950 dark:to-purple-950">
        {/* Sidebar */}
        <Sidebar variant="floating" collapsible="icon" className="border-r border-purple-100 dark:border-purple-900">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2">
              <Dumbbell className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                FitAI
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "overview"}
                  onClick={() => setActiveTab("overview")}
                  tooltip="Overview"
                  className="transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <Home className="h-5 w-5" />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab("nutrition")} 
                  tooltip="Nutrition"
                  isActive={activeTab === "nutrition"}
                  className="transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <Salad className="h-5 w-5" />
                  <span>Nutrition</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab("ai-trainer")} 
                  tooltip="AI Trainer"
                  isActive={activeTab === "ai-trainer"}
                  className="transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <Brain className="h-5 w-5" />
                  <span>AI Trainer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab("progress")} 
                  tooltip="Progress"
                  isActive={activeTab === "progress"}
                  className="transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <LineChartIcon className="h-5 w-5" />
                  <span>Progress</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigateTo("/profile")} 
                  tooltip="Profile"
                  className="transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout} 
                  tooltip="Logout"
                  className="transition-all hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-purple-100 dark:border-purple-900/50 shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-xl font-semibold hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <Bell className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-2 ring-purple-200 dark:ring-purple-800 hover:ring-purple-300 dark:hover:ring-purple-700 transition-all">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-purple-100 dark:border-purple-900">
                    <DropdownMenuLabel className="font-medium">{user.displayName || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigateTo("/profile")} className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30">
                      <Trophy className="mr-2 h-4 w-4 text-amber-500" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("settings")} className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30">
                      <Settings className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30">
                      <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                      <span>Subscription</span>
                      <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white">PRO</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30">
                      <LogOut className="mr-2 h-4 w-4 text-red-500" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-4 sm:w-[400px] md:w-[600px] text-xs sm:text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="ai-trainer">AI Trainer</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="grid grid-cols-1 gap-4 sm:gap-6"
                >
                  <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible">
                    <Card className="border-purple-100 dark:border-purple-900/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <div className="flex items-center">
                            <Dumbbell className="h-5 w-5 mr-2 text-purple-500" />
                            <h2 className="text-2xl font-bold">Your Workout Plan</h2>
                          </div>
                        </CardTitle>
                        <CardDescription>Your personalized workout for maximum results</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isGeneratingWorkout ? (
                          <div className="flex justify-center items-center h-[300px]">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                          </div>
                        ) : workoutPlan ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mt-4"
                          >
                            {/* Current day workout display with enhanced visuals */}
                            <div className="mb-4 flex items-center justify-between">
                              <Badge className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <span className="capitalize">{currentDay}'s Workout</span>
                              </Badge>
                              <Badge className="text-sm font-medium bg-gradient-to-br from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full shadow-sm">
                                ~{workoutPlan.calories_burned} calories
                              </Badge>
                            </div>

                            <Card className="overflow-hidden border-none shadow-xl relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 opacity-80 z-0"></div>
                              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-300/20 to-pink-300/20 dark:from-purple-700/20 dark:to-pink-700/20 blur-xl"></div>
                              <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-300/20 to-cyan-300/20 dark:from-blue-700/20 dark:to-cyan-700/20 blur-xl"></div>
                              
                              <CardHeader className="relative z-10">
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2, duration: 0.5 }}
                                >
                                  <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">{workoutPlan.workout_name}</CardTitle>
                                  <CardDescription className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                                    <span className="inline-flex items-center">
                                      <Flame className="h-4 w-4 mr-1 text-amber-500" />
                                      Target: {workoutPlan.target_muscles?.join(", ")}
                                    </span>
                                  </CardDescription>
                                </motion.div>
                              </CardHeader>
                              
                              <CardContent className="relative z-10 pb-6">
                                <div className="space-y-4">
                                  {workoutPlan.exercises?.map((exercise, index) => (
                                    <motion.div 
                                      key={index} 
                                      className="border border-purple-100 dark:border-purple-800/50 rounded-lg p-4 hover:shadow-md backdrop-blur-sm hover:border-purple-300 dark:hover:border-purple-700/70 transition-all duration-200 hover:bg-white/90 dark:hover:bg-gray-800/90"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                                      whileHover={{ scale: 1.01, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                                    >
                                      <div className="flex justify-between">
                                        <div>
                                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">{exercise.name}</h4>
                                          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mt-1">
                                            {exercise.target_muscle}
                                          </p>
                                        </div>
                                        <div className="flex flex-col items-end space-y-1">
                                          <div className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                                            {exercise.sets} sets × {exercise.reps} reps
                                          </div>
                                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700">
                                            {exercise.sets * exercise.reps > 36 ? "Advanced" : 
                                             exercise.sets * exercise.reps > 24 ? "Intermediate" : "Beginner"}
                                          </Badge>
                                        </div>
                                      </div>
                                      {exercise.instructions && (
                                        <p className="text-sm mt-3 text-gray-600 dark:text-gray-400 bg-purple-50/50 dark:bg-purple-900/20 p-2 rounded border-l-2 border-purple-300 dark:border-purple-500">
                                          {exercise.instructions}
                                        </p>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                                
                                {workoutPlan.notes && (
                                  <motion.div 
                                    className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border-l-4 border-amber-400 dark:border-amber-600"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                  >
                                    <h4 className="font-medium flex items-center text-amber-700 dark:text-amber-400">
                                      <Trophy className="h-4 w-4 mr-2" />
                                      Pro Tips
                                    </h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">{workoutPlan.notes}</p>
                                  </motion.div>
                                )}

                                {/* Add Workout Completion Section */}
                                <motion.div 
                                  className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.6, duration: 0.5 }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-purple-700 dark:text-purple-400">
                                        Did you complete today's workout?
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <Button
                                        variant={workoutCompletionToday ? "default" : "outline"}
                                        size="sm"
                                        className={`${
                                          workoutCompletionToday 
                                            ? "bg-green-500 hover:bg-green-600" 
                                            : "hover:bg-green-50 dark:hover:bg-green-900/30"
                                        }`}
                                        onClick={() => updateWorkoutCompletion(true)}
                                      >
                                        Yes
                                      </Button>
                                      <Button
                                        variant={!workoutCompletionToday ? "default" : "outline"}
                                        size="sm"
                                        className={`${
                                          !workoutCompletionToday 
                                            ? "bg-red-500 hover:bg-red-600" 
                                            : "hover:bg-red-50 dark:hover:bg-red-900/30"
                                        }`}
                                        onClick={() => updateWorkoutCompletion(false)}
                                      >
                                        No
                                      </Button>
                                    </div>
                                  </div>
                                  {workoutCompletionToday && (
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                      🎉 Great job completing your workout today!
                                    </p>
                                  )}
                                </motion.div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px] border border-dashed rounded-md p-8 mt-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 backdrop-blur-sm">
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-5 shadow-md">
                                <Dumbbell className="h-12 w-12 text-white" />
                              </div>
                            </motion.div>
                            <h3 className="text-lg font-medium mt-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">Ready to Crush Your Workout?</h3>
                            <p className="text-sm text-muted-foreground text-center mt-2 max-w-sm">
                              Generate a personalized workout plan tailored to your fitness goals, experience level, and available equipment.
                            </p>
                            <Button 
                              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-medium px-6 py-2 rounded-full shadow-md transition-all hover:shadow-lg"
                              onClick={generateWorkoutPlan}
                              disabled={isGeneratingWorkout}
                            >
                              {isGeneratingWorkout ? (
                                <>
                                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Generating...
                                </>
                              ) : (
                                "Generate My Workout Plan"
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <motion.div custom={3} variants={fadeIn} initial="hidden" animate="visible">
                    <Card className="md:col-span-1 border-purple-100 dark:border-purple-900/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">Today's Plan</CardTitle>
                        <CardDescription>Your personalized schedule for today</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-start gap-4"
                        >
                          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 p-2 rounded-md border border-purple-100 dark:border-purple-800">
                            <Salad className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-medium">Breakfast</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Greek yogurt with berries and honey
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">320 calories</p>
                          </div>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-start gap-4"
                        >
                          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 p-2 rounded-md border border-purple-100 dark:border-purple-800">
                            <Dumbbell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-medium">Workout</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Upper body strength training - 45 min
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">10:30 AM</p>
                          </div>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                          className="flex items-start gap-4"
                        >
                          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 p-2 rounded-md border border-purple-100 dark:border-purple-800">
                            <Salad className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-medium">Lunch</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Grilled chicken salad with avocado</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">450 calories</p>
                          </div>
                        </motion.div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800">
                          View Full Schedule
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>

                  <motion.div custom={4} variants={fadeIn} initial="hidden" animate="visible">
                    <Card className="md:col-span-1 border-purple-100 dark:border-purple-900/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                        <CardDescription>Common tasks to help you stay on track</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <Button className="flex flex-col items-center justify-center h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-100 dark:border-purple-800 hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-md transition-all" onClick={() => setActiveTab("nutrition")}>
                          <Upload className="h-6 w-6 mb-2 text-blue-500" />
                          <span>Log Food</span>
                        </Button>
                        <Button className="flex flex-col items-center justify-center h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-100 dark:border-purple-800 hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-md transition-all" onClick={() => setActiveTab("ai-trainer")}>
                          <Brain className="h-6 w-6 mb-2 text-pink-500" />
                          <span>Ask AI</span>
                        </Button>
                        <Button className="flex flex-col items-center justify-center h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-100 dark:border-purple-800 hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-md transition-all" onClick={() => setActiveTab("progress")}>
                          <LineChartIcon className="h-6 w-6 mb-2 text-green-500" />
                          <span>Track Progress</span>
                        </Button>
                        <Button className="flex flex-col items-center justify-center h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-100 dark:border-purple-800 hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-md transition-all" onClick={() => navigateTo("/profile")}>
                          <Settings className="h-6 w-6 mb-2 text-purple-500" />
                          <span>Settings</span>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
                
                {/* Toggle button for demo purposes */}
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setHasUserData(!hasUserData);
                      // Clear workout plan when toggling to no-data state
                      if (hasUserData) {
                        setWorkoutPlan(null);
                      }
                    }}
                    className="text-sm border-purple-200 dark:border-purple-800"
                  >
                    {hasUserData ? "Show empty state (no data)" : "Show example data"}
                  </Button>
                </div>
              </TabsContent>

              {/* Nutrition Tab */}
              <TabsContent value="nutrition" className="space-y-4 sm:space-y-6">
                <Card className="border-purple-100 dark:border-purple-900/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-lg flex items-center">
                      <Salad className="h-5 w-5 mr-2 text-green-500" />
                      Food Analysis
                    </CardTitle>
                    <CardDescription>Enter a food item to get nutrition information and health score</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                          placeholder="Enter food items (e.g. grilled chicken with rice and vegetables)" 
                          className="flex-1"
                          value={foodInput}
                          onChange={(e) => setFoodInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAnalyzeFood();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleAnalyzeFood}
                          disabled={isAnalyzing}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all w-full sm:w-auto"
                        >
                          {isAnalyzing ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            "Analyze"
                          )}
                        </Button>
                      </div>
                      
                      {foodAnalysisResult && (
                        <div className="border rounded-md p-4">
                          <h3 className="font-medium text-sm mb-2">Nutritional Analysis:</h3>
                          
                          {foodAnalysisResult.error ? (
                            <p className="text-red-500">{foodAnalysisResult.message}</p>
                          ) : (
                            <div className="space-y-3">
                              {/* Food Item Header */}
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  {typeof foodAnalysisResult.food_items === 'string' 
                                    ? foodAnalysisResult.food_items 
                                    : typeof foodAnalysisResult.food_item === 'string'
                                      ? foodAnalysisResult.food_item
                                      : foodInput}
                                </span>
                                {typeof foodAnalysisResult.health_score === 'number' && (
                                  <Badge className={`${
                                    foodAnalysisResult.health_score > 80 ? "bg-green-500" :
                                    foodAnalysisResult.health_score > 60 ? "bg-yellow-500" : "bg-red-500"
                                  }`}>
                                    {foodAnalysisResult.health_score > 80 ? "Healthy" :
                                     foodAnalysisResult.health_score > 60 ? "Moderate" : "Less Healthy"}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Nutritional Information */}
                              <div className="grid grid-cols-4 gap-2 mt-2 text-sm">
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Calories</span>
                                  <p className="font-medium">
                                    {typeof foodAnalysisResult.analysis?.calories?.value === 'number' 
                                      ? foodAnalysisResult.analysis.calories.value 
                                      : typeof foodAnalysisResult.nutritional_information?.calories?.value === 'number'
                                        ? foodAnalysisResult.nutritional_information.calories.value
                                        : typeof foodAnalysisResult.nutritional_information?.calories === 'number'
                                          ? foodAnalysisResult.nutritional_information.calories
                                          : typeof foodAnalysisResult.calories === 'number'
                                            ? foodAnalysisResult.calories
                                            : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Protein</span>
                                  <p className="font-medium">
                                    {typeof foodAnalysisResult.analysis?.protein?.value === 'number' 
                                      ? `${foodAnalysisResult.analysis.protein.value}g` 
                                      : typeof foodAnalysisResult.nutritional_information?.protein?.value === 'number'
                                        ? `${foodAnalysisResult.nutritional_information.protein.value}g`
                                        : typeof foodAnalysisResult.nutritional_information?.protein === 'number'
                                          ? `${foodAnalysisResult.nutritional_information.protein}g`
                                          : typeof foodAnalysisResult.protein === 'number'
                                            ? `${foodAnalysisResult.protein}g`
                                            : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Carbs</span>
                                  <p className="font-medium">
                                    {typeof foodAnalysisResult.analysis?.carbohydrates?.value === 'number' 
                                      ? `${foodAnalysisResult.analysis.carbohydrates.value}g` 
                                      : typeof foodAnalysisResult.nutritional_information?.carbohydrates?.value === 'number'
                                        ? `${foodAnalysisResult.nutritional_information.carbohydrates.value}g`
                                        : typeof foodAnalysisResult.nutritional_information?.carbs === 'number'
                                          ? `${foodAnalysisResult.nutritional_information.carbs}g`
                                          : typeof foodAnalysisResult.carbs === 'number'
                                            ? `${foodAnalysisResult.carbs}g`
                                            : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Fat</span>
                                  <p className="font-medium">
                                    {typeof foodAnalysisResult.analysis?.fat?.value === 'number' 
                                      ? `${foodAnalysisResult.analysis.fat.value}g` 
                                      : typeof foodAnalysisResult.nutritional_information?.fat?.value === 'number'
                                        ? `${foodAnalysisResult.nutritional_information.fat.value}g`
                                        : typeof foodAnalysisResult.nutritional_information?.fat === 'number'
                                          ? `${foodAnalysisResult.nutritional_information.fat}g`
                                          : typeof foodAnalysisResult.fat === 'number'
                                            ? `${foodAnalysisResult.fat}g`
                                            : "N/A"}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Health Score */}
                              {typeof foodAnalysisResult.health_score === 'number' && (
                                <div className="pt-2 border-t">
                                  <span className="text-sm font-medium">Health Score:</span>
                                  <div className="flex items-center mt-1">
                                    <Progress value={foodAnalysisResult.health_score} className="h-2 flex-1 bg-gray-200 dark:bg-gray-700">
                                      <div 
                                        className={`h-full rounded-full ${
                                          foodAnalysisResult.health_score > 80 ? "bg-gradient-to-r from-green-500 to-green-300" :
                                          foodAnalysisResult.health_score > 60 ? "bg-gradient-to-r from-yellow-500 to-yellow-300" : 
                                          "bg-gradient-to-r from-red-500 to-red-300"
                                        }`} 
                                        style={{ width: `${foodAnalysisResult.health_score}%` }} 
                                      />
                                    </Progress>
                                    <span className="ml-2 text-sm font-medium">{foodAnalysisResult.health_score}/100</span>
                                  </div>
                                  
                                  {/* Analysis Notes */}
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {typeof foodAnalysisResult.analysis?.notes === 'string'
                                      ? foodAnalysisResult.analysis.notes
                                      : typeof foodAnalysisResult.nutritional_information?.notes === 'string'
                                        ? foodAnalysisResult.nutritional_information.notes
                                        : typeof foodAnalysisResult.notes === 'string'
                                          ? foodAnalysisResult.notes
                                          : "No additional information available."}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!foodAnalysisResult && !isAnalyzing && (
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enter any food items above to get detailed nutritional information and health scores.
                          </p>
                        </div>
                      )}
                      
                      {isAnalyzing && (
                        <div className="border rounded-md p-6 text-center">
                          <div className="inline-flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Analyzing nutritional information...
                          </p>
                        </div>
                      )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Diet Plan Generator</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => generateMealPlan("all")}
                        disabled={mealPlan.loading}
                        className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                      >
                        {mealPlan.loading ? (
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : null}
                        Generate All Options
                      </Button>
                    </CardTitle>
                    <CardDescription>Get meal options using common, everyday ingredients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs 
                      defaultValue={selectedCategory} 
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
                        <TabsTrigger value="lunch">Lunch</TabsTrigger>
                        <TabsTrigger value="dinner">Dinner</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-4 border rounded-md">
                        <div className="p-4 border-b flex items-center justify-between">
                          <h3 className="font-medium capitalize">{selectedCategory} Options</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => generateMealPlan(selectedCategory)}
                            disabled={mealPlan.loading}
                          >
                            {mealPlan.loading ? (
                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : null}
                            Refresh Options
                          </Button>
                        </div>
                        
                        <div className="p-4">
                          {mealPlan.loading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                              <p className="text-sm text-gray-500">Generating meal options...</p>
                            </div>
                          ) : mealPlan.error ? (
                            <div className="text-center py-8 text-red-500">{mealPlan.error}</div>
                          ) : mealPlan[selectedCategory as keyof Pick<MealPlan, 'breakfast' | 'lunch' | 'dinner' | 'snacks'>].length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <p>No meal options generated yet.</p>
                              <p className="text-sm mt-2">Click the button above to generate options.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {mealPlan[selectedCategory as keyof Pick<MealPlan, 'breakfast' | 'lunch' | 'dinner' | 'snacks'>].map((meal, idx) => (
                                <div key={idx} className="border rounded-md p-4 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold">{meal.name}</h4>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                      {meal.calories} cal
                                    </Badge>
                                  </div>
                                  <div className="flex gap-4 mt-4 text-sm">
                                    <div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Protein</span>
                                      <p className="font-medium">{meal.protein}g</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Carbs</span>
                                      <p className="font-medium">{meal.carbs}g</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Fat</span>
                                      <p className="font-medium">{meal.fat}g</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t pt-4">
                    {/* Buttons removed */}
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Other tabs would be implemented similarly */}
              <TabsContent value="ai-trainer">
                <Card className="h-[600px] flex flex-col border-purple-100 dark:border-purple-900/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-purple-500" />
                        Chat with AI Trainer
                      </div>
                      <div className="hidden">
                        <Select value={aiProvider} onValueChange={setAiProvider}>
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder="AI Provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini">AI Model 1</SelectItem>
                            <SelectItem value="openai">AI Model 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Ask questions about fitness, nutrition, or get personalized advice.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto border rounded-md p-4 space-y-4">
                    {messages.map((message, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.3 }}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                      >
                        {message.role === "assistant" && (
                          <Avatar>
                            <AvatarImage src="/ai-avatar.png" />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">AI</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`p-3 rounded-lg max-w-[80%] ${
                          message.role === "user" 
                            ? "bg-purple-100 dark:bg-purple-900/30" 
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === "user" && (
                          <Avatar>
                            <AvatarImage src={user?.photoURL || undefined} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">{getInitials()}</AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                    {isSending && (
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarImage src="/ai-avatar.png" />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">AI</AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t p-4">
                    <div className="flex w-full gap-2">
                      <Input 
                        placeholder="Type your message..." 
                        className="flex-1 bg-white/80 dark:bg-gray-900/50 focus-visible:ring-purple-500"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSending}
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all"
                        disabled={isSending || !inputMessage.trim()}
                      >
                        {isSending ? (
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="progress">
                <div className="grid grid-cols-1 gap-6">
                  <Card className="border-purple-100 dark:border-purple-900/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-green-500" />
                        Calorie Burn Progress
                      </CardTitle>
                      <CardDescription>Track your daily calorie burn from workouts</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={calorieBurnData} 
                          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            className="opacity-30"
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: '#ccc', strokeWidth: 1 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            domain={[0, (dataMax: number) => Math.ceil(dataMax / 300) * 300]}
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: '#ccc', strokeWidth: 1 }}
                            label={{ 
                              value: 'Calories Burned', 
                              angle: -90, 
                              position: 'insideLeft', 
                              fill: '#666',
                              offset: 50  // Increased offset
                            }}
                            width={60}  // Increased width
                            ticks={[0, 300, 600, 900, 1200, 1500]}  // Fixed intervals of 300
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            labelStyle={{ color: '#666', fontWeight: 'bold', marginBottom: '4px' }}
                            formatter={(value: number) => [`${value} cal`, 'Calories Burned']}
                          />
                          <Area
                            type="monotone"
                            dataKey="calories"
                            name="Calories Burned"
                            stroke="#82ca9d"
                            strokeWidth={3}
                            fill="url(#calorieGradient)"
                            fillOpacity={0.6}
                            dot={false}
                            activeDot={{ r: 8, fill: '#82ca9d', stroke: 'white', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-100 dark:border-purple-900/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Weekly Progress
                      </CardTitle>
                      <CardDescription>Your fitness achievements this week</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Dumbbell className="h-5 w-5 text-purple-500" />
                            <h3 className="font-medium">Workouts</h3>
                          </div>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {getWeeklyStats().completedWorkouts}/7
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Days this week</p>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Flame className="h-5 w-5 text-green-500" />
                            <h3 className="font-medium">Total Calories Burned</h3>
                          </div>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {getWeeklyStats().totalCaloriesBurned}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">This week</p>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-5 w-5 text-blue-500" />
                          <h3 className="font-medium">Daily Motivation</h3>
                        </div>
                        <p className="text-lg italic text-gray-700 dark:text-gray-300">
                          {motivationalQuote}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

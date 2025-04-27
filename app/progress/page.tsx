'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Calendar,
  Trophy,
  Target,
  CheckCircle,
  Star,
  TrendingUp,
  Plus
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  WorkoutLog,
  Achievement,
  CustomGoal,
  saveWorkoutLog,
  getWorkoutLogs,
  saveAchievement,
  getAchievements,
  saveCustomGoal,
  getCustomGoals,
  updateGoalProgress,
  getWeeklyStreak
} from '@/lib/db';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';

// Types for tracking data
interface WeightLog {
  date: string;
  weight: number;
}

interface CalorieLog {
  date: string;
  calories: number;
}

// Function to trigger confetti animation using CDN script
const triggerConfetti = () => {
  if (typeof window !== 'undefined') {
    // Add script tag if it doesn't exist
    if (!document.getElementById('confetti-script')) {
      const script = document.createElement('script');
      script.id = 'confetti-script';
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      document.body.appendChild(script);
      
      // Wait for script to load before triggering confetti
      script.onload = () => {
        (window as any).confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      };
    } else {
      // Script already loaded, trigger confetti directly
      (window as any).confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
};

export default function ProgressPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [customGoals, setCustomGoals] = useState<CustomGoal[]>([]);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightLog[]>([]);
  const [calorieData, setCalorieData] = useState<CalorieLog[]>([]);

  // Load data from Firebase
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get date range for last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        // Load all data
        const [logs, achievs, goals, streak] = await Promise.all([
          getWorkoutLogs(startDate, endDate),
          getAchievements(),
          getCustomGoals(),
          getWeeklyStreak()
        ]);
        
        setWorkoutLogs(logs);
        setAchievements(achievs);
        setCustomGoals(goals);
        setWeeklyStreak(streak);

        // Sample data for weight tracking (replace with actual data from Firebase)
        const sampleWeightData = Array.from({ length: 30 }, (_, i) => ({
          date: format(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000), 'MMM dd'),
          weight: 70 + Math.random() * 2 - 1 // Random weight between 69-71 kg
        }));
        setWeightData(sampleWeightData);

        // Sample data for calorie tracking (replace with actual data from Firebase)
        const sampleCalorieData = Array.from({ length: 30 }, (_, i) => ({
          date: format(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000), 'MMM dd'),
          calories: 2000 + Math.random() * 400 - 200 // Random calories between 1800-2200
        }));
        setCalorieData(sampleCalorieData);

      } catch (error) {
        console.error('Error loading progress data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load progress data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Function to add a new workout log
  const handleAddWorkout = async (type: string, duration: number) => {
    try {
      const newWorkout: WorkoutLog = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        type,
        duration,
        completed: true
      };
      
      await saveWorkoutLog(newWorkout);
      setWorkoutLogs([newWorkout, ...workoutLogs]);
      
      toast({
        title: 'Success',
        description: 'Workout logged successfully!',
      });
    } catch (error) {
      console.error('Error logging workout:', error);
      toast({
        title: 'Error',
        description: 'Failed to log workout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Function to add a new custom goal
  const handleAddGoal = async (title: string, target: number, type: 'weight' | 'workouts' | 'streak') => {
    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30); // Set deadline to 30 days from now
      
      const newGoal: CustomGoal = {
        id: Date.now().toString(),
        title,
        target,
        current: 0,
        deadline: deadline.toISOString().split('T')[0],
        type
      };
      
      await saveCustomGoal(newGoal);
      setCustomGoals([...customGoals, newGoal]);
      
      toast({
        title: 'Success',
        description: 'New goal added successfully!',
      });
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to add goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Function to update goal progress
  const handleUpdateGoal = async (goalId: string, newValue: number) => {
    try {
      await updateGoalProgress(goalId, newValue);
      setCustomGoals(customGoals.map(goal => 
        goal.id === goalId ? { ...goal, current: newValue } : goal
      ));
      
      // Check if goal is completed
      const goal = customGoals.find(g => g.id === goalId);
      if (goal && newValue >= goal.target) {
        const achievement: Achievement = {
          id: Date.now().toString(),
          title: `${goal.title} Completed!`,
          description: `Reached your goal of ${goal.target} ${goal.type}`,
          date: new Date().toISOString().split('T')[0],
          icon: '🎯',
          unlocked: true
        };
        await saveAchievement(achievement);
        setAchievements([achievement, ...achievements]);
        triggerConfetti();
      }
      
      toast({
        title: 'Success',
        description: 'Goal progress updated!',
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update goal progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Your Progress</h1>

      {/* Weight and Calorie Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weight Progress</CardTitle>
            <CardDescription>Track your weight changes over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calorie Intake</CardTitle>
            <CardDescription>Weekly calorie consumption</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calorieData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workout Completion Tracker */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Workout Tracker
          </h2>
          <Button
            onClick={() => handleAddWorkout('Strength', 45)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Workout
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workoutLogs.map((log, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{new Date(log.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{log.type} - {log.duration} min</p>
                </div>
                {log.completed && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Achievements Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onClick={achievement.unlocked ? triggerConfetti : undefined}
                className="cursor-pointer"
              >
                <Card className={`p-4 ${achievement.unlocked ? 'bg-gradient-to-r from-purple-50 to-blue-50' : 'opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Custom Goals Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Custom Goals
          </h2>
          <Button
            onClick={() => handleAddGoal('Workout 4x per week', 4, 'workouts')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customGoals.map((goal) => (
            <Card key={goal.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{goal.title}</h3>
                  <span className="text-sm text-gray-600">
                    Due {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {goal.current} / {goal.target} {goal.type}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateGoal(goal.id, goal.current + 1)}
                  >
                    Update Progress
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Weekly Streak */}
      <section className="mt-8">
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-4">
            <Star className="w-8 h-8 text-yellow-500" />
            <div>
              <h2 className="text-xl font-semibold">Current Streak</h2>
              <p className="text-3xl font-bold text-purple-600">{weeklyStreak} weeks</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
} 
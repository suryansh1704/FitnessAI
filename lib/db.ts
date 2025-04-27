import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, Timestamp, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebase';

// Progress tracking interfaces
export interface WorkoutLog {
  date: string;
  completed: boolean;
  type: string;
  duration: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
  unlocked: boolean;
}

export interface CustomGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  type: 'weight' | 'workouts' | 'streak';
}

// Function to save a workout log
export async function saveWorkoutLog(workoutLog: WorkoutLog) {
  if (!auth.currentUser) return null;
  
  const db = getFirestore();
  const workoutRef = doc(collection(db, `users/${auth.currentUser.uid}/workoutLogs`));
  
  await setDoc(workoutRef, {
    ...workoutLog,
    createdAt: serverTimestamp(),
  });
  
  return workoutRef.id;
}

// Function to get workout logs for a date range
export async function getWorkoutLogs(startDate: Date, endDate: Date) {
  if (!auth.currentUser) return [];
  
  const db = getFirestore();
  const workoutLogsRef = collection(db, `users/${auth.currentUser.uid}/workoutLogs`);
  const q = query(
    workoutLogsRef,
    where('date', '>=', startDate.toISOString().split('T')[0]),
    where('date', '<=', endDate.toISOString().split('T')[0]),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as WorkoutLog }));
}

// Function to save or update an achievement
export async function saveAchievement(achievement: Achievement) {
  if (!auth.currentUser) return null;
  
  const db = getFirestore();
  const achievementRef = doc(collection(db, `users/${auth.currentUser.uid}/achievements`));
  
  await setDoc(achievementRef, {
    ...achievement,
    updatedAt: serverTimestamp(),
  });
  
  return achievementRef.id;
}

// Function to get all achievements
export async function getAchievements() {
  if (!auth.currentUser) return [];
  
  const db = getFirestore();
  const achievementsRef = collection(db, `users/${auth.currentUser.uid}/achievements`);
  const q = query(achievementsRef, orderBy('date', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Achievement }));
}

// Function to save or update a custom goal
export async function saveCustomGoal(goal: CustomGoal) {
  if (!auth.currentUser) return null;
  
  const db = getFirestore();
  const goalRef = doc(collection(db, `users/${auth.currentUser.uid}/goals`));
  
  await setDoc(goalRef, {
    ...goal,
    updatedAt: serverTimestamp(),
  });
  
  return goalRef.id;
}

// Function to get all custom goals
export async function getCustomGoals() {
  if (!auth.currentUser) return [];
  
  const db = getFirestore();
  const goalsRef = collection(db, `users/${auth.currentUser.uid}/goals`);
  const q = query(goalsRef, orderBy('deadline'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as CustomGoal }));
}

// Function to update goal progress
export async function updateGoalProgress(goalId: string, currentValue: number) {
  if (!auth.currentUser) return;
  
  const db = getFirestore();
  const goalRef = doc(db, `users/${auth.currentUser.uid}/goals/${goalId}`);
  
  await updateDoc(goalRef, {
    current: currentValue,
    updatedAt: serverTimestamp(),
  });
}

// Function to get weekly streak
export async function getWeeklyStreak() {
  if (!auth.currentUser) return 0;
  
  const db = getFirestore();
  const workoutLogsRef = collection(db, `users/${auth.currentUser.uid}/workoutLogs`);
  
  // Get logs for the last 8 weeks to calculate streak
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  
  const q = query(
    workoutLogsRef,
    where('date', '>=', eightWeeksAgo.toISOString().split('T')[0]),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map(doc => ({
    date: doc.data().date,
    completed: doc.data().completed,
  }));
  
  // Calculate weekly streak
  let streak = 0;
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  
  for (let i = 0; i < 8; i++) {
    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const weekStartDate = new Date(weekStart);
      weekStartDate.setDate(weekStartDate.getDate() - (7 * i));
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      return logDate >= weekStartDate && logDate <= weekEndDate;
    });
    
    // Check if there are at least 3 completed workouts in the week
    const completedWorkouts = weekLogs.filter(log => log.completed).length;
    if (completedWorkouts >= 3) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
} 
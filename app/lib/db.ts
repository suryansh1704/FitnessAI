import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

// Types
export interface WorkoutLog {
  id?: string;  // Optional since Firestore will assign it
  date: string;
  type: string;
  duration: number;
  completed: boolean;
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

// Database functions
export async function getWorkoutLogs(startDate: Date, endDate: Date): Promise<WorkoutLog[]> {
  try {
    const workoutRef = collection(db, 'workouts');
    const q = query(
      workoutRef,
      where('date', '>=', startDate.toISOString()),
      where('date', '<=', endDate.toISOString())
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WorkoutLog));
  } catch (error) {
    console.error('Error getting workout logs:', error);
    return [];
  }
}

export async function getAchievements(): Promise<Achievement[]> {
  try {
    const achievementsRef = collection(db, 'achievements');
    const querySnapshot = await getDocs(achievementsRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Achievement));
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
}

export async function getCustomGoals(): Promise<CustomGoal[]> {
  try {
    const goalsRef = collection(db, 'goals');
    const querySnapshot = await getDocs(goalsRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CustomGoal));
  } catch (error) {
    console.error('Error getting custom goals:', error);
    return [];
  }
}

export async function getWeeklyStreak(): Promise<number> {
  try {
    const streakRef = collection(db, 'streaks');
    const querySnapshot = await getDocs(streakRef);
    if (!querySnapshot.empty) {
      const streakDoc = querySnapshot.docs[0];
      return streakDoc.data().weeks || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting weekly streak:', error);
    return 0;
  }
}

export async function saveCustomGoal(goal: CustomGoal): Promise<void> {
  try {
    const goalsRef = collection(db, 'goals');
    await addDoc(goalsRef, {
      ...goal,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving custom goal:', error);
    throw error;
  }
}

export async function updateGoalProgress(goalId: string, newValue: number): Promise<void> {
  try {
    const goalRef = doc(db, 'goals', goalId);
    await updateDoc(goalRef, {
      current: newValue,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }
}

export async function saveAchievement(achievement: Achievement): Promise<void> {
  try {
    const achievementsRef = collection(db, 'achievements');
    await addDoc(achievementsRef, {
      ...achievement,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving achievement:', error);
    throw error;
  }
}

export async function saveWorkoutLog(log: WorkoutLog): Promise<void> {
  try {
    const workoutsRef = collection(db, 'workouts');
    await addDoc(workoutsRef, {
      ...log,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error saving workout log:', error);
    throw error;
  }
} 
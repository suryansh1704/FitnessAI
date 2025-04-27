"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/AuthContext"
import { getUserProfile } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Pencil, User, Mail, Calendar, Ruler, Weight, Check, Award, Activity, Sparkles } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { LottiePlayer } from "@/components/ui/lottie-player"

type UserProfileData = {
  name?: string;
  email?: string;
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  goal?: string;
  activityLevel?: string;
  allergies?: string[];
  dietaryPreference?: string;
  createdAt?: any; // Changed from string to any to handle Firebase Timestamp
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({ 
    opacity: 1, 
    x: 0,
    transition: { 
      delay: i * 0.1,
      duration: 0.5
    }
  })
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const result = await getUserProfile(user.uid)
        if (result.success) {
          setProfileData(result.data as UserProfileData)
        } else {
          toast({
            title: "Error",
            description: "Could not load profile data",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (!loading) {
      fetchProfile()
    }
  }, [user, loading])

  // Generate avatar initials from user display name or email
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    } else if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return "FI" // FitAI default
  }

  const formatDate = (timestamp?: any) => {
    if (!timestamp) return "N/A"
    
    try {
      // Handle Firebase Timestamp objects
      if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        // Convert seconds to milliseconds for JavaScript Date
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      
      // Handle Date strings
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      
      return "Invalid date"
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Invalid date"
    }
  }

  const formatGoal = (goal?: string) => {
    if (!goal) return "N/A"
    
    const goalMap: {[key: string]: string} = {
      "lose_fat": "Lose Fat",
      "maintain": "Maintain Weight",
      "gain_muscle": "Gain Muscle"
    }
    
    return goalMap[goal] || goal
  }

  const formatActivityLevel = (level?: string) => {
    if (!level) return "N/A"
    
    const activityMap: {[key: string]: string} = {
      "sedentary": "Sedentary (little or no exercise)",
      "light": "Lightly active (light exercise 1-3 days/week)",
      "active": "Active (moderate exercise 3-5 days/week)",
      "very_active": "Very active (hard exercise 6-7 days/week)"
    }
    
    return activityMap[level] || level
  }

  const getBadgeColor = (goal?: string) => {
    if (!goal) return "bg-gray-200 text-gray-800"
    
    const colorMap: {[key: string]: string} = {
      "lose_fat": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
      "maintain": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      "gain_muscle": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
    }
    
    return colorMap[goal] || "bg-gray-200 text-gray-800"
  }

  const getFitnessLevelIcon = (level?: string) => {
    if (!level) return <Activity className="h-5 w-5 text-gray-400" />
    
    if (level === "sedentary" || level === "light") {
      return <Activity className="h-5 w-5 text-blue-500" />
    } else if (level === "active") {
      return <Activity className="h-5 w-5 text-purple-500" />
    } else if (level === "very_active") {
      return <Award className="h-5 w-5 text-pink-500" />
    }
    
    return <Activity className="h-5 w-5 text-gray-400" />
  }

  const formatDietaryPreference = (preference?: string) => {
    if (!preference) return "N/A";
    
    const dietMap: {[key: string]: string} = {
      "vegetarian": "Vegetarian",
      "non-vegetarian": "Non-Vegetarian",
      "vegan": "Vegan"
    };
    
    return dietMap[preference] || preference;
  };

  if (loading || isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <LottiePlayer
          autoplay
          loop
          src="https://lottie.host/82c26a9e-a818-44e3-98b0-4a99c39e882f/b1FQUogY2F.json"
          style={{ height: "200px", width: "200px" }}
        />
        <p className="text-lg font-medium mt-4 text-purple-800 dark:text-purple-200">Loading your profile...</p>
      </div>
    )
  }

  if (!user) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 p-4">
      <div className="max-w-5xl mx-auto pt-8 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center mb-8"
        >
          <Button 
            variant="ghost" 
            className="mr-4 transition-all hover:scale-105 hover:bg-white/50"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Dashboard</span>
          </Button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            My Profile
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Info Card */}
          <motion.div 
            variants={cardVariants} 
            initial="hidden" 
            animate="visible"
            className="col-span-1"
          >
            <Card className="bg-white/70 dark:bg-black/70 backdrop-blur-md border-purple-100 dark:border-purple-900 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-purple-600 to-pink-600 opacity-80"></div>
              <CardHeader className="text-center pb-2 relative pt-16">
                <div className="flex justify-center mb-4">
                  <div className="ring-4 ring-white dark:ring-black rounded-full overflow-hidden shadow-md">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                      <AvatarFallback className="text-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">{user.displayName || "FitAI User"}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  <motion.div 
                    custom={0}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center border-b border-gray-100 dark:border-gray-800 py-2"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-sm text-gray-500">Joined:</span>
                    <span className="text-sm ml-auto font-medium">{formatDate(profileData?.createdAt)}</span>
                  </motion.div>
                  <motion.div 
                    custom={1}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center border-b border-gray-100 dark:border-gray-800 py-2"
                  >
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </Badge>
                  </motion.div>
                  {profileData?.goal && (
                    <motion.div 
                      custom={2}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center border-b border-gray-100 dark:border-gray-800 py-2"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                      <span className="text-sm text-gray-500">Goal:</span>
                      <Badge className={`ml-auto ${getBadgeColor(profileData.goal)}`}>
                        {formatGoal(profileData.goal)}
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:shadow-lg hover:scale-[1.02]" 
                  onClick={() => router.push("/onboarding")}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Profile Details Card */}
          <motion.div 
            variants={cardVariants} 
            initial="hidden" 
            animate="visible"
            transition={{ delay: 0.2 }}
            className="col-span-1 md:col-span-2"
          >
            <Card className="bg-white/70 dark:bg-black/70 backdrop-blur-md border-purple-100 dark:border-purple-900 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Profile Details
                </CardTitle>
                <CardDescription>Your personalized fitness information and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs 
                  defaultValue="personal" 
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-purple-100/50 dark:bg-gray-800/50">
                    <TabsTrigger 
                      value="personal"
                      className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 transition-all duration-300"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Personal Info
                    </TabsTrigger>
                    <TabsTrigger 
                      value="fitness"
                      className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 transition-all duration-300"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Fitness Data
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal" className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                      >
                        <div className="text-sm font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-purple-500" />
                          Name
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-md shadow-inner">
                          {profileData?.name || user.displayName || "Not provided"}
                        </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-2"
                      >
                        <div className="text-sm font-medium flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-purple-500" />
                          Email
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-md shadow-inner">
                          {profileData?.email || user.email}
                        </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                      >
                        <div className="text-sm font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                          Age
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-md shadow-inner">
                          {profileData?.age || "Not provided"}
                        </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="space-y-2"
                      >
                        <div className="text-sm font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-purple-500" />
                          Gender
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-md shadow-inner capitalize">
                          {profileData?.gender || "Not provided"}
                        </div>
                      </motion.div>
                    </div>
                  </TabsContent>
                  <TabsContent value="fitness" className="space-y-4 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                      >
                        <div className="text-sm font-medium flex items-center">
                          <Ruler className="h-4 w-4 mr-2 text-purple-500" />
                          Height
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-md shadow-inner">
                          {profileData?.height ? (
                            <div className="flex items-center justify-between">
                              <span>{profileData.height} cm</span>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400">
                                {parseInt(profileData.height) > 170 ? "Above Average" : "Average"}
                              </Badge>
                            </div>
                          ) : (
                            "Not provided"
                          )}
                        </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-2"
                      >
                        <div className="text-sm font-medium flex items-center">
                          <Weight className="h-4 w-4 mr-2 text-purple-500" />
                          Weight
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-md shadow-inner">
                          {profileData?.weight ? (
                            <div className="flex items-center justify-between">
                              <span>{profileData.weight} kg</span>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                Healthy Range
                              </Badge>
                            </div>
                          ) : (
                            "Not provided"
                          )}
                        </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                      >
                        <div className="text-sm font-medium flex items-center">
                          <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                          Fitness Goal
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-md shadow-inner">
                          <Badge className={`${getBadgeColor(profileData?.goal)}`}>
                            {formatGoal(profileData?.goal)}
                          </Badge>
                        </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="space-y-2"
                      >
                        <div className="text-sm font-medium flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-purple-500" />
                          Activity Level
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-md shadow-inner">
                          <div className="flex items-center">
                            {getFitnessLevelIcon(profileData?.activityLevel)}
                            <span className="ml-2">{formatActivityLevel(profileData?.activityLevel)}</span>
                          </div>
                        </div>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-2 space-y-2"
                      >
                        <div className="text-sm font-medium flex items-center">
                          <Award className="h-4 w-4 mr-2 text-purple-500" />
                          Allergies/Dietary Restrictions
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-gray-800 rounded-md shadow-inner">
                          {profileData?.allergies?.length ? 
                            <div className="flex flex-wrap gap-2">
                              {profileData.allergies.map((allergy, i) => (
                                <Badge key={i} variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 px-3 py-1 capitalize">
                                  {allergy}
                                </Badge>
                              ))}
                            </div> : 
                            "None specified"
                          }
                        </div>
                      </motion.div>
                      <motion.div 
                        custom={6}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex items-center gap-3 border rounded-md p-3 bg-white/60 dark:bg-gray-800/60"
                      >
                        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2 text-green-600 dark:text-green-400">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Dietary Preference</p>
                          <p className="font-medium">{formatDietaryPreference(profileData?.dietaryPreference)}</p>
                        </div>
                      </motion.div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 
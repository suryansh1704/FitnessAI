import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';

// Fallback fitness responses based on user queries
const generateFitnessResponse = (query: string) => {
  // Lowercase the query for easier matching
  const queryLower = query.toLowerCase();
  
  // Check for common fitness topics and return appropriate responses
  if (queryLower.includes('workout') || queryLower.includes('exercise') || queryLower.includes('training')) {
    return {
      role: "assistant",
      content: "For an effective workout routine, I recommend combining strength training and cardio exercises. Aim for 3-4 days of strength training focusing on different muscle groups, and 2-3 days of cardio. Make sure to include rest days for recovery. Start with compound exercises like squats, deadlifts, and bench press for maximum efficiency. How intense is your current fitness level?"
    };
  }
  
  if (queryLower.includes('diet') || queryLower.includes('nutrition') || queryLower.includes('food') || queryLower.includes('eat')) {
    return {
      role: "assistant",
      content: "A balanced diet is key to achieving your fitness goals. Focus on consuming lean proteins (chicken, fish, tofu), complex carbohydrates (whole grains, vegetables), healthy fats (avocados, nuts, olive oil), and plenty of fruits and vegetables. Try to maintain a caloric balance that aligns with your goals - deficit for weight loss, surplus for muscle gain. Would you like specific meal suggestions based on your fitness goals?"
    };
  }
  
  if (queryLower.includes('weight loss') || queryLower.includes('lose weight') || queryLower.includes('fat') || queryLower.includes('slim')) {
    return {
      role: "assistant",
      content: "Sustainable weight loss comes from a combination of caloric deficit through diet and increased calorie burn through exercise. I recommend starting with a modest 500 calorie deficit per day, which should lead to about 1 pound of weight loss per week. Include both strength training to preserve muscle mass and cardio for additional calorie burn. Remember that consistency is more important than intensity when starting out. What specific challenges are you facing with weight loss?"
    };
  }
  
  if (queryLower.includes('muscle') || queryLower.includes('strength') || queryLower.includes('strong') || queryLower.includes('build')) {
    return {
      role: "assistant",
      content: "To build muscle effectively, focus on progressive overload - gradually increasing the weight or reps in your strength training. Ensure you're consuming enough protein (about 1.6-2.2g per kg of bodyweight) and maintain a slight caloric surplus. Compound movements like squats, deadlifts, bench press, and pull-ups will give you the most bang for your buck. Allow each muscle group 48-72 hours of recovery between targeted workouts. What's your current training split?"
    };
  }
  
  // Default greeting
  if (queryLower.includes('hi') || queryLower.includes('hello') || queryLower.includes('hey') || queryLower === "") {
    return {
      role: "assistant",
      content: "Hi there! I'm your FitAI trainer. I can help you with workout plans, nutrition advice, and general fitness guidance. What fitness goals are you currently working on?"
    };
  }
  
  // If no specific topic is matched, provide a general response
  return {
    role: "assistant",
    content: "I'm your AI fitness trainer, here to help with workout plans, nutrition advice, and general fitness guidance. I can provide information about strength training, cardio, nutrition, weight management, and more. What specific fitness goal are you working towards, and how can I assist you today?"
  };
};

export async function POST(req: Request) {
  try {
    // Extract messages from request
    const { messages } = await req.json()
    
    if (!process.env.OPENAI_API_KEY) {
      console.error("API key not found")
      return NextResponse.json(
        { 
          content: "Sorry, the AI service is not properly configured. Please check your API key in the environment variables.",
          error: "API key not configured" 
        },
        { status: 500 }
      )
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 800,
    })
    
    // Extract the assistant's response
    const assistantMessage = response.choices[0].message.content

    // Return the assistant's message
    return NextResponse.json({ content: assistantMessage })
  } catch (error: any) {
    console.error("Error calling AI service:", error)

    // Return appropriate error message with status code
    return NextResponse.json(
      { 
        content: "I'm having trouble connecting to the AI service. Please try again later.",
        error: error.message || "Unknown error occurred" 
      },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithGemini } from '@/lib/gemini';

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
  
  if (queryLower.includes('schedule') || queryLower.includes('plan') || queryLower.includes('routine')) {
    return {
      role: "assistant",
      content: "Here's a sample weekly fitness schedule you can adapt:\n\n- Monday: Upper body strength training (chest, shoulders, triceps, back, biceps)\n- Tuesday: 30-45 minutes cardio (moderate intensity) + core workout\n- Wednesday: Lower body strength training (quads, hamstrings, glutes, calves)\n- Thursday: Rest or active recovery (walking, yoga, light stretching)\n- Friday: Full body strength training\n- Saturday: 30-45 minutes cardio (interval training) + mobility work\n- Sunday: Complete rest day\n\nAdjust this based on your fitness level and goals. Would you like more specific workout details for any of these days?"
    };
  }
  
  if (queryLower.includes('cardio') || queryLower.includes('running') || queryLower.includes('endurance')) {
    return {
      role: "assistant",
      content: "Cardio training is excellent for heart health and endurance. For beginners, start with 20-30 minutes of moderate-intensity cardio 3-4 times per week. You can choose from activities like brisk walking, jogging, cycling, swimming, or using the elliptical. As you build endurance, gradually increase duration and intensity. Adding interval training (alternating between high and low intensity) can make your cardio more effective and time-efficient. What type of cardio do you enjoy most?"
    };
  }
  
  if (queryLower.includes('protein') || queryLower.includes('supplement') || queryLower.includes('shake')) {
    return {
      role: "assistant",
      content: "Protein supplements can be a convenient way to meet your daily protein needs, especially around workouts. Whey protein is quickly absorbed and ideal post-workout, while casein provides a slower release, making it good before bed. However, prioritize whole food protein sources like lean meats, fish, eggs, dairy, legumes, and tofu for the majority of your intake. Most people engaged in regular exercise should aim for 1.6-2.2g of protein per kg of bodyweight daily. Would you like recommendations for specific supplements?"
    };
  }
  
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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Get the user's query (last message in the array)
    const userQuery = messages[messages.length - 1]?.content || '';
    console.log('Received chat request with messages:', JSON.stringify(messages, null, 2));
    
    // Get the Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    // If no API key is provided, use the fallback response
    if (!geminiApiKey) {
      console.warn('No API key found in environment variables. Using fallback response.');
      const fallbackResponse = generateFitnessResponse(userQuery);
      return NextResponse.json(fallbackResponse);
    }
    
    console.log('Sending request to AI service...');
    try {
      // Try to generate response using Gemini API
      const geminiResponse = await generateContentWithGemini(
        messages,
        geminiApiKey,
        { temperature: 0.7, maxOutputTokens: 1000 }
      );
      
      console.log('Successfully received response from AI service');
      return NextResponse.json(geminiResponse);
    } catch (geminiError: any) {
      console.error('Error with AI service:', geminiError);
      
      // Log more detailed error information
      if (geminiError.message) {
        console.error('AI service error details:', geminiError.message);
      }
      
      // If API call fails, fall back to the hardcoded responses
      console.log('Falling back to hardcoded response');
      const fallbackResponse = generateFitnessResponse(userQuery);
      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error('Request processing error:', error);
    
    // Format error message for the client
    let errorMessage = 'Error processing your request';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      age, 
      gender, 
      fitnessLevel, 
      location, 
      daysPerWeek,
      goal,
      injuries 
    } = body;

    if (!age || !gender || !fitnessLevel || !location || !daysPerWeek || !goal) {
      return NextResponse.json(
        { error: 'Missing required user information' },
        { status: 400 }
      );
    }

    const userPrompt = `
      Generate a personalized ${daysPerWeek}-day workout plan for a ${age} year old ${gender}
      with a ${fitnessLevel} fitness level. They prefer to workout at ${location}.
      Their fitness goal is to ${goal}.
      ${injuries ? `They have the following injuries or limitations: ${injuries}` : ''}
      
      Create a weekly workout plan with the following information for each day:
      1. The focus of the day (e.g., chest/triceps, legs, rest day, etc.)
      2. A list of exercises with sets, reps, and rest times
      3. A brief warm-up routine
      4. A brief cool-down/stretching routine
      5. Total estimated workout time
      
      Format the response as JSON with the following structure:
      {
        "weeklyPlan": [
          {
            "day": "Day 1",
            "focus": "Body parts or type of training",
            "warmup": "Brief warm-up description",
            "exercises": [
              {
                "name": "Exercise name",
                "sets": number,
                "reps": number or "duration",
                "rest": "rest time between sets",
                "notes": "Optional form tips or alternatives"
              },
              // more exercises...
            ],
            "cooldown": "Brief cool-down description",
            "duration": "Estimated total workout time"
          },
          // more days...
        ]
      }
    `;

    const messages = [
      { role: "system", content: "You are a professional fitness trainer who creates personalized workout plans. Always respond in valid JSON format." },
      { role: "user", content: userPrompt }
    ];

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const response = await generateContentWithGemini(
      messages,
      geminiApiKey,
      { temperature: 0.7, maxOutputTokens: 2000 }
    );

    const workoutPlan = JSON.parse(response.content || '{}');
    return NextResponse.json(workoutPlan);
  } catch (error) {
    console.error('Workout plan generation error:', error);
    return NextResponse.json(
      { error: 'Error generating workout plan' },
      { status: 500 }
    );
  }
} 
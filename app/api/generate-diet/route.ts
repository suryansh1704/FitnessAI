import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      age, 
      gender, 
      weight, 
      height, 
      goal, 
      allergies, 
      activityLevel 
    } = body;

    if (!age || !gender || !weight || !height || !goal || !activityLevel) {
      return NextResponse.json(
        { error: 'Missing required user information' },
        { status: 400 }
      );
    }

    const userPrompt = `
      Generate a personalized diet plan for a ${age} year old ${gender}, 
      weighing ${weight}kg, ${height}cm tall. 
      Their fitness goal is to ${goal}.
      Activity level: ${activityLevel}.
      ${allergies && allergies.length > 0 ? `Allergies: ${allergies.join(', ')}.` : 'No allergies.'}
      
      Create a full day's meal plan including breakfast, lunch, dinner, and snacks.
      For each meal include:
      1. The meal name
      2. List of ingredients with approximate portions
      3. Brief preparation instructions
      4. Nutritional information (calories, protein, carbs, fats)
      5. A brief explanation of why this meal is beneficial for their specific goals
      
      Format the response as JSON with the following structure:
      {
        "breakfast": {
          "name": "Meal name",
          "ingredients": ["ingredient 1", "ingredient 2", ...],
          "preparation": "Brief instructions",
          "nutrition": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fats": number
          },
          "benefits": "Brief explanation"
        },
        "lunch": { same structure },
        "dinner": { same structure },
        "snacks": [
          { same structure },
          { same structure }
        ]
      }
    `;

    const messages = [
      { role: "system", content: "You are a professional nutritionist who creates personalized diet plans. Always respond in valid JSON format." },
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

    const dietPlan = JSON.parse(response.content || '{}');
    return NextResponse.json(dietPlan);
  } catch (error) {
    console.error('Diet plan generation error:', error);
    return NextResponse.json(
      { error: 'Error generating diet plan' },
      { status: 500 }
    );
  }
} 
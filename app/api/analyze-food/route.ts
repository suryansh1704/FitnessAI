import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, foodName, userGoal } = body;

    if ((!imageUrl && !foodName) || !userGoal) {
      return NextResponse.json(
        { error: 'Either an image URL or food name is required, along with the user goal' },
        { status: 400 }
      );
    }

    let messages = [];
    
    if (imageUrl) {
      // If image URL is provided, we'll use Gemini's vision capabilities
      messages = [
        {
          role: "system",
          content: "You are a nutritionist AI that analyzes food images and provides detailed nutritional information. Always respond in valid JSON format."
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this food image. The user's fitness goal is: ${userGoal}. Provide detailed nutritional information and a health score from 0-100 based on how well it aligns with their goal.` },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ];
    } else {
      // If just a food name is provided
      messages = [
        {
          role: "system",
          content: "You are a nutritionist AI that provides detailed nutritional information about food. Always respond in valid JSON format."
        },
        {
          role: "user",
          content: `Analyze the nutritional content of ${foodName}. The user's fitness goal is: ${userGoal}. Provide detailed nutritional information and a health score from 0-100 based on how well it aligns with their goal.`
        }
      ];
    }

    const userPrompt = `
      Analyze this food and provide:
      1. Estimated calories
      2. Macronutrient breakdown (protein, carbs, fats)
      3. Health score (0-100) based on alignment with the user's goal of: ${userGoal}
      4. Health badges (e.g., "High Protein", "Low Fat", "Good for Weight Loss")
      5. A brief explanation of why this food is good or bad for their specific goal
      
      Format the response as JSON with the following structure:
      {
        "food": "Name of the food",
        "nutrition": {
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number
        },
        "healthScore": number,
        "healthBadges": ["badge1", "badge2", ...],
        "analysis": "Brief explanation related to their goal"
      }
    `;

    messages.push({ role: "user", content: userPrompt });

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

    const analysis = JSON.parse(response.content || '{}');
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Food analysis error:', error);
    return NextResponse.json(
      { error: 'Error analyzing food' },
      { status: 500 }
    );
  }
} 
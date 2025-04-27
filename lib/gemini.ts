// Google Generative AI (Gemini) client setup

/**
 * This is a custom implementation of the AI client.
 * Since we're having issues with the SDK installation, we'll create a custom fetch-based implementation.
 */

// Update to the correct API endpoint format
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// The models that were attempted in error logs but failed:
// - models/gemini-pro (not found for API version v1beta)
// - models/gemini-1.0-pro (not found for API version v1beta)
// - models/gemini-pro (not found for API version v1)
// WORKING MODEL: gemini-1.5-flash

export type GeminiMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

export type GeminiRequest = {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
};

export type GeminiResponse = {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
};

/**
 * Converts a standard chat message format to Gemini's expected format
 */
export const formatMessagesForGemini = (messages: any[]) => {
  // Extract system message if present
  const systemMessage = messages.find(msg => msg.role === "system");
  let systemInstruction = "";
  
  if (systemMessage) {
    systemInstruction = systemMessage.content;
  }

  // Filter out system messages and format the rest for a conversation
  const formattedMessages: GeminiMessage[] = [];
  
  // Add system message as the first user message if it exists
  if (systemInstruction) {
    formattedMessages.push({
      role: "user",
      parts: [{ text: systemInstruction }]
    });
    
    // Add a model response to the system message to maintain conversation format
    formattedMessages.push({
      role: "model",
      parts: [{ text: "I understand. I'll act as a fitness trainer providing helpful, evidence-based information." }]
    });
  }
  
  // Add the rest of the messages
  messages
    .filter(msg => msg.role !== "system")
    .forEach(msg => {
      formattedMessages.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    });

  return formattedMessages;
};

/**
 * Sends a request to the AI service
 */
export const generateContentWithGemini = async (
  messages: any[],
  apiKey: string,
  config = { temperature: 0.7, maxOutputTokens: 1000 }
) => {
  try {
    const formattedMessages = formatMessagesForGemini(messages);
    
    console.log('Making request to AI service with formatted messages:', 
      JSON.stringify(formattedMessages, null, 2));
    
    // Add some console logging to assist with debugging
    const apiUrl = `${GEMINI_API_ENDPOINT}?key=${apiKey}`;
    console.log(`Using AI service URL`);
    
    const response = await fetch(
      apiUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: formattedMessages,
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        } as GeminiRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service error response:', errorText);
      
      // Check for specific error cases and provide more helpful messages
      if (response.status === 404) {
        console.error('Model not found. Please check if you are using the correct model name and API version.');
      } else if (response.status === 403) {
        console.error('Permission denied. Please check your API key.');
      } else if (response.status === 429) {
        console.error('Rate limit exceeded. You may need to upgrade your API tier or try again later.');
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    console.log('AI service response:', JSON.stringify(data, null, 2));

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from AI service");
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    return {
      role: "assistant",
      content: generatedText
    };
  } catch (error) {
    console.error("Error generating content with AI service:", error);
    throw error;
  }
};

export default {
  generateContentWithGemini
}; 
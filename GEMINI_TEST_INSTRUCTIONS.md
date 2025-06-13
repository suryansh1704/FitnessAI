# AI Integration Setup Instructions

## Overview
Our FitAI application uses AI technology for the chat functionality. This document will help you set up and test the AI integration.

## Step 1: Get an API Key
1. Go to the AI provider's website
2. Sign in with your account
3. Navigate to "Get API key" or the API console
4. Create a new API key for the AI service
5. Copy your API key

## Step 2: Configure Your Environment
1. In the project root directory, find or create a `.env.local` file
2. Add your API key:
```
GEMINI_API_KEY=your_actual_api_key_here
DEFAULT_AI_PROVIDER=gemini
```

## Step 3: Verify the API Model
The current implementation is configured to use a specific AI model. If you're encountering a "model not found" error, you might need to use a different model version. Providers occasionally update their model names and availability.

### Alternative Models to Try
If the default model isn't working, you can modify the `lib/gemini.ts` file and change the endpoint to use one of these alternatives:

```javascript
// Try these alternatives if the default model isn't available:
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
// OR
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
```

## Step 4: Restart the Development Server
After making these changes:
1. Save all files
2. Stop the current development server (Ctrl+C in terminal)
3. Run `npm run dev` to restart the server
4. Check the console logs for any error messages
5. Test the chat functionality in the dashboard

## Troubleshooting
If you're still seeing errors:

1. **Check API Key**: Ensure your API key is correctly copied without any extra spaces or characters
2. **Check API Quota**: Make sure you haven't exceeded your API quota
3. **Model Availability**: Some models may be region-restricted or require special access
4. **Network Connectivity**: Ensure your development environment can access the API endpoints
5. **Alternative Option**: Try setting a different provider in `.env.local` if needed

## Console Debugging
To better understand what's happening, look for these log messages in your terminal:
- "Making request to AI service with formatted messages"
- "Using AI service URL"
- "AI service error response"

The error messages will help identify if the issue is with the API key, model availability, or another configuration problem.

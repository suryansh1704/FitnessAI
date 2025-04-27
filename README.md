# FitAI: Personalized Fitness Assistant

FitAI is a modern fitness application that combines AI-powered recommendations with personalized tracking to help users achieve their fitness goals. Built with Next.js, Firebase, and Tailwind CSS.

## Features

- **User Authentication**: Secure Google sign-in via Firebase Auth
- **Personalized User Profiles**: Track height, weight, fitness goals, activity levels, and dietary preferences
- **Dashboard**: Modern UI to visualize fitness data and track progress
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Firebase project (for authentication and database)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/fitai-project.git
cd fitai-project
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Running the Application

#### Development Mode

There are several ways to start the application:

##### Using batch files (Windows):

Double-click on either:
- `run-app.bat` - Simple launcher that opens the browser and starts the app
- `start-app.bat` - More detailed launcher that checks ports first
- `fix-project.bat` - Troubleshooting script that fixes common issues

##### Using npm commands:

To start the development server on port 3000:

```bash
pnpm run dev
```

If port 3000 is already in use, you can use the alternative port:

```bash
pnpm run dev-alt
```

#### Important Notes

- If you see hydration warnings in the console about body attributes not matching, this is expected and doesn't affect functionality. It's related to browser extensions and has been suppressed in the app.
- On Windows PowerShell, you may need to use `.\script-name.bat` instead of just `script-name.bat`
- If you encounter port conflicts, the fix-project script will handle this automatically

### Troubleshooting

If you encounter issues with the application, you can run the fix script:

```bash
.\fix-project.bat
```

This script will:
- Stop any running Node.js processes
- Clear port conflicts
- Clean the Next.js cache
- Verify your environment files
- Start the application on port 3001

### Firebase Emulators

For local development without using the production Firebase services:

```bash
pnpm run emulators
```

This will start Firebase Auth and Firestore emulators locally.

## Project Structure

- `/app`: Next.js app router pages and layouts
- `/components`: Reusable UI components
- `/lib`: Shared utilities, Firebase config, and context providers
- `/hooks`: Custom React hooks
- `/public`: Static assets

## Key Pages

- `/`: Landing page with sign-in option
- `/dashboard`: Main user dashboard
- `/onboarding`: User profile creation
- `/profile`: User profile viewing and editing
- `/firebase-db-test`: Test page for Firebase connectivity

## Technology Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form, Zod
- **Icons**: Lucide React

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/) 
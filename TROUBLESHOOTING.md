# FitAI Troubleshooting Guide

## Starting the Application

### How to Start the App
1. Double-click on `StartFitAI.cmd` in File Explorer
   - OR -
2. Open PowerShell/Command Prompt in the project folder and run:
   ```
   .\start-app.bat
   ```

## Common Issues

### App Not Starting

**Issue**: The app doesn't start or the browser doesn't open.

**Solution**:
1. Ensure no other applications are using port 3000
2. Try running with the alternate port:
   ```
   npm run dev-alt
   ```
3. Check if your antivirus is blocking Node.js

### Firebase Authentication Errors

**Issue**: "Firebase: Error (auth/api-key-not-valid)"

**Solution**:
1. Verify the environment variables are loaded correctly
2. Check the console output of `node check-firebase.js`
3. Make sure the Firebase project is properly set up
4. Enable Email/Password authentication in your Firebase console

### Port Already In Use

**Issue**: Error message about port 3000 already being in use

**Solution**:
1. Close other applications that might be using the port
2. Run `npm run dev-alt` to use port 3001 instead
3. Use Task Manager to end any Node.js processes

### Browser Not Opening

**Issue**: The app starts but the browser doesn't open automatically

**Solution**:
1. Manually open your browser and navigate to http://localhost:3000
2. If that doesn't work, try http://localhost:3001

## Advanced Troubleshooting

### Clean Reset

If you're having persistent issues, try a full reset:

1. Stop all Node.js processes:
   ```
   taskkill /f /im node.exe
   ```

2. Delete temporary files:
   ```
   rmdir /s /q .next
   rmdir /s /q node_modules\.cache
   ```

3. Reinstall dependencies:
   ```
   npm install
   ```

4. Start the app:
   ```
   npm run dev
   ```

### Environment Variables

If environment variables aren't loading correctly:

1. Ensure both `.env` and `.env.local` files exist in the project root
2. Verify they contain all the required Firebase configuration
3. Try restarting your command prompt/PowerShell

## Getting Help

If you continue to experience issues, please:

1. Check the browser console for error messages
2. Look at the terminal/command prompt output for errors
3. Document the steps that led to the issue 
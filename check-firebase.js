// Simple Node.js script to check Firebase configuration
const https = require('https');

// Firebase API key from .env file or fallback
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyC_de-W4MKr9QWJt3ViFTE5fj3D7e-vzIs';

console.log(`Testing Firebase API key: ${API_KEY.substring(0, 6)}...`);

// Attempt to make a Firebase Auth REST API call
const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;

const data = JSON.stringify({
  email: 'test@example.com',
  password: 'password',
  returnSecureToken: true
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(url, options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    // Even if we get an error about the email being invalid, 
    // that means the API key is valid
    try {
      const response = JSON.parse(responseData);
      
      if (response.error) {
        if (response.error.message === 'INVALID_EMAIL') {
          console.log('✅ API key is valid! (Got expected invalid email error)');
        } else if (response.error.message.includes('API key')) {
          console.log('❌ API key is invalid:', response.error.message);
        } else {
          console.log('⚠️ Got a Firebase error, but API key may be valid:', response.error.message);
        }
      } else {
        console.log('✅ API key is valid! Successfully created test account.');
      }
    } catch (e) {
      console.log('❌ Failed to parse response:', e.message);
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request error:', error.message);
});

req.write(data);
req.end(); 
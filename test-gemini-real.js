const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testGeminiReal() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  console.log('🧪 Testing REAL Gemini AI with your API key...');
  console.log('API Key:', geminiApiKey ? 'Found' : 'Missing');
  
  // Simple text test first
  const requestBody = {
    contents: [{
      parts: [{ text: "Describe what you see in this image: black leather boots" }]
    }]
  };

  try {
    const response = await axios.post(`${geminiEndpoint}?key=${geminiApiKey}`, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Gemini Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('❌ Gemini Error:', error.response?.data || error.message);
  }
}

testGeminiReal();
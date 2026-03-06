const axios = require('axios');
require('dotenv').config();

async function testGeminiV1() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Testing Gemini API with v1 endpoint...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  
  // Test with v1 API
  console.log('\n📸 Testing v1 API with gemini-1.5-flash...');
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`;
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const response = await axios.post(`${endpoint}?key=${apiKey}`, {
      contents: [{
        parts: [
          { text: "What color is this?" },
          {
            inline_data: {
              mime_type: "image/png",
              data: testImage
            }
          }
        ]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    console.log('✅ v1 API with gemini-1.5-flash works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('❌ v1 API failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error?.message || error.message);
  }
  
  // Test text only
  console.log('\n📝 Testing v1 API text-only with gemini-1.5-flash...');
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`;
    
    const response = await axios.post(`${endpoint}?key=${apiKey}`, {
      contents: [{
        parts: [{ text: "Say hello in one word" }]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ v1 API text works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('❌ v1 API text failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error?.message || error.message);
  }
}

testGeminiV1();

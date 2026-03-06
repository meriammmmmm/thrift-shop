const axios = require('axios');
require('dotenv').config();

async function testGeminiSimple() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Testing Gemini API key...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  
  // Test 1: Simple text generation (no vision)
  console.log('\n📝 Test 1: Text generation with gemini-pro...');
  try {
    const textEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`;
    const response = await axios.post(`${textEndpoint}?key=${apiKey}`, {
      contents: [{
        parts: [{ text: "Say hello" }]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ gemini-pro works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('❌ gemini-pro failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error?.message || error.message);
  }
  
  // Test 2: Vision with gemini-pro-vision
  console.log('\n📸 Test 2: Vision with gemini-pro-vision...');
  try {
    const visionEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent`;
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const response = await axios.post(`${visionEndpoint}?key=${apiKey}`, {
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
    
    console.log('✅ gemini-pro-vision works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('❌ gemini-pro-vision failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error?.message || error.message);
  }
  
  // Test 3: Try gemini-1.5-flash
  console.log('\n⚡ Test 3: Vision with gemini-1.5-flash...');
  try {
    const flashEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const response = await axios.post(`${flashEndpoint}?key=${apiKey}`, {
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
    
    console.log('✅ gemini-1.5-flash works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('❌ gemini-1.5-flash failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error?.message || error.message);
  }
  
  // Test 4: Try gemini-1.5-pro
  console.log('\n🚀 Test 4: Vision with gemini-1.5-pro...');
  try {
    const proEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`;
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const response = await axios.post(`${proEndpoint}?key=${apiKey}`, {
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
    
    console.log('✅ gemini-1.5-pro works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('❌ gemini-1.5-pro failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error?.message || error.message);
  }
}

testGeminiSimple();

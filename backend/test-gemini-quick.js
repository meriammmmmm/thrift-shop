require('dotenv').config();
const axios = require('axios');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔑 Testing Gemini API Key...');
  console.log('Key starts with:', apiKey?.substring(0, 10));
  console.log('Key length:', apiKey?.length);
  
  if (!apiKey || apiKey === 'your-gemini-key-here') {
    console.log('❌ No valid Gemini API key found!');
    return;
  }
  
  try {
    // Test with a simple text prompt (no image)
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Say 'Hello, I am working!' in one sentence."
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log('✅ Gemini API is working!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.log('❌ Gemini API Error:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Possible issues:');
      console.log('1. API key might be invalid');
      console.log('2. Model name might be wrong');
      console.log('3. Request format might be incorrect');
    } else if (error.response?.status === 429) {
      console.log('\n💡 Rate limit exceeded. Try again in a few minutes.');
    }
  }
}

testGemini();

const axios = require('axios');
require('dotenv').config();

async function testGeminiWorking() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Testing Gemini 2.5 Flash with vision...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  
  // Test with a simple 1x1 red pixel image
  const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent`;
    
    const response = await axios.post(`${endpoint}?key=${apiKey}`, {
      contents: [{
        parts: [
          { text: "What color is this image? Be very brief." },
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
    
    console.log('✅ Gemini 2.5 Flash works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
    
    // Test with a more complex prompt
    console.log('\n📸 Testing with fashion analysis prompt...');
    const fashionResponse = await axios.post(`${endpoint}?key=${apiKey}`, {
      contents: [{
        parts: [
          { 
            text: `Analyze this fashion item image. Provide:
- Item type (e.g., dress, shoes, jacket)
- Primary color
- Material (if visible)
- Style description (1 sentence)

Keep it brief and factual.` 
          },
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
    
    console.log('✅ Fashion analysis works!');
    console.log('Response:', fashionResponse.data.candidates[0].content.parts[0].text);
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error?.message || error.message);
  }
}

testGeminiWorking();

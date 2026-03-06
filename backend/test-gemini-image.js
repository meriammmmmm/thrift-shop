const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testGeminiImageAnalysis() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent';
  
  console.log('🧪 Testing REAL Gemini AI image analysis...');
  
  // Simple test with a small base64 image
  const testImageBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  const requestBody = {
    contents: [{
      parts: [
        { 
          text: "Analyze this image and tell me exactly what you see. Describe the item, its color, material, and type in detail." 
        },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: testImageBase64
          }
        }
      ]
    }]
  };

  try {
    const response = await axios.post(`${geminiEndpoint}?key=${geminiApiKey}`, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Gemini REAL AI Response:');
    console.log(response.data.candidates[0].content.parts[0].text);
    
  } catch (error) {
    console.error('❌ Gemini Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testGeminiImageAnalysis();
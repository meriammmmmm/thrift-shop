const axios = require('axios');
require('dotenv').config();

async function testHuggingFace() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  console.log('🔍 Testing Hugging Face API...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  
  if (!apiKey || !apiKey.startsWith('hf_')) {
    console.error('❌ Invalid Hugging Face API key format. Should start with "hf_"');
    return;
  }
  
  // Test with a simple 1x1 red pixel image
  const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
  
  const models = [
    'nlpconnect/vit-gpt2-image-captioning',
    'Salesforce/blip-image-captioning-large',
    'Salesforce/blip-image-captioning-base'
  ];
  
  for (const model of models) {
    console.log(`\n📸 Testing model: ${model}...`);
    try {
      // Use the new router endpoint
      const response = await axios.post(`https://router.huggingface.co/models/${model}`, testImage, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream'
        },
        timeout: 30000
      });
      
      console.log('✅ Model works!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      break; // Success, no need to test other models
    } catch (error) {
      console.error(`❌ Model ${model} failed:`);
      console.error('Status:', error.response?.status);
      console.error('Error:', error.response?.data || error.message);
    }
  }
}

testHuggingFace();

const axios = require('axios');
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Listing available Gemini models...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  
  try {
    // Try v1 API
    console.log('\n📋 Trying v1 API...');
    const v1Response = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    console.log('\n✅ Available models in v1:');
    v1Response.data.models.forEach(model => {
      const supportsVision = model.supportedGenerationMethods?.includes('generateContent');
      console.log(`\n  ${model.name}`);
      console.log(`    Display: ${model.displayName}`);
      console.log(`    Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log(`    Vision: ${supportsVision ? '✅ YES' : '❌ NO'}`);
    });
    
  } catch (error) {
    console.error('❌ v1 API failed:', error.response?.data?.error?.message || error.message);
  }
  
  try {
    // Try v1beta API
    console.log('\n\n📋 Trying v1beta API...');
    const v1betaResponse = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    console.log('\n✅ Available models in v1beta:');
    v1betaResponse.data.models.forEach(model => {
      const supportsVision = model.supportedGenerationMethods?.includes('generateContent');
      console.log(`\n  ${model.name}`);
      console.log(`    Display: ${model.displayName}`);
      console.log(`    Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log(`    Vision: ${supportsVision ? '✅ YES' : '❌ NO'}`);
    });
    
  } catch (error) {
    console.error('❌ v1beta API failed:', error.response?.data?.error?.message || error.message);
  }
}

listModels();

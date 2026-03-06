const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function listGeminiModels() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Listing available Gemini models...\n');
  
  try {
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
    
    console.log('✅ Available Models:\n');
    response.data.models.forEach(model => {
      console.log(`Model: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log(`  Vision: ${model.supportedGenerationMethods.includes('generateContent') ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Filter models that support generateContent
    const visionModels = response.data.models.filter(m => 
      m.supportedGenerationMethods.includes('generateContent')
    );
    
    console.log('\n📸 Models that support Vision (generateContent):');
    visionModels.forEach(model => {
      console.log(`  - ${model.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error listing models:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

listGeminiModels();

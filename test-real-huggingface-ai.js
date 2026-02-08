const axios = require('axios');

// Test Hugging Face REAL AI
async function testHuggingFaceAI() {
    const apiKey = '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';
    
    console.log('🤖 Testing REAL Hugging Face AI...');
    
    // Create a simple test image (1x1 pixel PNG in base64)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    try {
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(testImageBase64, 'base64');
        
        console.log('📡 Sending request to Hugging Face BLIP model...');
        
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base', 
            imageBuffer, 
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/octet-stream'
                },
                timeout: 30000 // 30 second timeout
            }
        );
        
        console.log('✅ SUCCESS! Hugging Face AI Response:', response.data);
        
        if (response.data && Array.isArray(response.data) && response.data[0]) {
            const description = response.data[0].generated_text || response.data[0].caption || '';
            console.log('🎯 AI Generated Description:', description);
            console.log('🚀 REAL AI IS WORKING! Your Hugging Face key is valid!');
        } else {
            console.log('⚠️ Unexpected response format:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Hugging Face AI Error:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
        
        if (error.response?.status === 401) {
            console.log('🔑 API Key issue - might need a new one');
        } else if (error.response?.status === 503) {
            console.log('⏳ Model is loading - try again in a few seconds');
        }
    }
}

testHuggingFaceAI();
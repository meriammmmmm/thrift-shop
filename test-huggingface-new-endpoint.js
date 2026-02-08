const axios = require('axios');

async function testNewHuggingFaceEndpoint() {
    console.log('🤖 Testing NEW Hugging Face endpoint...');
    
    const apiKey = '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';
    
    // Create a simple test image (red square)
    const canvas = require('canvas').createCanvas(100, 100);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);
    
    const imageBuffer = canvas.toBuffer('image/png');
    
    try {
        console.log('📡 Sending to NEW Hugging Face router endpoint...');
        
        const response = await axios.post(
            'https://router.huggingface.co/models/Salesforce/blip-image-captioning-base',
            imageBuffer,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/octet-stream'
                },
                timeout: 30000
            }
        );
        
        console.log('✅ SUCCESS! New endpoint working!');
        console.log('🤖 AI Response:', response.data);
        
        // Parse response
        let aiDescription = '';
        if (response.data && Array.isArray(response.data) && response.data[0]) {
            aiDescription = response.data[0].generated_text || response.data[0].caption || '';
        } else if (response.data && response.data.generated_text) {
            aiDescription = response.data.generated_text;
        } else if (response.data && typeof response.data === 'string') {
            aiDescription = response.data;
        }
        
        console.log('🎯 AI Description:', aiDescription);
        
        if (aiDescription) {
            console.log('🚀 REAL AI IS WORKING WITH NEW ENDPOINT!');
        }
        
    } catch (error) {
        console.error('❌ New endpoint failed:', error.response?.status, error.response?.data || error.message);
        
        // Try the old endpoint as fallback
        console.log('🔄 Trying old endpoint as fallback...');
        
        try {
            const fallbackResponse = await axios.post(
                'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
                imageBuffer,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/octet-stream'
                    },
                    timeout: 30000
                }
            );
            
            console.log('✅ Fallback endpoint working!');
            console.log('🤖 AI Response:', fallbackResponse.data);
            
        } catch (fallbackError) {
            console.error('❌ Both endpoints failed:', fallbackError.response?.status, fallbackError.response?.data || fallbackError.message);
        }
    }
}

testNewHuggingFaceEndpoint();
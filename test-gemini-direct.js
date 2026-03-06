const axios = require('axios');

async function testGeminiDirect() {
    const apiKey = 'AIzaSyBOu6JrIypefqgJejh3PZ5vaUVtpYjg_Lw';
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    console.log('🔍 Testing Gemini API directly...');
    
    // Simple text test first
    try {
        const textResponse = await axios.post(`${endpoint}?key=${apiKey}`, {
            contents: [{
                parts: [{ text: "Hello, can you see this message?" }]
            }]
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        
        console.log('✅ Gemini text API working!');
        console.log('Response:', textResponse.data.candidates[0].content.parts[0].text);
        
        // Now test with a simple image
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        const imageResponse = await axios.post(`${endpoint}?key=${apiKey}`, {
            contents: [{
                parts: [
                    { text: "What do you see in this image?" },
                    {
                        inline_data: {
                            mime_type: "image/png",
                            data: testImageBase64
                        }
                    }
                ]
            }]
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        
        console.log('✅ Gemini vision API working!');
        console.log('Vision Response:', imageResponse.data.candidates[0].content.parts[0].text);
        
    } catch (error) {
        console.error('❌ Gemini API Error:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
    }
}

testGeminiDirect();
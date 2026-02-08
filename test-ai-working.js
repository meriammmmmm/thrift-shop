#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

console.log('🤖 Testing REAL AI Image Analysis...\n');

// Test configuration
const API_BASE = 'http://localhost:5001/api';
const ADMIN_EMAIL = 'admin@thriftshop.com';
const ADMIN_PASSWORD = 'admin123';

let authToken = null;

// Simple test image (1x1 pixel PNG in base64)
const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function login() {
    try {
        console.log('🔐 Logging in to admin panel...');
        
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        
        if (response.data && response.data.token) {
            authToken = response.data.token;
            console.log('✅ Login successful!');
            return true;
        } else {
            throw new Error('No token received');
        }
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        console.log('💡 Make sure your backend is running on port 5001');
        return false;
    }
}

async function testAIAnalysis() {
    try {
        console.log('🤖 Testing AI image analysis...');
        
        const response = await axios.post(`${API_BASE}/admin/ai/generate-description`, {
            image: TEST_IMAGE,
            productName: '',
            category: '',
            brand: ''
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 AI Response received!');
        
        if (response.data && response.data.success) {
            console.log('✅ REAL AI IS WORKING!');
            console.log('🎯 AI Analysis Result:');
            console.log('   Title:', response.data.data.title);
            console.log('   Description:', response.data.data.description);
            console.log('   Category:', response.data.data.category_suggestion);
            console.log('   Price Range: $' + response.data.data.suggested_price_min + ' - $' + response.data.data.suggested_price_max);
            
            return true;
        } else {
            console.error('❌ AI Analysis failed:', response.data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ AI Test failed:', error.message);
        if (error.response && error.response.data) {
            console.error('   Error details:', error.response.data);
        }
        return false;
    }
}

async function testImageGeneration() {
    try {
        console.log('🎨 Testing AI image generation...');
        
        const response = await axios.post(`${API_BASE}/ai/generate-product-mockup`, {
            productName: 'vintage leather boots',
            category: 'boots',
            style: 'realistic'
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.success) {
            console.log('✅ AI Image Generation working!');
            console.log('🖼️  Generated image URL:', response.data.imageUrl);
            console.log('🤖 Service used:', response.data.service);
            return true;
        } else {
            console.error('❌ Image generation failed:', response.data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Image generation test failed:', error.message);
        return false;
    }
}

async function checkAPIKeys() {
    console.log('🔑 Checking API Keys...');
    
    // Read .env file
    try {
        const envContent = fs.readFileSync('./backend/.env', 'utf8');
        
        const hasHuggingFace = envContent.includes('HUGGINGFACE_API_KEY=hf_');
        const hasOpenAI = envContent.includes('OPENAI_API_KEY=sk-');
        const hasGemini = envContent.includes('GEMINI_API_KEY=AIza');
        
        console.log('   Hugging Face API:', hasHuggingFace ? '✅ Present' : '❌ Missing');
        console.log('   OpenAI API:', hasOpenAI ? '✅ Present' : '❌ Missing (optional)');
        console.log('   Gemini API:', hasGemini ? '✅ Present' : '❌ Missing (optional)');
        
        if (hasHuggingFace) {
            console.log('🚀 Hugging Face REAL AI is configured!');
        }
        
        return hasHuggingFace;
    } catch (error) {
        console.error('❌ Could not read .env file:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('=' .repeat(50));
    console.log('🤖 REAL AI SYSTEM TEST');
    console.log('=' .repeat(50));
    
    // Check API keys
    const hasKeys = checkAPIKeys();
    if (!hasKeys) {
        console.log('\n❌ No valid API keys found. Please check your .env file.');
        return;
    }
    
    console.log('');
    
    // Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        return;
    }
    
    console.log('');
    
    // Test AI analysis
    const aiSuccess = await testAIAnalysis();
    
    console.log('');
    
    // Test image generation
    const genSuccess = await testImageGeneration();
    
    console.log('');
    console.log('=' .repeat(50));
    console.log('📊 TEST RESULTS');
    console.log('=' .repeat(50));
    console.log('Backend Connection:', loginSuccess ? '✅ Working' : '❌ Failed');
    console.log('AI Image Analysis:', aiSuccess ? '✅ Working' : '❌ Failed');
    console.log('AI Image Generation:', genSuccess ? '✅ Working' : '❌ Failed');
    
    if (aiSuccess && genSuccess) {
        console.log('\n🎉 ALL SYSTEMS GO! Your REAL AI is working perfectly!');
        console.log('🚀 You can now use AI image analysis in your admin panel!');
    } else {
        console.log('\n⚠️  Some issues detected. Check the errors above.');
    }
    
    console.log('\n💡 To use in admin panel:');
    console.log('   1. Go to http://localhost:3005');
    console.log('   2. Navigate to "Add Product"');
    console.log('   3. Upload an image');
    console.log('   4. Watch AI analyze it automatically!');
}

// Run the tests
runTests().catch(error => {
    console.error('💥 Test script failed:', error.message);
});
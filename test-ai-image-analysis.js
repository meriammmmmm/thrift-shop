const aiService = require('./backend/services/aiService');

// Test the AI image analysis with your boot image
async function testAIAnalysis() {
  console.log('🧪 Testing AI Image Analysis...');
  
  // Your boot image as base64 (sample - you'd replace with actual base64)
  const bootImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  
  try {
    // Test with Gemini (you have this API key)
    console.log('Testing Gemini AI...');
    const result = await aiService.generateProductDescription(bootImageBase64, '', '', '');
    
    console.log('✅ AI Analysis Result:');
    console.log('Title:', result.data.title);
    console.log('Category:', result.data.category_suggestion);
    console.log('Description:', result.data.description.substring(0, 100) + '...');
    console.log('Features:', result.data.features);
    console.log('Price Range:', `$${result.data.suggested_price_min} - $${result.data.suggested_price_max}`);
    
  } catch (error) {
    console.error('❌ AI Analysis Failed:', error.message);
  }
}

// Run the test
testAIAnalysis();
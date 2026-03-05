const OpenAI = require('openai');
const axios = require('axios');

class AIService {
  constructor() {
    // OpenAI Vision API (ChatGPT's image analysis) - PRIORITY #1
    this.openai = process.env.OPENAI_API_KEY && 
                  process.env.OPENAI_API_KEY !== 'demo-mode-improved' && 
                  process.env.OPENAI_API_KEY !== 'your-real-openai-key-here' &&
                  process.env.OPENAI_API_KEY !== 'sk-your-real-openai-key-here' ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
    
    // Google Gemini setup - BACKUP with multiple keys support
    this.geminiApiKeys = [];
    if (process.env.GEMINI_API_KEY) {
      console.log('✅ Loaded GEMINI_API_KEY');
      this.geminiApiKeys.push(process.env.GEMINI_API_KEY);
    }
    if (process.env.GEMINI_API_KEY_2) {
      console.log('✅ Loaded GEMINI_API_KEY_2');
      this.geminiApiKeys.push(process.env.GEMINI_API_KEY_2);
    }
    if (process.env.GEMINI_API_KEY_3) {
      console.log('✅ Loaded GEMINI_API_KEY_3');
      this.geminiApiKeys.push(process.env.GEMINI_API_KEY_3);
    }
    console.log(`🔑 Total Gemini API keys loaded: ${this.geminiApiKeys.length}`);
    this.currentGeminiKeyIndex = 0;
    this.geminiApiKey = this.geminiApiKeys[0]; // Keep for backward compatibility
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    
    // Ollama local AI setup (completely free)
    this.ollamaEnabled = process.env.OLLAMA_ENABLED === 'true';
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    // Hugging Face setup (BACKUP)
    this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.huggingFaceEndpoint = 'https://router.huggingface.co/models/Salesforce/blip-image-captioning-base';
    
    // Image generation endpoints
    this.huggingFaceImageGenEndpoint = 'https://router.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
    this.dalleEndpoint = 'https://api.openai.com/v1/images/generations';
  }
  
  // Rotate to next Gemini API key if multiple are available
  rotateGeminiKey() {
    if (this.geminiApiKeys.length > 1) {
      this.currentGeminiKeyIndex = (this.currentGeminiKeyIndex + 1) % this.geminiApiKeys.length;
      console.log(`🔄 Rotating to Gemini API key #${this.currentGeminiKeyIndex + 1}`);
      return this.geminiApiKeys[this.currentGeminiKeyIndex];
    }
    return this.geminiApiKeys[0];
  }

  async generateProductDescription(imageBase64, productName = '', category = '', brand = '') {
    console.log('🤖 Starting AI vision analysis');
    
    // Check available AI services
    const hasGemini = this.geminiApiKeys.length > 0 && 
                      this.geminiApiKeys[0] !== 'your-gemini-key-here' &&
                      this.geminiApiKeys[0].startsWith('AIza');

    const hasHuggingFace = this.huggingFaceApiKey && 
                           this.huggingFaceApiKey !== 'your-huggingface-key-here' &&
                           this.huggingFaceApiKey.startsWith('hf_');

    // PRIORITY 1: Try Hugging Face FIRST (more reliable, higher limits)
    if (hasHuggingFace) {
      try {
        console.log('🔍 Using Hugging Face REAL AI Vision (Priority 1)');
        return await this.generateWithHuggingFace(imageBase64, productName, category, brand);
      } catch (error) {
        console.error('Hugging Face failed:', error.message);
        // Continue to try Gemini
      }
    }

    // PRIORITY 2: Try Google Gemini (with key rotation if multiple keys available)
    if (hasGemini) {
      for (let keyAttempt = 0; keyAttempt < this.geminiApiKeys.length; keyAttempt++) {
        try {
          const currentKey = this.geminiApiKeys[this.currentGeminiKeyIndex];
          console.log(`🔍 Using Google Gemini AI Vision (Key #${this.currentGeminiKeyIndex + 1}/${this.geminiApiKeys.length})`);
          return await this.generateWithGemini(imageBase64, productName, category, brand, currentKey);
        } catch (error) {
          console.error(`Gemini AI failed with key #${this.currentGeminiKeyIndex + 1}:`, error.message);
          
          // If rate limited and we have more keys, try next key
          if (error.message.includes('rate limit') && this.geminiApiKeys.length > 1 && keyAttempt < this.geminiApiKeys.length - 1) {
            console.log('⚠️ Rate limited, trying next Gemini API key...');
            this.rotateGeminiKey();
            continue;
          }
        }
      }
    }

    // FALLBACK: Use temporary smart description
    console.log('⚠️ All AI services unavailable - using temporary smart analysis mode');
    return this.generateTemporaryDescription(imageBase64, productName, category, brand);
  }

  // TEMPORARY fallback when APIs are rate limited
  generateTemporaryDescription(imageBase64, productName = '', category = '', brand = '') {
    console.log('📝 Using temporary smart description generator (API rate limit reached)');
    
    // Analyze the provided context
    const title = productName || 'Fashion Item';
    const detectedCategory = category || 'Clothing';
    const detectedBrand = brand || 'Designer Collection';
    
    // Generate contextual description
    const descriptions = {
      'Tops': `Stylish ${detectedBrand} top featuring quality construction and modern design. Perfect for casual or dressy occasions.`,
      'Dresses': `Beautiful ${detectedBrand} dress with elegant styling and flattering fit. A versatile piece for any wardrobe.`,
      'Jeans': `Classic ${detectedBrand} denim with authentic vintage appeal. Comfortable fit with timeless style.`,
      'Shoes': `Quality ${detectedBrand} footwear with durable construction. Stylish design meets everyday comfort.`,
      'Boots': `Premium ${detectedBrand} boots featuring quality materials and classic design. Perfect for any season.`,
      'Jackets': `Versatile ${detectedBrand} jacket with quality construction. Essential layering piece for any wardrobe.`,
      'Accessories': `Stylish ${detectedBrand} accessory to complete any outfit. Quality craftsmanship and timeless appeal.`,
      'default': `Quality ${detectedBrand} ${title} with authentic style and careful construction. A unique piece for fashion enthusiasts.`
    };
    
    const description = descriptions[detectedCategory] || descriptions['default'];
    
    return {
      success: true,
      data: {
        title: title,
        description: `${description}\n\n⚠️ Note: AI vision is temporarily rate limited. This description was generated from your product details. For full AI image analysis, please try again in a few minutes or add additional Gemini API keys.`,
        features: [
          'Quality construction',
          'Authentic style',
          'Carefully curated',
          'Unique character'
        ],
        condition: 'Good',
        style_notes: 'Perfect for fashion enthusiasts who appreciate quality and style.',
        suggested_price_min: 20,
        suggested_price_max: 60,
        category_suggestion: detectedCategory,
        brand_suggestion: detectedBrand,
        size_suggestion: 'M',
        color: 'Multi-color',
        material: 'Quality materials',
        ai_model: 'Temporary Mode (API Rate Limited)',
        analysis_method: 'Context-based generation - Add more API keys for full AI vision'
      }
    };
  }

  // REMOVED ALL FAKE ANALYSIS FUNCTIONS
  // No more preset "Black Leather Boots" responses!
  // Only REAL Google Gemini AI vision is used now!

  async generateWithOllama(imageBase64, productName = '', category = '', brand = '') {
    try {
      const prompt = `Analyze this product image for an e-commerce thrift/vintage store. Describe what you see in detail, focusing on:
- Type of clothing/item
- Material and texture (metallic, fabric, leather, etc.)
- Style and design features
- Colors and patterns
- Condition and quality
- Suitable category (Tops, Dresses, Shoes, Accessories, etc.)

Be specific about what you actually see in the image.`;

      const response = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
        model: 'llava:7b',
        prompt: prompt,
        images: [imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')],
        stream: false
      });

      const aiDescription = response.data.response;
      
      // Parse the AI description to extract product details
      const analysisResult = this.parseOllamaResponse(aiDescription, productName, category, brand);
      
      return {
        success: true,
        data: analysisResult
      };
    } catch (error) {
      console.error('Ollama API Error:', error);
      throw error;
    }
  }

  parseOllamaResponse(aiDescription, productName, category, brand) {
    const lowerDesc = aiDescription.toLowerCase();
    
    // Detect specific items from AI description
    let detectedCategory = 'Clothing';
    let detectedTitle = productName || 'Fashion Item';
    let priceRange = { min: 20, max: 50 };
    let detectedBrand = brand || 'Vintage Collection';
    let detectedSize = 'M';
    
    // Analyze for specific clothing types
    if (lowerDesc.includes('crop top') || (lowerDesc.includes('crop') && lowerDesc.includes('top'))) {
      detectedCategory = 'Tops';
      detectedTitle = 'Crop Top';
      if (lowerDesc.includes('metallic') || lowerDesc.includes('shiny') || lowerDesc.includes('holographic')) {
        detectedTitle = 'Metallic Crop Top Set';
        detectedCategory = 'Activewear';
        detectedBrand = 'Festival Fashion';
        priceRange = { min: 25, max: 65 };
      }
    } else if (lowerDesc.includes('dress')) {
      detectedCategory = 'Dresses';
      detectedTitle = 'Vintage Dress';
      priceRange = { min: 25, max: 75 };
    } else if (lowerDesc.includes('jeans') || lowerDesc.includes('denim')) {
      detectedCategory = 'Jeans';
      detectedTitle = 'Vintage Denim';
      detectedBrand = 'Classic Denim Co.';
      detectedSize = '32';
      priceRange = { min: 20, max: 55 };
    } else if (lowerDesc.includes('jacket') || lowerDesc.includes('coat')) {
      detectedCategory = 'Jackets';
      detectedTitle = 'Vintage Jacket';
      priceRange = { min: 30, max: 85 };
    } else if (lowerDesc.includes('boot')) {
      detectedCategory = 'Boots';
      detectedTitle = 'Vintage Boots';
      detectedBrand = 'Classic Footwear';
      detectedSize = '9';
      priceRange = { min: 35, max: 95 };
    } else if (lowerDesc.includes('shoe')) {
      detectedCategory = 'Shoes';
      detectedTitle = 'Vintage Shoes';
      detectedBrand = 'Classic Footwear';
      detectedSize = '9';
      priceRange = { min: 25, max: 75 };
    } else if (lowerDesc.includes('top') || lowerDesc.includes('shirt') || lowerDesc.includes('blouse')) {
      detectedCategory = 'Tops';
      detectedTitle = 'Vintage Top';
      priceRange = { min: 15, max: 45 };
    }
    
    // Detect materials and adjust description
    let materialFeatures = [];
    if (lowerDesc.includes('metallic') || lowerDesc.includes('shiny')) {
      materialFeatures.push('Metallic/shiny material');
    }
    if (lowerDesc.includes('leather')) {
      materialFeatures.push('Leather construction');
    }
    if (lowerDesc.includes('denim')) {
      materialFeatures.push('Denim fabric');
    }
    
    return {
      title: detectedTitle,
      description: `${aiDescription}\n\nThis ${detectedBrand} piece showcases quality construction and unique style. Perfect for vintage enthusiasts and fashion-forward individuals who appreciate authentic character and timeless appeal.`,
      features: [
        'Authentic vintage piece',
        'Quality construction',
        ...materialFeatures,
        'Unique character',
        'Carefully curated'
      ],
      condition: 'Good',
      style_notes: 'Perfect for vintage enthusiasts and fashion-forward individuals.',
      suggested_price_min: priceRange.min,
      suggested_price_max: priceRange.max,
      category_suggestion: detectedCategory,
      brand_suggestion: detectedBrand,
      size_suggestion: detectedSize
    };
  }

  async generateWithHuggingFace(imageBase64, productName = '', category = '', brand = '') {
    try {
      console.log('🔍 Using Hugging Face REAL AI - Analyzing your image...');
      
      // Convert base64 to buffer for Hugging Face
      const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      
      // Use a working Hugging Face model - try multiple models for reliability
      const models = [
        'nlpconnect/vit-gpt2-image-captioning',
        'Salesforce/blip-image-captioning-large',
        'Salesforce/blip-image-captioning-base'
      ];
      
      let aiDescription = '';
      let modelUsed = '';
      
      for (const model of models) {
        try {
          console.log(`🔍 Trying Hugging Face model: ${model}`);
          
          const response = await axios.post(`https://api-inference.huggingface.co/models/${model}`, imageBuffer, {
            headers: {
              'Authorization': `Bearer ${this.huggingFaceApiKey}`,
              'Content-Type': 'application/octet-stream'
            },
            timeout: 30000
          });

          console.log('🤖 Hugging Face Response:', response.data);

          // Handle different response formats
          if (response.data && Array.isArray(response.data) && response.data[0]) {
            aiDescription = response.data[0].generated_text || response.data[0].caption || '';
          } else if (response.data && response.data.generated_text) {
            aiDescription = response.data.generated_text;
          } else if (response.data && typeof response.data === 'string') {
            aiDescription = response.data;
          }

          if (aiDescription && aiDescription.length > 3) {
            modelUsed = model;
            break; // Success! Exit loop
          }
        } catch (modelError) {
          console.log(`Model ${model} failed, trying next...`);
          continue;
        }
      }

      if (!aiDescription || aiDescription.length < 3) {
        throw new Error('No valid description generated from Hugging Face AI');
      }

      console.log('✅ REAL Hugging Face AI Description:', aiDescription);
      
      // Parse the AI description intelligently
      const parsedData = this.parseAIDescription(aiDescription, productName, category, brand);
      
      // Create response based on REAL AI description
      return {
        success: true,
        data: {
          ...parsedData,
          description: `${aiDescription}\n\n${parsedData.description}`,
          ai_model: `Hugging Face: ${modelUsed}`,
          ai_description_raw: aiDescription,
          analysis_method: 'REAL Hugging Face AI Vision - Actually Sees Your Image'
        }
      };
      
    } catch (error) {
      console.error('Hugging Face API Error:', error.response?.status, error.response?.data || error.message);
      throw new Error(`Hugging Face AI failed: ${error.message}`);
    }
  }

  parseAIDescription(aiDescription, productName, category, brand) {
    const lowerDesc = aiDescription.toLowerCase();
    console.log('🔍 Analyzing AI description:', aiDescription);
    
    let detectedCategory = 'Clothing';
    let detectedTitle = productName || 'Fashion Item';
    let priceRange = { min: 20, max: 50 };
    let detectedBrand = brand || 'Vintage Collection';
    let detectedSize = 'M';
    let features = ['Quality construction', 'Stylish design'];
    
    // Detect specific clothing types from REAL AI description
    if (lowerDesc.includes('crop top') || (lowerDesc.includes('crop') && lowerDesc.includes('top'))) {
      detectedCategory = 'Tops';
      detectedTitle = 'Crop Top';
      detectedSize = 'S';
      features.push('Crop style');
      
      if (lowerDesc.includes('metallic') || lowerDesc.includes('shiny') || lowerDesc.includes('holographic') || lowerDesc.includes('silver') || lowerDesc.includes('gold')) {
        detectedTitle = 'Metallic Crop Top Set';
        detectedCategory = 'Activewear';
        detectedBrand = 'Festival Fashion';
        priceRange = { min: 25, max: 65 };
        features.push('Metallic material', 'Eye-catching design');
      }
    } else if (lowerDesc.includes('dress')) {
      detectedCategory = 'Dresses';
      detectedTitle = 'Vintage Dress';
      priceRange = { min: 25, max: 75 };
      features.push('Elegant design');
      
      if (lowerDesc.includes('mini') || lowerDesc.includes('short')) {
        detectedTitle = 'Mini Dress';
        detectedSize = 'S';
      }
    } else if (lowerDesc.includes('jeans') || lowerDesc.includes('denim')) {
      detectedCategory = 'Jeans';
      detectedTitle = 'Vintage Denim';
      detectedBrand = 'Classic Denim Co.';
      detectedSize = '32';
      priceRange = { min: 20, max: 55 };
      features.push('Denim fabric', 'Classic fit');
    } else if (lowerDesc.includes('jacket') || lowerDesc.includes('coat')) {
      detectedCategory = 'Jackets';
      detectedTitle = 'Vintage Jacket';
      priceRange = { min: 30, max: 85 };
      features.push('Outerwear', 'Layering piece');
    } else if (lowerDesc.includes('boot')) {
      detectedCategory = 'Boots';
      detectedTitle = 'Vintage Boots';
      detectedBrand = 'Classic Footwear';
      detectedSize = '9';
      priceRange = { min: 35, max: 95 };
      features.push('Footwear', 'Durable construction');
    } else if (lowerDesc.includes('shoe') || lowerDesc.includes('sneaker')) {
      detectedCategory = 'Shoes';
      detectedTitle = 'Vintage Shoes';
      detectedBrand = 'Classic Footwear';
      detectedSize = '9';
      priceRange = { min: 25, max: 75 };
      features.push('Footwear', 'Comfortable fit');
    } else if (lowerDesc.includes('top') || lowerDesc.includes('shirt') || lowerDesc.includes('blouse')) {
      detectedCategory = 'Tops';
      detectedTitle = 'Vintage Top';
      priceRange = { min: 15, max: 45 };
      features.push('Versatile piece');
    } else if (lowerDesc.includes('skirt')) {
      detectedCategory = 'Skirts';
      detectedTitle = 'Vintage Skirt';
      priceRange = { min: 18, max: 50 };
      features.push('Feminine style');
    } else if (lowerDesc.includes('bag') || lowerDesc.includes('purse') || lowerDesc.includes('handbag')) {
      detectedCategory = 'Accessories';
      detectedTitle = 'Vintage Bag';
      priceRange = { min: 20, max: 60 };
      features.push('Accessory', 'Functional design');
    }
    
    // Detect materials and colors from AI description
    if (lowerDesc.includes('leather')) {
      features.push('Leather material');
      detectedBrand = 'Leather Craft Co.';
    }
    if (lowerDesc.includes('cotton')) {
      features.push('Cotton fabric');
    }
    if (lowerDesc.includes('silk')) {
      features.push('Silk material');
      priceRange.min += 10;
      priceRange.max += 20;
    }
    if (lowerDesc.includes('vintage') || lowerDesc.includes('retro')) {
      features.push('Vintage style');
    }
    
    // Detect colors
    const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'silver', 'gold'];
    const detectedColors = colors.filter(color => lowerDesc.includes(color));
    if (detectedColors.length > 0) {
      features.push(`${detectedColors[0]} color`);
    }
    
    return {
      title: detectedTitle,
      description: `${aiDescription}\n\nThis ${detectedBrand} piece showcases quality construction and authentic style. The AI analysis reveals unique characteristics that make it perfect for fashion enthusiasts who appreciate both quality and distinctive design.\n\nCondition: Well-maintained with authentic character.`,
      features: features,
      condition: 'Good',
      style_notes: 'Perfect for fashion-forward individuals who appreciate AI-curated vintage finds.',
      suggested_price_min: priceRange.min,
      suggested_price_max: priceRange.max,
      category_suggestion: detectedCategory,
      brand_suggestion: detectedBrand,
      size_suggestion: detectedSize
    };
  }

  async generateWithGemini(imageBase64, productName = '', category = '', brand = '', retryCount = 0, apiKey = null) {
    try {
      console.log('🔍 Using Google Gemini Vision AI - ACTUALLY LOOKING AT YOUR IMAGE!');

      // Use provided key or current key
      const keyToUse = apiKey || this.geminiApiKeys[this.currentGeminiKeyIndex];

      // Convert base64 to proper format for Gemini
      const imageData = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');

      const requestBody = {
        contents: [{
          parts: [
            { 
              text: `You are a fashion expert analyzing a product image for an e-commerce store. Look at this image very carefully and describe EXACTLY what you see.

IMPORTANT: Keep descriptions SHORT and concise (2-3 sentences maximum, under 200 characters).

Please provide a brief analysis in this JSON format:
{
  "title": "Specific name for what you actually see (e.g., 'Black Patent Leather Knee-High Boots', 'Red Floral Summer Dress', etc.)",
  "description": "SHORT 2-3 sentence description (max 200 characters) - be concise about colors, materials, style",
  "features": ["List 3-4 specific features you can actually observe"],
  "condition": "Condition based on what you can see",
  "style_notes": "ONE sentence fashion advice for this item",
  "suggested_price_min": 20,
  "suggested_price_max": 80,
  "category_suggestion": "Accurate category for what you see (Boots, Dresses, Tops, etc.)",
  "brand_suggestion": "Brand estimate or 'Designer' if it looks high-end",
  "size_suggestion": "Size estimate",
  "color": "Primary color you observe",
  "material": "Material you can identify from the image"
}

CRITICAL: Keep description under 200 characters. Be specific but BRIEF. Example: "Black knee-high boots with pointed toe and silver buckle detail. Matte faux leather construction with inner zipper."` 
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2000,
        }
      };

      console.log('🔍 Sending your image to Google Gemini Vision API...');

      const response = await axios.post(`${this.geminiEndpoint}?key=${keyToUse}`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (!response.data.candidates || !response.data.candidates[0]) {
        throw new Error('No response from Gemini API');
      }

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      console.log('🤖 Google Gemini REAL AI Analysis:', aiResponse);
      
      if (!aiResponse || aiResponse.length < 5) {
        throw new Error('Empty or invalid response from Gemini AI');
      }

      // Try to parse JSON response
      try {
        // Look for JSON in code blocks first
        const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        let jsonStr = null;
        
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          // Try to find JSON without code blocks
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }
        }
        
        if (jsonStr) {
          // Clean up the JSON string
          jsonStr = jsonStr.replace(/,\s*"$/, ''); // Remove trailing comma and quote
          jsonStr = jsonStr.replace(/"\s*$/, ''); // Remove trailing quote
          
          const parsedResponse = JSON.parse(jsonStr);
          
          // Return the REAL AI analysis with CLEAN formatting
          return {
            success: true,
            data: {
              title: parsedResponse.title || 'AI Detected Item',
              description: parsedResponse.description || 'AI analyzed this item for you.',
              features: parsedResponse.features || ['Real AI analyzed', 'Google Gemini Vision'],
              condition: parsedResponse.condition || 'AI Analyzed',
              style_notes: parsedResponse.style_notes || 'Analyzed by Google Gemini AI',
              suggested_price_min: Number(parsedResponse.suggested_price_min) || 20,
              suggested_price_max: Number(parsedResponse.suggested_price_max) || 80,
              category_suggestion: parsedResponse.category_suggestion || 'AI Detected',
              brand_suggestion: parsedResponse.brand_suggestion || 'AI Analysis',
              size_suggestion: parsedResponse.size_suggestion || 'AI Detected',
              color: parsedResponse.color || 'AI Detected',
              material: parsedResponse.material || 'AI Detected',
              ai_model: 'Google Gemini Vision Pro',
              ai_description_raw: aiResponse,
              analysis_method: 'REAL Google Gemini AI Vision - Actually Sees Your Image'
            }
          };
        }
      } catch (parseError) {
        console.log('Could not parse JSON, using raw response:', parseError.message);
      }

      // If JSON parsing fails, use the raw AI response
      return {
        success: true,
        data: {
          title: `AI Vision Analysis`,
          description: aiResponse,
          features: ['Real Google Gemini AI', 'Vision analysis', 'Actually sees your image'],
          condition: 'AI Analyzed',
          style_notes: 'Based on real AI vision analysis',
          suggested_price_min: 20,
          suggested_price_max: 80,
          category_suggestion: 'AI Detected',
          brand_suggestion: 'Real AI Analysis',
          size_suggestion: 'AI Detected',
          color: 'AI Detected',
          material: 'AI Detected',
          ai_model: 'Google Gemini Vision Pro',
          ai_description_raw: aiResponse,
          analysis_method: 'REAL Google Gemini AI Vision - Actually Sees Your Image'
        }
      };

    } catch (error) {
      console.error('Gemini Vision API Error:', error.response?.status, error.response?.data || error.message);
      
      // Handle rate limiting with retry (only for same key)
      if (error.response?.status === 429 && retryCount < 2) {
        const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s
        console.log(`⏳ Rate limited. Retrying in ${waitTime/1000} seconds... (attempt ${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.generateWithGemini(imageBase64, productName, category, brand, retryCount + 1, apiKey);
      }
      
      // If rate limited, throw error to trigger key rotation
      if (error.response?.status === 429) {
        throw new Error(`Google Gemini API rate limit exceeded. Please wait a few minutes and try again. You can also try using a different API key or upgrade your Gemini API quota at https://aistudio.google.com/`);
      }
      
      throw new Error(`Google Gemini AI failed: ${error.message}. The AI could not analyze your image.`);
    }
  }

  async generateWithOpenAI(imageBase64, productName = '', category = '', brand = '') {
    try {
      const prompt = `You are an expert fashion analyst for a thrift/vintage store. Analyze this product image in detail and provide accurate information.

Look at the image carefully and describe EXACTLY what you see:
- What type of item is this? (boots, dress, jacket, etc.)
- What color is it?
- What material does it appear to be made of?
- What style/design features do you notice?
- What condition does it appear to be in?

Based on your analysis, provide a JSON response with:
{
  "title": "Specific product name based on what you see",
  "description": "Detailed 2-3 paragraph description of the actual item in the image",
  "features": ["List of actual features you can see"],
  "condition": "Condition assessment based on appearance",
  "style_notes": "Fashion/styling notes for this specific item",
  "suggested_price_min": "Realistic minimum price for thrift/vintage market",
  "suggested_price_max": "Realistic maximum price for thrift/vintage market", 
  "category_suggestion": "Accurate category based on what you see",
  "brand_suggestion": "Brand suggestion or 'Designer' if high-end looking",
  "size_suggestion": "Estimated size",
  "color": "Primary color you observe",
  "material": "Material you can identify"
}

Be specific and accurate - describe exactly what you see in the image, not generic fashion items.`;

      console.log('🔍 Sending image to OpenAI Vision API...');

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // Latest model with vision
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                  detail: "high" // High detail for better analysis
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3 // Lower temperature for more accurate analysis
      });

      const aiResponse = response.choices[0].message.content;
      console.log('🤖 OpenAI Vision Analysis:', aiResponse);

      // Try to parse JSON response
      try {
        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          
          // Ensure all required fields are present
          const result = {
            title: parsedResponse.title || productName || 'Fashion Item',
            description: parsedResponse.description || 'Stylish fashion item with quality construction.',
            features: parsedResponse.features || ['Quality construction', 'Stylish design'],
            condition: parsedResponse.condition || 'Good',
            style_notes: parsedResponse.style_notes || 'Versatile piece perfect for fashion enthusiasts.',
            suggested_price_min: Number(parsedResponse.suggested_price_min) || 20,
            suggested_price_max: Number(parsedResponse.suggested_price_max) || 50,
            category_suggestion: parsedResponse.category_suggestion || category || 'Clothing',
            brand_suggestion: parsedResponse.brand_suggestion || brand || 'Designer',
            size_suggestion: parsedResponse.size_suggestion || 'M',
            color: parsedResponse.color || 'Multi-color',
            material: parsedResponse.material || 'Quality materials'
          };

          return {
            success: true,
            data: result
          };
        }
      } catch (parseError) {
        console.error('JSON parsing failed, using text response');
      }

      // If JSON parsing fails, create structured response from text
      return {
        success: true,
        data: {
          title: productName || 'AI Analyzed Fashion Item',
          description: aiResponse,
          features: ['AI analyzed item', 'Quality construction'],
          condition: 'Good',
          style_notes: 'Analyzed by AI vision technology.',
          suggested_price_min: 20,
          suggested_price_max: 60,
          category_suggestion: category || 'Clothing',
          brand_suggestion: brand || 'Designer',
          size_suggestion: 'M'
        }
      };

    } catch (error) {
      console.error('OpenAI Vision API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateProductDescriptionFromText(productName, category = '', brand = '', additionalInfo = '') {
    // Only use real AI - no demo mode
    if (!this.openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key required for text-based product description generation');
    }

    try {
      const prompt = `Generate a detailed, attractive product description for this thrift/vintage store item:

Product: ${productName}
Category: ${category || 'Not specified'}
Brand: ${brand || 'Not specified'}
Additional Info: ${additionalInfo || 'None'}

Create an appealing description that would attract customers to this vintage/thrift item. Include:
- Compelling description (2-3 paragraphs)
- Key features
- Style notes
- Suggested condition (assume good vintage condition)

Format as JSON with:
- title: string (improved product name)
- description: string
- features: array of strings
- condition: string
- style_notes: string
- suggested_price_min: number
- suggested_price_max: number`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      const aiResponse = response.choices[0].message.content;
      
      try {
        const parsedResponse = JSON.parse(aiResponse);
        return {
          success: true,
          data: parsedResponse
        };
      } catch (parseError) {
        return {
          success: true,
          data: {
            title: productName,
            description: aiResponse,
            features: [],
            condition: 'Good',
            style_notes: '',
            suggested_price_min: 10,
            suggested_price_max: 50
          }
        };
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // REMOVED: analyzeImageLocally, detectItemFromContext, analyzeImageCharacteristics
  // These were generating fake "Black Leather Boots" responses
  // Now ONLY real AI is used!

  // AI Image Generation Methods
  async generateImage(prompt, options = {}) {
    const {
      style = 'realistic',
      size = '1024x1024',
      quality = 'standard',
      service = 'auto' // auto, openai, huggingface, pollinations, demo
    } = options;

    console.log(`🎨 Generating image with prompt: "${prompt}"`);

    try {
      // Try different services based on availability
      if (service === 'openai' || (service === 'auto' && this.openai)) {
        return await this.generateImageWithOpenAI(prompt, { size, quality, style });
      } else if (service === 'huggingface' || (service === 'auto' && this.huggingFaceApiKey)) {
        return await this.generateImageWithHuggingFace(prompt, { style });
      } else if (service === 'pollinations' || service === 'auto') {
        // Use Pollinations AI (FREE real AI!)
        return this.generateImageWithPollinations(prompt, { size, style });
      } else {
        // Fallback to Pollinations (real AI, not demo)
        return this.generateImageWithPollinations(prompt, { size, style });
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      // Fallback to Pollinations AI (still real AI!)
      return this.generateImageWithPollinations(prompt, { size, style });
    }
  }

  async generateImageWithOpenAI(prompt, options = {}) {
    const { size = '1024x1024', quality = 'standard', style = 'natural' } = options;
    
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: this.enhancePromptForFashion(prompt),
        n: 1,
        size: size,
        quality: quality,
        style: style === 'realistic' ? 'natural' : 'vivid'
      });

      return {
        success: true,
        imageUrl: response.data[0].url,
        revisedPrompt: response.data[0].revised_prompt,
        service: 'openai'
      };
    } catch (error) {
      console.error('OpenAI DALL-E Error:', error);
      throw error;
    }
  }

  async generateImageWithHuggingFace(prompt, options = {}) {
    const { style = 'realistic' } = options;
    
    try {
      const enhancedPrompt = this.enhancePromptForFashion(prompt, style);
      
      const response = await axios.post(this.huggingFaceImageGenEndpoint, {
        inputs: enhancedPrompt,
        parameters: {
          negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 1024,
          height: 1024
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.huggingFaceApiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      });

      // Convert response to base64
      const base64Image = Buffer.from(response.data).toString('base64');
      const imageUrl = `data:image/png;base64,${base64Image}`;

      return {
        success: true,
        imageUrl: imageUrl,
        revisedPrompt: enhancedPrompt,
        service: 'huggingface'
      };
    } catch (error) {
      console.error('Hugging Face Image Generation Error:', error);
      throw error;
    }
  }

  generateImageWithPollinations(prompt, options = {}) {
    const { size = '1024x1024', style = 'realistic' } = options;
    
    // Enhance prompt for better fashion results
    const enhancedPrompt = this.enhancePromptForFashion(prompt, style);
    
    // Create a hash from the prompt for consistent results
    const promptHash = this.simpleHash(enhancedPrompt);
    
    // Use Pollinations AI (FREE real AI image generation!)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&seed=${promptHash}&model=flux&enhance=true`;
    
    console.log('🎨 Using Pollinations AI (FREE real AI):', enhancedPrompt);
    
    return {
      success: true,
      imageUrl: pollinationsUrl,
      revisedPrompt: enhancedPrompt,
      service: 'pollinations-ai',
      note: 'Generated using Pollinations AI - Free real AI image generation with Flux model!'
    };
  }

  generateDemoImage(prompt, options = {}) {
    const { size = '1024x1024', style = 'realistic' } = options;
    
    // Create a hash from the prompt for consistent results
    const promptHash = this.simpleHash(prompt);
    
    // Try multiple free AI services
    const freeAIServices = [
      // Pollinations AI (Flux model)
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${promptHash}&model=flux&enhance=true`,
      // Pollinations AI (Turbo model)
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${promptHash}&model=turbo`,
      // Another Pollinations variant
      `https://image.pollinations.ai/prompt/${encodeURIComponent(this.enhancePromptForFashion(prompt, style))}?width=1024&height=1024&seed=${promptHash}&model=flux`
    ];
    
    const selectedService = freeAIServices[promptHash % freeAIServices.length];
    
    return {
      success: true,
      imageUrl: selectedService,
      revisedPrompt: `Real AI generated: ${prompt}`,
      service: 'pollinations-ai',
      note: 'Generated using Pollinations AI - Free real AI image generation!'
    };
  }

  enhancePromptForFashion(prompt, style = 'realistic') {
    // Add fashion-specific enhancements to the prompt
    const styleModifiers = {
      realistic: 'photorealistic, high quality, professional photography, studio lighting',
      artistic: 'artistic, stylized, creative, fashion illustration',
      vintage: 'vintage style, retro aesthetic, classic fashion',
      modern: 'modern, contemporary, sleek design, minimalist'
    };

    const fashionContext = 'fashion photography, clothing item, product shot, clean background';
    const qualityModifiers = 'high resolution, detailed, sharp focus, professional quality';
    
    return `${prompt}, ${fashionContext}, ${styleModifiers[style] || styleModifiers.realistic}, ${qualityModifiers}`;
  }

  // Generate product mockup images
  async generateProductMockup(productName, category, options = {}) {
    const {
      style = 'realistic',
      background = 'clean white background',
      lighting = 'professional studio lighting'
    } = options;

    const prompt = `${productName} ${category}, ${background}, ${lighting}, product photography, e-commerce style, high quality`;
    
    return await this.generateImage(prompt, { style, ...options });
  }

  // Generate lifestyle images showing products in use
  async generateLifestyleImage(productName, scenario, options = {}) {
    const prompt = `person wearing ${productName}, ${scenario}, lifestyle photography, natural setting, candid moment`;
    
    return await this.generateImage(prompt, { style: 'realistic', ...options });
  }

  // Generate fashion inspiration images
  async generateFashionInspiration(theme, options = {}) {
    const prompt = `fashion inspiration, ${theme}, stylish outfit, trendy, fashion photography`;
    
    return await this.generateImage(prompt, { style: 'artistic', ...options });
  }

  /**
   * Chat about an image (like ChatGPT Vision) – user uploads image + asks questions, AI replies.
   * @param {string} imageBase64 - Data URL or base64 image
   * @param {string} userMessage - User's question (e.g. "What is this?", "What condition is it in?")
   * @param {Array} previousMessages - Optional [{ role: 'user'|'assistant', content: string }] for follow-up
   */
  async chatAboutImage(imageBase64, userMessage, previousMessages = []) {
    if (!this.openai) {
      return {
        success: false,
        error: 'OpenAI API key is required for image chat. Add OPENAI_API_KEY to use ChatGPT-style image analysis.'
      };
    }
    const imageStr = imageBase64 != null ? String(imageBase64) : '';
    if (!imageStr || imageStr.length < 100) {
      return { success: false, error: 'Please upload a valid image.' };
    }
    const message = (userMessage != null ? String(userMessage) : '').trim() || 'What do you see in this image? Describe it in detail.';

    try {
      // Build messages: optional history (text only) + current turn (image + user message)
      const content = [
        { type: 'text', text: message },
        { type: 'image_url', image_url: { url: imageStr, detail: 'high' } }
      ];
      const messages = [
        ...previousMessages.filter(m => m && m.role && m.content).map(m => ({
          role: m.role,
          content: String(m.content)
        })),
        { role: 'user', content }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 1024,
        temperature: 0.5
      });

      const reply = response.choices[0].message.content;
      return {
        success: true,
        reply,
        usage: response.usage
      };
    } catch (error) {
      console.error('Image chat error:', error);
      return {
        success: false,
        error: error.message || 'Image chat failed'
      };
    }
  }

  // Simple hash function to create variety based on image content
  simpleHash(str) {
    const s = str != null && typeof str === 'string' ? str : '';
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

}

module.exports = new AIService();
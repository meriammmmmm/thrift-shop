const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { authenticateToken } = require('../middleware/auth');

// Chat about an image (like ChatGPT Vision) – upload image + ask questions, get AI reply
router.post('/chat-image', authenticateToken, async (req, res) => {
  try {
    const { image, message, messages: previousMessages } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required (base64 data URL)' });
    }
    const result = await aiService.chatAboutImage(image, message || 'What do you see in this image?', previousMessages || []);
    if (result.success) {
      return res.json({ success: true, reply: result.reply, usage: result.usage });
    }
    res.status(400).json({ success: false, error: result.error });
  } catch (error) {
    console.error('Image chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Image analyser: analyze product image and return title, description, category, etc.
router.post('/analyze-image', authenticateToken, async (req, res) => {
  try {
    const { image, productName = '', category = '', brand = '' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required (base64 data URL)' });
    }

    console.log('🔍 Image analyser request from user', req.user?.id);

    const result = await aiService.generateProductDescription(image, productName, category, brand);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        instructions: result.instructions,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Image analyser error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

// Generate image from text prompt
router.post('/generate-image', authenticateToken, async (req, res) => {
  try {
    const { prompt, style = 'realistic', size = '1024x1024', service = 'auto' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`🎨 Image generation request from user ${req.user.id}: "${prompt}"`);

    const result = await aiService.generateImage(prompt, {
      style,
      size,
      service
    });

    res.json(result);
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
});

// Generate product mockup
router.post('/generate-product-mockup', authenticateToken, async (req, res) => {
  try {
    const { 
      productName, 
      category, 
      style = 'realistic',
      background = 'clean white background',
      lighting = 'professional studio lighting'
    } = req.body;

    if (!productName || !category) {
      return res.status(400).json({ error: 'Product name and category are required' });
    }

    console.log(`🛍️ Product mockup request: ${productName} (${category})`);

    const result = await aiService.generateProductMockup(productName, category, {
      style,
      background,
      lighting
    });

    res.json(result);
  } catch (error) {
    console.error('Product mockup generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate product mockup',
      details: error.message 
    });
  }
});

// Generate lifestyle image
router.post('/generate-lifestyle', authenticateToken, async (req, res) => {
  try {
    const { productName, scenario, style = 'realistic' } = req.body;

    if (!productName || !scenario) {
      return res.status(400).json({ error: 'Product name and scenario are required' });
    }

    console.log(`📸 Lifestyle image request: ${productName} in ${scenario}`);

    const result = await aiService.generateLifestyleImage(productName, scenario, { style });

    res.json(result);
  } catch (error) {
    console.error('Lifestyle image generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate lifestyle image',
      details: error.message 
    });
  }
});

// Generate fashion inspiration
router.post('/generate-inspiration', authenticateToken, async (req, res) => {
  try {
    const { theme, style = 'artistic' } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    console.log(`✨ Fashion inspiration request: ${theme}`);

    const result = await aiService.generateFashionInspiration(theme, { style });

    res.json(result);
  } catch (error) {
    console.error('Fashion inspiration generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate fashion inspiration',
      details: error.message 
    });
  }
});

// Get available AI services status
router.get('/services-status', authenticateToken, async (req, res) => {
  try {
    const status = {
      openai: {
        available: !!aiService.openai,
        service: 'DALL-E 3',
        features: ['High quality images', 'Multiple sizes', 'Style control']
      },
      huggingface: {
        available: !!aiService.huggingFaceApiKey,
        service: 'Stable Diffusion XL',
        features: ['Free generation', 'Good quality', 'Fast processing']
      },
      demo: {
        available: true,
        service: 'Demo Mode',
        features: ['Placeholder images', 'No API key needed', 'Instant results']
      }
    };

    res.json(status);
  } catch (error) {
    console.error('Services status error:', error);
    res.status(500).json({ error: 'Failed to get services status' });
  }
});

module.exports = router;
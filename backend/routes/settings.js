const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all settings (public endpoint)
router.get('/', async (req, res) => {
  try {
    const settings = await db.all('SELECT * FROM settings');
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = JSON.parse(setting.value);
    });
    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Get specific setting
router.get('/:key', async (req, res) => {
  try {
    const setting = await db.get('SELECT * FROM settings WHERE key = ?', [req.params.key]);
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json({ [setting.key]: JSON.parse(setting.value) });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to get setting' });
  }
});

// Update setting (admin only)
router.put('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Check if setting exists
    const existingSetting = await db.get('SELECT * FROM settings WHERE key = ?', [key]);

    if (existingSetting) {
      // Update existing setting
      await db.run(
        'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [JSON.stringify(value), key]
      );
    } else {
      // Create new setting
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
    }

    res.json({ 
      message: 'Setting updated successfully',
      [key]: value
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Create or update setting (POST method for easier frontend integration)
router.post('/', async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // Check if setting exists
    const existingSetting = await db.get('SELECT * FROM settings WHERE key = ?', [key]);

    if (existingSetting) {
      // Update existing setting
      await db.run(
        'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [JSON.stringify(value), key]
      );
    } else {
      // Create new setting
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
    }

    res.json({ 
      message: 'Setting updated successfully',
      [key]: value
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Initialize default settings
router.post('/init', requireAdmin, async (req, res) => {
  try {
    // Default theme settings
    const defaultTheme = {
      primary: '#0d9488', // teal-600
      primaryHover: '#0f766e', // teal-700
      primaryLight: '#5eead4', // teal-300
      secondary: '#64748b', // slate-500
      accent: '#f59e0b', // amber-500
      background: '#ffffff',
      text: '#1f2937', // gray-800
      textLight: '#6b7280', // gray-500
      success: '#10b981', // emerald-500
      error: '#ef4444', // red-500
      warning: '#f59e0b', // amber-500
      info: '#3b82f6' // blue-500
    };

    // Check if theme already exists
    const existingTheme = await db.get('SELECT * FROM settings WHERE key = ?', ['theme']);
    
    if (!existingTheme) {
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        ['theme', JSON.stringify(defaultTheme)]
      );
    }

    res.json({ 
      message: 'Default settings initialized',
      theme: defaultTheme
    });
  } catch (error) {
    console.error('Initialize settings error:', error);
    res.status(500).json({ error: 'Failed to initialize settings' });
  }
});

// Get theme settings
router.get('/theme', async (req, res) => {
  try {
    const setting = await db.get('SELECT * FROM settings WHERE key = ?', ['theme']);
    if (!setting) {
      // Return default theme if not found
      const defaultTheme = {
        primary: '#0d9488',
        primaryHover: '#0f766e',
        primaryLight: '#5eead4',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };
      return res.json({ theme: defaultTheme });
    }
    res.json({ theme: JSON.parse(setting.value) });
  } catch (error) {
    console.error('Get theme error:', error);
    res.status(500).json({ error: 'Failed to get theme' });
  }
});

// Update theme settings
router.post('/theme', async (req, res) => {
  try {
    const { theme } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'Theme data is required' });
    }

    // Check if theme setting exists
    const existingSetting = await db.get('SELECT * FROM settings WHERE key = ?', ['theme']);

    if (existingSetting) {
      // Update existing theme
      await db.run(
        'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [JSON.stringify(theme), 'theme']
      );
    } else {
      // Create new theme setting
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        ['theme', JSON.stringify(theme)]
      );
    }

    res.json({ 
      message: 'Theme updated successfully',
      theme: theme
    });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

module.exports = router;
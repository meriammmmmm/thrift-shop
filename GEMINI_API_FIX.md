# Gemini Vision API Fix - 404 Error Resolution

## Problem
The Google Gemini Vision API was returning a 404 error with various model/version combinations.

## Root Cause
The Gemini API has specific model names that work with specific API versions:
- `v1beta` works with: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro-vision`
- `v1` has limited model support and may not include all vision models

## Solution Applied

### Configuration
Using the stable and well-supported combination:
- API version: `v1beta`
- Model name: `gemini-1.5-flash`

### Flexible Environment Variables
Added environment variables for easy customization:
- `GEMINI_MODEL` - Specify which model to use (default: gemini-1.5-flash)
- `GEMINI_API_VERSION` - Specify API version (default: v1beta)

## Files Updated

1. `backend/services/aiService.js` - Main AI service
2. `backend/.env` - Environment configuration with comments
3. `backend/test-gemini-image.js` - Test file
4. `backend/test-gemini-direct.js` - Test file
5. `test-gemini-direct.js` - Test file
6. `test-gemini-real.js` - Test file

## Current Endpoint Format
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

## How to Use

### Default Configuration (Recommended)
No changes needed - uses stable v1beta with gemini-1.5-flash:
```env
GEMINI_API_KEY=your-api-key-here
```

### Custom Configuration (Optional)
Add to `.env` file if you want to use different settings:
```env
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-1.5-pro
GEMINI_API_VERSION=v1beta
```

## Testing
Restart your backend server to apply the changes:
```bash
cd backend
npm start
```

The Gemini Vision API should now work correctly for image analysis.

## Available Models (v1beta)
You can try these models by setting `GEMINI_MODEL`:
- `gemini-1.5-flash` (default, fast and efficient)
- `gemini-1.5-pro` (more powerful, slower)
- `gemini-pro-vision` (older vision model)

## API Version
- `v1beta` (recommended for vision features)
- `v1` (stable but limited model support)

## Notes
- The v1beta API provides the best support for vision models
- Multiple Gemini API keys are supported for rate limit handling
- If you get API key errors, verify your key at https://aistudio.google.com/app/apikey


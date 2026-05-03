# Fix AI Rate Limit Issue

## Problem
Your Gemini AI is hitting rate limits because:
- You're using the same API key for `GEMINI_API_KEY` and `GEMINI_API_KEY_2`
- The free tier has limited requests per minute

## Solution Options

### Option 1: Add More Gemini API Keys (RECOMMENDED - FREE)

1. Go to https://aistudio.google.com/app/apikey
2. Create 2-3 more API keys (it's FREE!)
3. Update your Railway backend environment variables:

```env
GEMINI_API_KEY=AIzaSyALVroGlzxSdoVfLloND8Z9pCj_QsNOBec
GEMINI_API_KEY_2=AIzaSy... (your second key)
GEMINI_API_KEY_3=AIzaSy... (your third key)
```

The system will automatically rotate between keys when one hits the rate limit!

### Option 2: Get OpenAI API Key (PAID but more reliable)

1. Go to https://platform.openai.com/api-keys
2. Create an API key
3. Add to Railway environment:

```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

OpenAI has higher rate limits but costs money per request.

### Option 3: Get Hugging Face API Key (FREE)

1. Go to https://huggingface.co/settings/tokens
2. Create a token
3. Add to Railway environment:

```env
HUGGINGFACE_API_KEY=hf_your-token-here
```

## How to Update Railway Environment Variables

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Add/update the API keys
5. Click "Deploy" to restart with new keys

## Current Status

Your current setup:
- ✅ GEMINI_API_KEY: Working but rate limited
- ⚠️ GEMINI_API_KEY_2: Same as key 1 (not helping)
- ❌ GEMINI_API_KEY_3: Not set
- ❌ OPENAI_API_KEY: Not set
- ❌ HUGGINGFACE_API_KEY: Not set

## Priority Order (How AI Service Works)

1. **Hugging Face** (if key is set) - Tries first
2. **Gemini** (rotates through all keys) - Tries second
3. **Temporary Mode** (fallback) - Generic descriptions

## What Happens When Rate Limited

When all AI services are rate limited, the system falls back to "Temporary Mode" which generates smart descriptions based on the product name, category, and brand you provide - but it doesn't actually analyze the image.

## Quick Fix Right Now

The fastest solution:
1. Go to https://aistudio.google.com/app/apikey
2. Create 2 more Gemini API keys (takes 30 seconds)
3. Add them to Railway as GEMINI_API_KEY_2 and GEMINI_API_KEY_3
4. Redeploy your backend

This gives you 3x the rate limit capacity for FREE!

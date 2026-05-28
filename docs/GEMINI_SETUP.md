# Google Gemini Setup Guide for Sales Simulator

## Quick Start

The FORGE Sales Simulator now uses **Google Gemini 2.5-flash** for conversational AI and **Google Speech-to-Text (Chirp-3)** for accurate speech transcription.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Create Project**
3. Name it "FORGE Sales Simulator"
4. Click **Create**

## Step 2: Enable Required APIs

1. In the left sidebar, click **APIs & Services** > **Library**
2. Search for and enable these APIs:
   - **Cloud Speech-to-Text API**
     - Click it
     - Click **Enable**
     - Wait for confirmation
   
   - **Generative Language API**
     - Click it
     - Click **Enable**
     - Wait for confirmation

## Step 3: Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key
4. Click **Restrict Key** and set:
   - **API restrictions**: Restrict to specific APIs
   - Select: **Cloud Speech-to-Text API** and **Generative Language API**
5. Save the key securely

## Step 4: Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** > **Environment Variables**
3. Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `GEMINI_API_KEY` | Your API key from Step 3 | Keep this secret! |
| `GEMINI_TTS_MODEL` | `gemini-2.5-flash-preview-tts` | Text-to-speech model for AI messages |
| `GEMINI_STT` | `chirp-3` | Speech-to-Text model |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Conversation AI model |

4. Click **Save**

## Step 5: Deploy

1. Commit your changes
2. Push to your GitHub repository
3. Vercel will automatically deploy with the new environment variables

## Step 6: Test

1. Navigate to the Sales Simulator course
2. Click "Start Sales Simulation"
3. Try speaking or typing
4. You should see AI responses from Gemini

## Troubleshooting

### "API key not found" error
- Check that `GOOGLE_API_KEY` is added to Vercel environment variables
- Redeploy after adding variables
- Check that you're using the correct API key

### "Speech-to-Text API not enabled"
- Go to Google Cloud Console > APIs & Services > Library
- Search for "Cloud Speech-to-Text API"
- Click **Enable**
- Wait 2-3 minutes for activation

### "Generative Language API error"
- Go to Google Cloud Console > APIs & Services > Library
- Search for "Generative Language API"
- Click **Enable**
- Verify API key has access to this API

### Responses are slow
- First call to Gemini takes 2-3 seconds (normal)
- Subsequent calls are faster
- Check your internet connection

### Web Speech API not working
- Make sure you're using HTTPS (required in production)
- Use a modern browser (Chrome, Edge, Safari 14.1+)
- Check microphone permissions in browser

## How the System Works

```
┌─── USER INTERACTION ───┐

Trainee Speech
      ↓
[Web Speech API - Browser native]
      ↓
Transcript Text
      ↓
[POST /api/sales-simulator/customer-response]
      ↓
[Backend - Server side]
├─ Get GEMINI_API_KEY from process.env
├─ Call Google Generative Language API
│  └─ Uses gemini-2.5-flash model
├─ Get customer response
└─ Return JSON with response text
      ↓
Display in Conversation UI
      ↓
Trigger TTS Auto-play
      ↓
[POST /api/text-to-speech]
      ↓
[Backend - Server side]
├─ Get GEMINI_API_KEY from process.env
├─ Get GEMINI_TTS_MODEL from process.env
├─ Call Gemini TTS API with response text
├─ Receive base64-encoded audio
└─ Return to frontend with MIME type
      ↓
[Frontend]
├─ Decode base64 audio
├─ Create data URL (data:audio/mpeg;base64,...)
├─ Create Audio element
└─ Auto-play to user
      ↓
User hears AI response naturally
```

## API Costs

**Google Free Tier Includes:**
- Speech-to-Text: 60 minutes/month
- Generative Language (Gemini): Limited free tier (15 requests/minute)

**Production Pricing:**
- Speech-to-Text: $0.024 per 15-second audio block
- Generative Language: Varies by token usage

Monitor usage at: Google Cloud Console > Billing > Reports

## Environment Variables Explained

### GEMINI_API_KEY
- Your Google Cloud API key
- Provides access to Gemini APIs (conversation, TTS)
- Never expose this to the client
- Store only in Vercel environment variables

### GEMINI_TTS_MODEL
- `gemini-2.5-flash-preview-tts` - Gemini's latest TTS model
- Generates natural-sounding audio for AI responses
- Returns base64-encoded audio that auto-plays in browser
- Multiple language support
- Used in `/api/text-to-speech` endpoint for auto-play feature

### GEMINI_STT (Speech-to-Text)
- `chirp-3` - Google's latest STT model
- Most accurate for English speech
- Supports multiple languages
- Used for server-side transcription fallback

### GEMINI_MODEL (Conversation AI)
- `gemini-2.5-flash` - Fast, efficient Gemini model
- Good balance of speed and quality
- Supports up to 1M token context window
- Used for customer response generation

## Security Best Practices

✅ **DO**
- Store API key only in Vercel environment variables
- Restrict API key to specific APIs in Google Cloud
- Never commit API key to GitHub
- Use HTTPS in production
- Validate all requests on the backend

❌ **DON'T**
- Put API key in frontend code
- Commit `.env.local` to GitHub
- Use same API key across multiple projects
- Expose error messages that contain API details
- Log API keys in console

## Next Steps

- ✅ Environment variables are set
- ✅ APIs are enabled
- ✅ Ready to use the Sales Simulator!
- 📊 Monitor API usage in Google Cloud Console
- 💰 Set up billing alerts if needed
- 🔐 Review API key restrictions quarterly

## Support

For issues:
1. Check the troubleshooting section above
2. Verify all API keys are enabled in Google Cloud Console
3. Check Vercel environment variables are set correctly
4. Review browser console for specific error messages
5. Contact Google Cloud support for API issues

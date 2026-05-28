# Quick Migration Guide: Google Cloud → Gemini-Only

## 🎯 What Changed?

You now need **only 1 API key** instead of managing multiple Google Cloud services:
- ✅ `GEMINI_API_KEY` (all you need)
- ❌ `GOOGLE_API_KEY` (removed)
- ❌ Separate Cloud Speech-to-Text (removed)
- ❌ Separate Cloud Text-to-Speech (removed)

## ⚡ 5-Minute Setup

### Step 1: Get Gemini API Key (2 min)
```bash
1. Visit: https://aistudio.google.com/app/apikeys
2. Click: "Get API Key"
3. Create new API key
4. Copy key to clipboard
```

### Step 2: Add to Vercel (2 min)
```bash
1. Go to: Your Vercel Project Dashboard
2. Click: Settings → Environment Variables
3. Add variable:
   Name:  GEMINI_API_KEY
   Value: [paste your key from Step 1]
4. Click: Save
```

### Step 3: Deploy (1 min)
```bash
git push
# Vercel automatically deploys!
```

### Done! ✅
Your app now uses Gemini for everything.

---

## 🔍 How to Verify It Works

### Check in Vercel Logs
```
1. Go to Vercel Dashboard
2. Click your project
3. Go to Deployments → recent deployment → Function logs
4. Look for messages like:
   "[v0] ========== GEMINI API REQUEST =========="
   "[v0] Calling Gemini API for transcription..."
```

### Test in Your App
```
1. Try recording audio in Sales Simulator
2. Check browser console for no errors
3. Try sending messages to AI customer
4. Verify responses appear
```

### Monitor Usage
```
1. Go to: https://aistudio.google.com/app/apikeys
2. Click your key
3. See usage metrics and quota
```

---

## ❌ What NOT to Do

### Don't keep old variables
```bash
# ❌ DELETE these if they exist:
GOOGLE_API_KEY
GEMINI_STT
GEMINI_TTS
CLOUD_*
```

### Don't enable multiple APIs
```bash
# ❌ No need to enable:
- Cloud Speech-to-Text
- Cloud Text-to-Speech
- Any other Cloud APIs (unless using them for other reasons)
```

### Don't use billing project
```bash
# ❌ Gemini API works WITHOUT:
- Google Cloud billing project
- Cloud console setup
- Project credentials
```

---

## 🆘 If Something Breaks

### "API key not found" in logs
```
Fix: Add GEMINI_API_KEY to Vercel environment variables
Status: Check Vercel Settings > Environment Variables
```

### "Transcription failed"
```
What to do:
1. Use text mode instead of voice
2. Check audio format (WebM or MP3)
3. Verify API key is correct
Why it happens:
- Gemini multimodal has different audio handling than Google Cloud STT
```

### "No audio response"
```
What to do:
1. Check browser tab is unmuted
2. Try different browser
3. Use text mode
Why it happens:
- Browser speechSynthesis instead of server TTS
- More reliable across browsers
```

### "Slow first response"
```
This is normal!
- First request takes 2-3 seconds
- Subsequent requests are fast
- Cold start is expected in serverless
```

---

## 📊 Migration Checklist

Before deploying to production:

- [ ] Got Gemini API key from aistudio.google.com
- [ ] Added `GEMINI_API_KEY` to Vercel environment variables
- [ ] Removed old `GOOGLE_API_KEY` variable
- [ ] Deployed code (git push)
- [ ] Tested voice transcription in simulator
- [ ] Tested AI customer responses
- [ ] Verified browser speech synthesis works
- [ ] Checked Vercel function logs for Gemini API calls
- [ ] Tested in Chrome, Firefox, Safari (browser speech)

---

## 🚀 Performance Tips

### Get faster responses
```
1. Second request in session is faster (warm start)
2. Keep conversation going (better context)
3. Use clear, specific prompts
```

### Monitor your quota
```
1. Go to https://aistudio.google.com/app/apikeys
2. Click your key
3. See daily usage
4. Set up billing alerts to control costs
```

### Optimize for cost
```
1. Use shorter prompts when possible
2. Batch similar requests
3. Monitor usage regularly
4. Consider rate limiting in frontend
```

---

## 📚 Files That Changed

If you're curious what was refactored:

**API Routes** (use Gemini now):
- `app/api/transcribe/route.ts` - Audio to text via Gemini
- `app/api/text-to-speech/route.ts` - Browser speech fallback
- `app/api/ai-sales-response/route.ts` - Pure Gemini
- `app/api/sales-simulator/customer-response/route.ts` - Pure Gemini

**Libraries** (removed Google Cloud):
- `lib/speech-utils.ts` - Removed Google Cloud STT
- `lib/voice-utils.ts` - Added browser speech synthesis
- `hooks/useConversation.ts` - Streamlined to use browser speech

**Config**:
- `.env.example` - Now shows only `GEMINI_API_KEY`

**New file**:
- `REFACTORING_SUMMARY.md` - Full technical details

---

## 🎓 Understanding the Changes

### Old Flow (Multiple Services)
```
User speaks
    ↓
[app/api/transcribe] → Google Cloud Speech-to-Text
    ↓
[app/api/ai-sales-response] → Google Gemini
    ↓
[app/api/text-to-speech] → Google Cloud Text-to-Speech
    ↓
Browser plays audio
```

### New Flow (Gemini-Only)
```
User speaks
    ↓
[app/api/transcribe] → Gemini multimodal
    ↓
[app/api/ai-sales-response] → Gemini
    ↓
Browser native speechSynthesis
    ↓
User hears response
```

**Fewer API calls = faster + cheaper!** 🎉

---

## ❓ FAQ

**Q: Do I need a Google Cloud billing project?**  
A: No! Gemini API Free Tier is generous. No setup needed.

**Q: Will audio transcription be as accurate?**  
A: Gemini 2.0-Flash is very capable. Quality is comparable or better.

**Q: What if audio transcription fails?**  
A: App automatically falls back to text mode. No crashes.

**Q: Will speech output sound different?**  
A: Browser speechSynthesis sounds different from Google Cloud TTS, but it works well.

**Q: Can I use both old and new code?**  
A: No. Clean migration is complete. Remove old environment variables.

**Q: How do I monitor costs?**  
A: Check usage dashboard at https://aistudio.google.com/app/apikeys

**Q: Can I revert to old setup?**  
A: Yes, but not recommended. New setup is simpler and better.

---

## 🎉 You're Done!

Your FORGE platform now uses:
- ✅ Single Gemini API Key
- ✅ No Google Cloud complexity
- ✅ Graceful fallbacks
- ✅ Same features, simpler setup

Time to celebrate! 🚀

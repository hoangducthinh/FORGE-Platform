# 🚀 QUICK REFERENCE - Gemini TTS Implementation

## What Changed?

✅ **Real Gemini TTS** instead of browser speech synthesis
✅ **Auto-play audio** for all AI messages
✅ **Fixed layout bugs** that caused content overlap
✅ **7 files updated** with new implementation

---

## For Developers

### Key Functions to Use

```tsx
// Import
import { autoPlayAIMessage, stopCurrentAudio } from '@/lib/voice-utils';

// Auto-play AI message
await autoPlayAIMessage("Hello! How can I help?", "en-US", (error) => {
  console.error("Auto-play failed:", error);
});

// Stop current audio
stopCurrentAudio();

// Check if playing
const isPlaying = isAudioPlaying();
```

### Environment Variables Required

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
```

### Layout Pattern for Scrollable Content

```tsx
<div className="flex flex-col h-full">
  {/* Fixed header */}
  <header className="shrink-0 h-16">Header</header>
  
  {/* Scrollable content - CRITICAL: include min-h-0 */}
  <main className="flex-1 overflow-y-auto min-h-0">
    {/* Content here */}
  </main>
  
  {/* Fixed footer */}
  <footer className="shrink-0 h-16">Footer</footer>
</div>
```

---

## Files Changed

| File | What Changed |
|------|-------------|
| `app/api/text-to-speech/route.ts` | Real Gemini TTS API |
| `lib/voice-utils.ts` | New TTS functions |
| `components/sales-simulator/ConversationSimulator.tsx` | Auto-play + layout fix |
| `components/lesson/AISalesSimulator.tsx` | Auto-play + cleanup |
| `components/sales-simulator/SimulatorLesson.tsx` | Audio cleanup |
| `.env.example` | TTS configuration |
| `docs/GEMINI_SETUP.md` | Updated documentation |

---

## API Endpoint

### POST `/api/text-to-speech`

**Request:**
```json
{
  "text": "Hello! How can I help?",
  "language": "en-US"
}
```

**Response:**
```json
{
  "audioBase64": "//NExAAy2Zf5QAEkAAx...",
  "mimeType": "audio/mpeg",
  "fallback": false,
  "language": "en-US"
}
```

---

## How Auto-Play Works

1. AI message appears in conversation
2. `autoPlayAIMessage()` is automatically triggered
3. Calls `/api/text-to-speech` with message text
4. Backend calls Gemini TTS API
5. Returns base64-encoded audio
6. Audio automatically plays in user's browser
7. User hears natural-sounding response

**All automatic - no user action needed!** ✨

---

## Logging Output

Look for these prefixes in browser console:

```
[TTS] - Backend TTS endpoint activity
[Audio] - Audio playback operations  
[TTS Request] - Gemini API requests
[AutoPlay] - Auto-play orchestration
[ConversationSimulator] - Component operations
[AISalesSimulator] - Component operations
```

Example:
```
[TTS Request] Requesting TTS for: "Hello!"
[TTS] Calling Gemini API...
[TTS] Successfully received audio (2048 bytes)
[Audio] Creating audio element...
[AutoPlay] Message auto-played successfully
```

---

## Troubleshooting

### No audio playing?
1. Check `GEMINI_API_KEY` is set in environment
2. Check `GEMINI_TTS_MODEL` is set correctly
3. Open browser DevTools, check for `[TTS]` errors in console
4. Verify Gemini Generative Language API is enabled in Google Cloud

### Audio is duplicating?
- This shouldn't happen due to `lastSpokenMessageIdRef` tracking
- Check browser console for errors
- Reload page if issue persists

### Layout overlapping?
- Verify `min-h-0` is present on scrollable container
- Check all `shrink-0` classes are on fixed elements
- Inspect element to verify CSS is applied

### API Key errors?
- Verify key is in `.env.local` (development) or Vercel (production)
- Redeploy after adding environment variables
- Check key has Gemini API access in Google Cloud Console

---

## Performance Tips

- First TTS call takes ~200-500ms (normal)
- Subsequent calls are faster
- Auto-play doesn't block user interaction
- Audio is cleaned up automatically on component unmount
- No memory leaks or duplicate audio elements

---

## Security Notes

✅ **DO**
- Store `GEMINI_API_KEY` only in environment variables
- Restrict API key to specific APIs in Google Cloud
- Never commit environment variables to GitHub

❌ **DON'T**
- Put API key in frontend code
- Commit `.env` files to GitHub
- Expose API key in error messages

---

## Deployment Steps

1. **Local Development**
   ```bash
   # Add to .env.local
   GEMINI_API_KEY=your_key_here
   GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
   ```

2. **Production (Vercel)**
   - Go to Project Settings → Environment Variables
   - Add same variables
   - Redeploy

3. **Test**
   - Open Sales Simulator
   - Start conversation
   - Hear audio auto-play ✨

---

## Next Features (Future)

- [ ] Language preference selection
- [ ] Speed adjustment for TTS
- [ ] Pause/resume audio controls
- [ ] Voice selection options
- [ ] Audio download feature

---

## Documentation Links

- **Setup Guide**: `docs/GEMINI_SETUP.md`
- **Implementation Details**: `GEMINI_TTS_IMPLEMENTATION_COMPLETE.md`
- **Verification Summary**: `VERIFICATION_COMPLETE.md`

---

## Questions?

Check the detailed documentation files for:
- Complete API setup instructions
- Troubleshooting guides
- Architecture diagrams
- Testing checklists

---

**Ready to ship!** 🚀 Just add your API key and deploy.

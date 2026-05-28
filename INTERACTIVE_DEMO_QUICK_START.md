# Interactive Demo - Quick Start (5 minutes)

## Try It Now

### Step 1: Login
```
Email: trainee@forge.com
Password: (any password)
```

### Step 2: Navigate to Demo Lesson
1. Click "Courses" in navigation
2. Click "Onboarding Essentials"
3. Click "Welcome & Overview" module
4. Click "Welcome to FORGE" lesson

### Step 3: See Video with Quiz Checkpoints
You'll see an interactive video player with:
- Blue markers on the timeline (quiz checkpoints)
- Play/pause/volume controls
- Playback speed options (0.75x - 1.5x)
- Duration display

### Step 4: Watch Video Until Auto-Pause
- Play the video
- **At 30 seconds**: Video auto-pauses, quiz modal appears
- Answer multiple-choice questions
- Get instant feedback (✓ correct or ✗ incorrect)
- Click "Next Question" → See Q2 (True/False)
- Click "See Results" → View score

### Step 5: Continue & Encounter Voice Quiz
- Resume video
- **At 90 seconds**: Second quiz auto-pauses
- See voice question: "How would you describe FORGE?"
- Click "Start Recording"
- Speak into microphone
- Click "Stop Recording"
- See auto-transcription
- Get instant feedback

### Step 6: View Results on Lesson Page
- After closing quiz modal
- See "Quiz Progress" section showing completed quizzes
- See "Quiz Results" displaying your scores
- Try another lesson for more quizzes

## What You're Testing

| Feature | Location | How to Test |
|---------|----------|-------------|
| **Auto-Pause Quizzes** | 30 sec & 90 sec marks | Play lesson video, watch for auto-pause |
| **Multiple Choice** | Quiz 1, Q1 | Select answer, see feedback |
| **True/False** | Quiz 1, Q2 | Toggle option, confirm answer |
| **Voice Recording** | Quiz 2, Q1 | Click record, speak, transcription auto-appears |
| **Instant Feedback** | All questions | Answer visible immediately |
| **Score Display** | Results page | See % and correct count |
| **Retry Quiz** | After failing | Click "Try Again" button |
| **Progress Tracking** | Lesson page | See quiz completion indicators |

## Keyboard Shortcuts (in Video)

| Key | Action |
|-----|--------|
| **Space** | Play/Pause |
| **←** | Rewind 5 sec |
| **→** | Forward 5 sec |
| **M** | Mute/Unmute |
| **F** | Fullscreen |
| **Tab** | Navigate controls |
| **Enter** | Activate focused control |

## Quick Tips

✓ **Microphone Issues?**
- Check browser permissions (🔒 icon in URL bar)
- Ensure microphone is not muted
- Try a different browser
- Works on HTTPS only

✓ **Video Not Auto-Pausing?**
- Play video first
- Wait until checkpoint time (30, 90 seconds)
- Check video is actually playing
- Reload page if stuck

✓ **Want to Skip Quiz?**
- Some questions have "Skip" button
- You can still answer all questions
- Skipped answers count as incorrect

✓ **Retake Quiz?**
- If you don't pass, click "Try Again"
- Your score updates
- Previous attempts still visible

## Test Scenarios

### Scenario 1: Complete Success (5 min)
1. Login as trainee
2. Go to "Welcome to FORGE"
3. Play video
4. Answer all questions correctly
5. See "Congratulations!" on results

### Scenario 2: Voice Recording (3 min)
1. Go to "Welcome to FORGE" 
2. Skip to 90+ seconds (or watch full video)
3. Try voice quiz
4. Speak naturally
5. See transcription appear

### Scenario 3: Mixed Results (4 min)
1. Go to Final Exam ("Communication Tools")
2. Get some wrong, some right
3. See mixed results
4. Try retry option
5. Improve your score

## Next: Production Setup

When ready to deploy:
1. Replace demo courses with real content
2. Connect to database (Supabase/Neon)
3. Set up user authentication (Auth.js)
4. Enable OpenAI Whisper API
5. Create admin tools for instructors
6. Set up SSL certificate (HTTPS)
7. Deploy to Vercel

## Demo Lesson Content

### "Welcome to FORGE" (2 min)
- Introduces platform
- Shows key features
- 2 quiz checkpoints
- Mix of question types

### "Our Values" (2 min)
- Company culture overview
- 1 quiz checkpoint
- Multiple choice question

### "Communication Tools" (2 min)
- Platform tools overview
- Final exam-style quiz
- Mixed answer formats

## Accessibility Features

✓ **Keyboard Only**: Navigate entire demo with Tab and Enter
✓ **Screen Reader**: All controls labeled with ARIA
✓ **High Contrast**: Blue + white with 4.5:1 ratio
✓ **Clear Labels**: Every button has descriptive text
✓ **Error Messages**: Clear guidance when issues occur

## Common Questions

**Q: Can I watch video without quizzes?**
A: Quizzes are built into the lessons, but you can skip them (if allowed).

**Q: Does my voice get recorded permanently?**
A: Only if you confirm. You can delete before submitting.

**Q: What if I don't have a microphone?**
A: All questions have text options as fallback.

**Q: Can I retake a quiz multiple times?**
A: Yes, click "Try Again" after failing.

**Q: Are my scores saved?**
A: In demo, they show on the lesson page. Production will save to database.

**Q: How accurate is voice transcription?**
A: Uses OpenAI Whisper (same as ChatGPT). Works best with clear speech.

## Need Help?

- **Can't record audio?** → Check microphone permissions
- **Video won't play?** → Refresh page, check internet
- **Quiz won't pause?** → Ensure video is actually playing
- **Results not showing?** → Close quiz modal completely
- **Transcription slow?** → First time load can take 3-5 seconds

---

**Ready?** Go to `http://localhost:3000` and login with `trainee@forge.com` → Enjoy the demo! 🎓

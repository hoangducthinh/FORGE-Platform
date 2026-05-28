# FORGE Interactive Course Demo - Complete Guide

## Overview

The FORGE platform now includes a **comprehensive interactive course demo** with embedded video, auto-pausing quizzes, voice recording, and AI transcription. This creates a fully-engaging learning experience similar to platforms like Coursera with advanced interactive features.

## Key Features

### 1. Interactive Video Player
**Location**: `components/lesson/InteractiveVideoPlayer.tsx`

Features:
- Custom HTML5 video controls
- Timeline markers showing quiz checkpoints in blue
- Hover-seek on progress bar
- Playback speed controls (0.75x, 1x, 1.25x, 1.5x)
- Mute/Volume controls
- Fullscreen support
- Keyboard shortcuts:
  - Space: Play/Pause
  - Arrow Left/Right: Seek ±5 seconds
  - M: Toggle mute
  - F: Toggle fullscreen

### 2. Auto-Pausing Quizzes
**Location**: `components/lesson/InteractiveQuiz.tsx`

Functionality:
- Video automatically pauses at predefined quiz checkpoints
- Modal overlay displays quiz questions
- Sequential question navigation
- Immediate feedback on answers (correct/incorrect)
- Progress indicator showing question position
- Pass/fail results with score display
- Option to retry quiz if failed

### 3. Voice Recording Integration
**Location**: `components/lesson/VoiceRecorder.tsx`

Capabilities:
- Real-time microphone access with permission handling
- Record/Stop/Play controls
- Visual recording timer with waveform animation
- Audio playback with player controls
- Auto-transcription via OpenAI Whisper API
- Mock fallback transcription for demo mode
- Delete and re-record functionality

### 4. AI Transcription Service
**Location**: `lib/voice-utils.ts`

Features:
- OpenAI Whisper API integration
- Automatic transcription of recorded audio
- Mock fallback with realistic demo responses
- Error handling with graceful degradation
- Works without API key (uses mock data)

### 5. Flexible Answer Formats
**Location**: `components/lesson/QuizQuestion.tsx`

Question Types:
- Multiple choice (4-5 options)
- True/False
- Voice practice (voice only)
- Short answer (text or voice)

Answer Formats:
- Text-only answers
- Voice-only answers
- Both (user chooses method)
- Skip option per question

### 6. Real-Time Feedback
**Location**: `components/lesson/QuizQuestion.tsx`

Feedback Features:
- Correct/incorrect indicator with icon
- Explanation of correct answer
- Transcription display for voice answers
- Score calculation
- Performance summary

## How to Use the Demo

### Playing a Course Lesson

1. Navigate to a course (e.g., "Onboarding Essentials")
2. Select a module and lesson
3. You'll see the **Interactive Video Player** with blue markers showing quiz checkpoints
4. Play the video and it will automatically pause at quiz triggers

### Handling Interactive Quizzes

1. When the video pauses at a checkpoint, a quiz modal appears
2. Read the question and choose your answer format:
   - For multiple choice: Click an option
   - For voice questions: Click "Start Recording"
3. Click "Submit Answer" to get immediate feedback
4. After feedback, click "Next Question" to continue
5. After the last question, see your complete results

### Recording Voice Answers

1. When a question allows voice input, click "Start Recording"
2. Speak clearly into your microphone
3. The system will show a red dot and record time
4. Click "Stop Recording" when finished
5. The audio will auto-transcribe (demo mode shows realistic mock responses)
6. Review the transcription and click to confirm

### Viewing Results

After completing a quiz:
- See your score as a percentage
- View correct/incorrect answers
- See your voice transcriptions
- Option to retry if you didn't pass
- Results summary displays on the lesson page

## Demo Data Structure

### Sample Lesson: "Welcome to FORGE"
- **Course**: Onboarding Essentials
- **Module**: Welcome & Overview
- **Duration**: ~2 minutes (YouTube video)
- **Quizzes**: 2 checkpoints

### Quiz 1 (at 30 seconds)
- **Q1**: Multiple choice - "What is the first step?" (text answer)
- **Q2**: True/False - "Can you access on mobile?" (text answer)

### Quiz 2 (at 90 seconds)
- **Q1**: Voice Practice - "Describe the FORGE experience" (voice-only)

### Sample Lesson: "Our Values"
- **Course**: Onboarding Essentials
- **Module**: Company Culture & Values
- **Quizzes**: 1 checkpoint at 45 seconds

### Quiz (at 45 seconds)
- **Q1**: Multiple choice - "Which is NOT a core value?" (text answer)

## Testing the Interactive Features

### Test Case 1: Auto-Pause at Checkpoints
```
1. Play lesson "Welcome to FORGE"
2. Wait for 30 seconds
3. Video should auto-pause and quiz modal appears
4. ✓ Expected: Auto-pause and modal trigger
```

### Test Case 2: Voice Recording
```
1. Complete first quiz
2. Get to Quiz 2 with voice question
3. Click "Start Recording"
4. Speak: "The FORGE platform is great for learning"
5. Click "Stop Recording"
6. ✓ Expected: Audio records, transcribes, and displays
```

### Test Case 3: Multiple Answer Formats
```
1. Go to final exam (lesson "Communication Tools")
2. Q2 allows both text and voice
3. Try both formats
4. ✓ Expected: Both options work seamlessly
```

### Test Case 4: Quiz Results
```
1. Complete a quiz
2. Get results page with score
3. Close quiz
4. ✓ Expected: Results display on lesson page, quiz marked done
```

## API Routes (For Backend Integration)

### Submit Quiz Answer
```
POST /api/lessons/[lessonId]/quiz/submit
Body: {
  quizId: string
  questionId: string
  answer: string
  voiceTranscription?: string
  duration: number
}
```

### Transcribe Voice
```
POST /api/voice/transcribe
Body: FormData with audio blob
Response: { text: string }
```

### Get Lesson Progress
```
GET /api/lessons/[lessonId]/progress
Response: {
  completedQuizzes: string[]
  quizResults: Record<string, QuizResult>
  progressPercentage: number
}
```

### Update Progress
```
POST /api/lessons/[lessonId]/progress
Body: {
  quizId: string
  score: number
  passed: boolean
}
```

## Customization Guide

### Add Quiz Checkpoints to a Lesson

1. Edit `lib/mock-data.ts`
2. In `mockQuizzes`, add a quiz with `timeToTrigger`:

```typescript
{
  id: 'custom-quiz',
  lessonId: 'your-lesson-id',
  title: 'Checkpoint Quiz',
  type: 'lesson_quiz',
  passingScore: 70,
  timeToTrigger: 45, // triggers at 45 seconds
  createdAt: new Date(),
}
```

3. Add questions in `mockQuizQuestions`:

```typescript
'custom-quiz': [
  {
    id: 'q1',
    quizId: 'custom-quiz',
    questionText: 'Your question?',
    questionType: 'multiple_choice',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    order: 1,
    answerFormat: 'text',
    allowSkip: true,
  }
]
```

### Change Quiz Passing Score

In `lib/mock-data.ts`, modify the `passingScore` field:

```typescript
{
  id: 'q1',
  // ...
  passingScore: 85, // Changed from 70
}
```

### Enable OpenAI Transcription

1. Set environment variable:
```
NEXT_PUBLIC_OPENAI_API_KEY=your-api-key
```

2. Voice recorder will automatically use real Whisper API
3. Without the key, it uses realistic mock transcriptions

### Change Video Source

In the lesson page, replace the `videoUrl`:

```typescript
<InteractiveVideoPlayer
  videoUrl="https://your-video-url.com/video.mp4"
  // ...
/>
```

## Accessibility Features

- Keyboard navigation throughout
- ARIA labels on all interactive elements
- Screen reader announcements for quiz feedback
- Color contrast ratios ≥ 4.5:1 (WCAG AA)
- Visible focus indicators
- Clear button labels
- Form validation messages

## Performance Optimizations

- Video player lazy loads
- Audio streams efficiently
- Component memoization prevents unnecessary re-renders
- Debounced video seek operations
- Cached transcription results

## Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS (required for microphone access)
- Verify microphone is not in use by other apps

### Video Not Playing
- Check video URL format
- Ensure CORS headers are correct
- Try embedding from YouTube (built-in CORS support)

### Quiz Not Pausing Video
- Verify `timeToTrigger` is set in quiz data
- Check if timestamp is within video duration
- Try reloading the page

### Transcription Not Working
- Mock fallback should always work
- If using real API, check OpenAI API key
- Verify audio quality (clear speech)

## File Structure

```
components/lesson/
├── InteractiveVideoPlayer.tsx    # Video player with checkpoints
├── InteractiveQuiz.tsx            # Quiz modal component
├── QuizQuestion.tsx               # Individual question component
└── VoiceRecorder.tsx              # Voice recording UI

lib/
├── voice-utils.ts                 # Voice & transcription utilities
└── types.ts                       # Updated types with quiz fields

app/courses/[...]/[lessonId]/
└── page.tsx                       # Enhanced lesson page (integrated)
```

## Next Steps for Production

1. **Connect to Backend**: Replace mock data with API calls
2. **Database Integration**: Store quiz results in Supabase/Neon
3. **User Tracking**: Track progress per user
4. **Analytics**: Monitor quiz performance
5. **Real Videos**: Replace YouTube embeds with actual course videos
6. **Certificate Generation**: Issue certificates on course completion
7. **Admin Dashboard**: Create course authoring tools
8. **Mobile Optimization**: Test on various devices

## Demo Credentials

To test the full demo:

**Trainee Account**:
- Email: `trainee@forge.com`
- Password: Any password

**Test Course**: "Onboarding Essentials"
**Test Lessons**:
- Module 1 → "Welcome to FORGE" (has interactive quizzes)
- Module 2 → "Our Values" (has checkpoint quiz)

## Support & Questions

For issues with the interactive demo:
1. Check browser console for errors
2. Verify mock data is loaded correctly
3. Test with different browsers
4. Check microphone permissions
5. Review INTERACTIVE_DEMO_GUIDE.md for troubleshooting

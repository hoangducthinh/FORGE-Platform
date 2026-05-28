# Conversational Sales Skills Simulator - Technical Implementation Guide

## Overview

The FORGE Sales Simulator is an AI-powered training tool that enables trainees to practice conversational selling skills through realistic sales interactions with an AI customer. The system uses Google Gemini APIs for AI responses, Google Speech-to-Text (Chirp-3) for audio transcription, and real-time performance metrics to create an engaging sales training experience.

## Architecture

### Core Components

#### 1. **Frontend Components**

**SpeechRecorder** (`/components/sales-simulator/SpeechRecorder.tsx`)
- Captures trainee speech using Web Speech API (browser-native)
- Falls back to text input if speech recognition unavailable
- Features:
  - Real-time transcription display
  - Microphone permission handling
  - Start/stop recording with visual feedback
  - Submit button for sending responses

**ConversationSimulator** (`/components/sales-simulator/ConversationSimulator.tsx`)
- Main conversation interface displaying sales interaction
- Manages message flow between trainee and AI customer
- Calls backend API for AI customer responses
- Displays conversation history with timestamps
- Integrates SpeechRecorder and SalesMetricsTracker

**SalesMetricsTracker** (`/components/sales-simulator/SalesMetricsTracker.tsx`)
- Real-time performance dashboard
- Tracks metrics:
  - **Conviction Rate** (0-100%): How convinced the customer is becoming
  - **Pitch Quality** (0-100%): Quality of trainee's pitch based on content analysis
  - **Engagement Score** (0-100%): Overall conversation engagement level
  - **Turns to Close**: Number of back-and-forth exchanges
  - **Objections Handled**: Count of customer objections successfully addressed

**SimulatorLesson** (`/components/sales-simulator/SimulatorLesson.tsx`)
- Wrapper component that manages the entire simulator experience
- Scenario selection interface
- Lesson content display
- Session debrief and insights

#### 2. **Backend API Routes**

**Customer Response Route** (`/app/api/sales-simulator/customer-response/route.ts`)
- Receives trainee's message and conversation history
- Calls Google Gemini 2.5-flash API for AI responses
- Returns AI customer response with conviction delta
- Handles three customer scenarios: skeptical, warm_lead, random
- Implements fallback responses if API unavailable

#### 3. **Utilities & Configuration**

**Sales Simulator Config** (`/lib/sales-simulator.ts`)
- Defines three customer personas:
  ```
  - Skeptical: Asks tough questions, needs proof of ROI
  - Warm Lead: Already interested, open to conversation
  - Random: Mixed personality that adapts to trainee's approach
  ```
- System prompts for each persona
- Conviction rate calculations
- Pitch quality evaluation
- Engagement scoring

**Speech Utilities** (`/lib/speech-utils.ts`)
- `SpeechToTextConverter` class: Web Speech API wrapper
- Server-side Google Speech-to-Text (Chirp-3) transcription function (for audio files)
- Mock transcription for development/fallback

**Types** (`/lib/types.ts`)
- `ConversationMessage`: Message structure
- `SalesSession`: Complete session data
- `SalesMetrics`: Performance metrics
- `SalesScenario`: Scenario configuration
- `CustomerScenario`: Scenario type enum

## Security & Environment Variables

### API Key Management

**Critical: API keys are NEVER exposed to the frontend.**

#### Environment Variables Required

Add these to your Vercel project's environment variables (Settings > Vars):

```
GOOGLE_API_KEY=your_google_api_key
GEMINI_STT=chirp-3
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TTS=gemini-2.5-flash-tts
```

- `GOOGLE_API_KEY`: Your Google Cloud API key with access to Speech-to-Text and Gemini APIs
- `GEMINI_STT`: Speech-to-Text model (Chirp-3 recommended for accuracy)
- `GEMINI_MODEL`: Gemini model for conversational AI responses
- `GEMINI_TTS`: Optional - Gemini model for text-to-speech responses

#### How It Works

1. **Frontend**: Never contains API keys
   - Calls endpoint: `/api/sales-simulator/customer-response`
   - Sends only: conversation history, scenario, product name

2. **Backend Route** (Server-side only):
   ```typescript
   // app/api/sales-simulator/customer-response/route.ts
   const response = await fetch(
     `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
     {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({ ... })
     }
   );
   ```
   - Has access to `process.env.GOOGLE_API_KEY`
   - Never transmits key to client
   - Validates requests before processing

3. **Error Handling**:
   - If API fails, returns fallback response
   - Never exposes actual error details to client
   - Logs errors server-side only

### Access Control

```
Frontend (Client)         Backend (Server)
┌──────────────┐        ┌──────────────────┐
│ SpeechRecorder         │ /api/customer-   │
│ (transcript)  ──────>  │   response       │
│              <────────  │ (uses API key)   │
└──────────────┘        └──────────────────┘
                              │
                              ├─> Has API key ✓
                              └─> Makes secure API call ✓
```

## How to Use the System

### For Trainers/Administrators

#### Adding a New Sales Scenario

1. **Add scenario to mock data** (`/lib/mock-data.ts`):
```typescript
// Add to mockCourses
{
  id: '6',
  title: 'Enterprise SaaS Sales',
  description: 'Practice selling complex enterprise software',
  category: 'Sales',
  creatorId: '2',
  status: 'published',
}

// Add to mockModules
'6': [
  {
    id: 'm8',
    courseId: '6',
    title: 'SaaS Platform Pitch',
    description: 'Pitch to enterprise decision maker',
    order: 1,
    createdAt: new Date(),
  }
]

// Add to mockLessons
'm8': [
  {
    id: 'l7',
    moduleId: 'm8',
    title: 'Enterprise Platform Sales',
    content: '<h2>Pitch our enterprise platform...</h2>',
    order: 1,
    createdAt: new Date(),
  }
]
```

2. **Update LessonContent component** to detect your new lesson:
```typescript
{lesson.id === 'l7' ? (
  <AISalesSimulator
    productName="Enterprise Platform"
    productDescription="..."
    productPrice="Custom"
    scenarioDescription="..."
  />
) : null}
```

#### Using the ConversationSimulator Component

```tsx
import { ConversationSimulator } from '@/components/sales-simulator/ConversationSimulator';

<ConversationSimulator
  scenario="warm_lead"  // 'skeptical' | 'warm_lead' | 'random'
  productName="CloudSync Pro"
  initialMessage="Tell me about your product..."
  onConversationUpdate={(messages) => {
    // Handle conversation update
  }}
  onMetricsUpdate={(metrics) => {
    // Handle metrics update
  }}
/>
```

### For Trainees

#### How to Practice

1. **Access the Sales Course**: Navigate to "AI Sales Pitch Simulator" course
2. **Select a Scenario**:
   - Skeptical Customer: Most challenging, requires strong ROI focus
   - Warm Lead: Medium difficulty, customer is already interested
   - Random: Variable difficulty, adapts to your approach
3. **Start Simulation**: Click "Start Sales Simulation"
4. **Speak or Type**: Use microphone for realistic practice
5. **Monitor Metrics**: Watch conviction rate and engagement score in real-time
6. **Close the Deal**: Continue until customer is convinced (80%+ conviction)

#### Best Practices for Sales Training

- **Ask clarifying questions**: Understand customer needs first
- **Provide specific examples**: Use concrete case studies
- **Address objections directly**: Don't avoid concerns
- **Focus on benefits, not features**: Show what customer gains
- **Speak naturally**: Avoid sales jargon and buzzwords
- **Listen more**: Understand before pitching

## Technical Details

### Message Flow

```
Trainee Speech/Text
       ↓
[SpeechRecorder Component]
       ↓
Transcript String
       ↓
[POST /api/sales-simulator/customer-response]
       ↓
Backend:
- Format conversation history
- Get system prompt for scenario
- Call OpenAI via AI Gateway
- Calculate conviction delta
       ↓
AI Customer Response
       ↓
[ConversationSimulator Component]
- Add to message history
- Update metrics
- Display response
- Read aloud (optional)
```

### Conviction Rate Calculation

The conviction rate is affected by:
1. **Conversation length**: More turns increase conviction
2. **Content quality**: Mentions of benefits, ROI, examples
3. **Scenario type**: Warm leads start at 40%, skeptical at 20%, random at 30%
4. **AI response**: Customer objections lower rate, positive responses raise it

### Pitch Quality Scoring

Quality increases with:
- Response length (substantive answers)
- Feature/benefit mentions
- Customer-focused language
- Business value discussion (time, cost, ROI)
- Concrete examples
- Asking about customer needs

## Deployment

### Prerequisites

1. **Google Cloud Project Setup**
   - Create a project at console.cloud.google.com
   - Enable Speech-to-Text API
   - Enable Generative Language API (for Gemini)
   - Create an API key (Credentials > Create Credentials > API Key)

2. **Required APIs Enabled**
   - Cloud Speech-to-Text API (for Chirp-3)
   - Generative Language API (for Gemini)
   - Web Speech API is browser-native (no setup needed)

### Environment Setup

```bash
# Add to .env.local (development)
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_STT=chirp-3
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TTS=gemini-2.5-flash-tts

# Vercel Dashboard (production)
# Settings > Environment Variables > Add variables
# 1. Key: GOOGLE_API_KEY, Value: your_google_api_key
# 2. Key: GEMINI_STT, Value: chirp-3
# 3. Key: GEMINI_MODEL, Value: gemini-2.5-flash
# 4. Key: GEMINI_TTS, Value: gemini-2.5-flash-tts
```

### Testing

1. **Local Testing**:
   ```bash
   npm run dev
   # Visit http://localhost:3000/courses
   # Navigate to AI Sales Pitch Simulator
   # Select a scenario and start
   ```

2. **Microphone Testing**:
   - Allow microphone access when prompted
   - Speak clearly for best transcription
   - Check browser console for speech recognition errors

## Troubleshooting

### Common Issues

**Microphone not working**
- Check browser microphone permissions
- Try a different browser (Chrome recommended)
- Ensure HTTPS in production (required by Web Speech API)

**AI responses not appearing**
- Check `GOOGLE_API_KEY` is set correctly in Vercel environment variables
- Verify that Speech-to-Text and Generative Language APIs are enabled in Google Cloud
- Verify route `/api/sales-simulator/customer-response` exists
- Check browser console for error details
- Fallback message should appear if API fails

**Metrics not updating**
- Ensure `onMetricsUpdate` callback is implemented
- Check that metrics are being calculated in ConversationSimulator
- Verify SalesMetricsTracker component is rendered

**Speech recognition unreliable**
- Use English (en-US) language setting
- Speak clearly and at normal pace
- Use microphone in quiet environment
- Consider fallback to text input

## Future Enhancements

### Phase 2
- Audio recording and playback
- Conversation recording for review
- Advanced sentiment analysis
- Custom scenario creation

### Phase 3
- Multi-language support
- Video with face-to-face simulation
- Competitor product knowledge
- Sales methodology integration (SPIN, Consultative, etc.)

### Phase 4
- Peer comparison and leaderboards
- Sales manager analytics dashboard
- Integration with CRM systems
- Gamification and achievements

## Support

For issues or questions:
1. Check this documentation first
2. Review console logs for errors
3. Verify environment variables are set
4. Test in development environment first
5. Contact platform admin for environment variable issues

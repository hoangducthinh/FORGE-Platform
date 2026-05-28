# Sales Simulator Quick Start Guide

## 5-Minute Setup

### 1. Add Environment Variable
```
Location: Vercel Dashboard > Project Settings > Environment Variables
Key: AI_GATEWAY_API_KEY
Value: (your Vercel AI Gateway key)
```

### 2. Verify Components Exist
✓ `/components/sales-simulator/SpeechRecorder.tsx` - Speech input
✓ `/components/sales-simulator/ConversationSimulator.tsx` - Main simulator
✓ `/components/sales-simulator/SalesMetricsTracker.tsx` - Performance tracking
✓ `/components/sales-simulator/SimulatorLesson.tsx` - Wrapper
✓ `/app/api/sales-simulator/customer-response/route.ts` - Backend API
✓ `/lib/sales-simulator.ts` - Configuration
✓ `/lib/speech-utils.ts` - Speech utilities

### 3. Deploy
```bash
git push  # Triggers Vercel deployment
# Wait for build to complete
```

## How It Works

### Frontend Flow
```
Trainee Speaks/Types
    ↓
SpeechRecorder captures text
    ↓
ConversationSimulator sends to API
    ↓
Backend calls OpenAI via Vercel AI Gateway
    ↓
Customer response + metrics returned
    ↓
Display in conversation + update dashboard
```

### Security
- ✓ API key stored in Vercel environment (never in code)
- ✓ Frontend only sends transcript, never API key
- ✓ Backend makes secure API calls server-side
- ✓ All sensitive operations server-side only

## Key Features

### Three Customer Scenarios
1. **Skeptical** (Hard) - Questions everything, needs ROI proof
2. **Warm Lead** (Medium) - Already interested, easy to convince
3. **Random** (Variable) - Personality adapts to trainee approach

### Performance Metrics
- **Conviction Rate**: How convinced customer is (0-100%)
- **Pitch Quality**: Quality of trainee responses (0-100%)
- **Engagement**: Overall conversation quality (0-100%)
- **Conversation Turns**: Number of back-and-forths
- **Objections Handled**: Counter of handled concerns

### Speech Recognition
- Uses browser's Web Speech API (Chrome, Safari, Edge)
- Falls back to text input if unavailable
- No external API calls for transcription
- Real-time, on-device processing

## Testing Locally

```bash
# 1. Add to .env.local
AI_GATEWAY_API_KEY=test_key

# 2. Start dev server
npm run dev

# 3. Navigate to course
http://localhost:3000/courses

# 4. Find "AI Sales Pitch Simulator" course
# 5. Select a scenario and start talking!
```

## Customizing Scenarios

### Add New Customer Personality

**Step 1**: Update `/lib/sales-simulator.ts`
```typescript
export const SALES_SCENARIOS: Record<CustomerScenario, SalesScenario> = {
  // ... existing ...
  enterprise: {
    id: 'enterprise-scenario',
    name: 'Enterprise Decision Maker',
    type: 'skeptical',  // Base behavior
    productName: 'CloudSync Enterprise',
    productDescription: 'Enterprise platform for large organizations',
    customerPersonality: 'Formal, ROI-focused, wants 5-year contract...',
    initialObjection: 'We need to see implementation timeline...',
    winConditions: [...],
  }
};

export const SYSTEM_PROMPTS = {
  // ... existing ...
  enterprise: `You are an enterprise decision maker...`,
};
```

**Step 2**: Add to lesson in `/components/lesson/LessonContent.tsx`
```typescript
{lesson.id === 'l8' ? (
  <AISalesSimulator
    productName="CloudSync Enterprise"
    productDescription="..."
    productPrice="Custom"
    scenarioDescription="..."
  />
) : null}
```

## Common Tasks

### Disable Speech Recognition (Use Text Only)
```typescript
// In SpeechRecorder.tsx
const isSupported = false;  // Force text mode
```

### Change Default Scenario
```typescript
// In SimulatorLesson.tsx
const defaultScenario: CustomerScenario = 'warm_lead';  // Instead of 'random'
```

### Adjust Starting Conviction Rate
```typescript
// In sales-simulator.ts
export function initializeMetrics(): SalesMetrics {
  return {
    convictionRate: 50,  // Change from 30
    // ... other metrics
  };
}
```

### Modify AI Model
```typescript
// In app/api/sales-simulator/customer-response/route.ts
const MODEL = 'openai/gpt-4';  // Change from gpt-4-mini
```

## Monitoring & Debugging

### Check Logs
```bash
# Terminal where `npm run dev` runs
# Look for [v0] prefixed logs
```

### Browser Console
- Check for API errors
- Verify speech recognition status
- Monitor fetch requests

### Vercel Deployment Logs
```
Dashboard > Deployments > Select > Logs
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Microphone not working | Check browser permissions, try Chrome |
| API key not found | Verify in Vercel > Settings > Environment Variables |
| No customer responses | Check `AI_GATEWAY_API_KEY` is set and valid |
| Speech not transcribing | Try typing instead (fallback) or use Chrome |
| Metrics not updating | Check browser console for JavaScript errors |
| Text-to-speech not working | Optional feature, not required for core functionality |

## What's Included

### Components
- Speech recording with Web Speech API
- Conversation management
- Real-time metrics dashboard
- Scenario selection UI
- Full conversation history

### Backend
- Customer response generation via OpenAI
- Conviction rate calculation
- Error handling and fallbacks
- Secure API key management

### Configuration
- 3 customer personas (skeptical, warm, random)
- System prompts for each personality
- Pitch quality evaluation
- Engagement scoring algorithm

## Next Steps

1. **Deploy** to Vercel with environment variable
2. **Test** locally with microphone enabled
3. **Share** course link with trainees
4. **Monitor** usage and gather feedback
5. **Customize** scenarios based on your products

## Support Resources

- Implementation Guide: `/docs/SALES_SIMULATOR_IMPLEMENTATION.md`
- API Route: `/app/api/sales-simulator/customer-response/route.ts`
- Types: `/lib/types.ts` (SalesSession, SalesMetrics, etc.)
- Demo Course: Course ID '5' in `/lib/mock-data.ts`

## Technical Stack

- **Frontend**: Next.js, React, TypeScript
- **Speech**: Web Speech API (browser-native)
- **AI**: Vercel AI Gateway (OpenAI)
- **Storage**: In-memory (session-based, no database)
- **Styling**: Tailwind CSS, shadcn/ui

---

**Ready to launch?** Deploy with your `AI_GATEWAY_API_KEY` and start training sales teams!

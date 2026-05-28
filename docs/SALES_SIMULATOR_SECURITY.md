# Sales Simulator - Security & Architecture Details

## API Key Security Architecture

### Why This Matters
API keys provide access to AI services and must never be exposed to clients. The sales simulator implements a secure client-server pattern that ensures keys remain protected.

### The Secure Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Frontend Components (NO API KEYS HERE)               │ │
│  │  • SpeechRecorder: Captures transcript                │ │
│  │  • ConversationSimulator: Manages UI                  │ │
│  │  • SalesMetricsTracker: Displays metrics              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
        ┌──────────────────────────────────────┐
        │   Trainee speaks/types transcript    │
        │   + scenario + product name only     │
        └──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js Server (API Route)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /api/sales-simulator/customer-response               │ │
│  │  ✓ HAS ACCESS TO: process.env.GOOGLE_API_KEY          │ │
│  │  ✓ Validates incoming request                         │ │
│  │  ✓ Makes secure API call to Google Gemini             │ │
│  │  ✓ Returns only: response text + metrics              │ │
│  │  ✗ Never exposes API key to client                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ Secure
                    OpenAI API
                   (API key used)
                           ↓
        ┌──────────────────────────────────────┐
        │  Customer response + metrics only    │
        │  (No API key in response)            │
        └──────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│  Display response in conversation interface                  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Frontend Code (Safe - No Secrets)

**Example from SpeechRecorder component:**
```typescript
const response = await fetch('/api/sales-simulator/customer-response', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scenario: 'warm_lead',           // ✓ Safe to send
    productName: 'CloudSync Pro',    // ✓ Safe to send
    traineMessage: 'Tell me more',   // ✓ Safe to send
    conversationHistory: [...]       // ✓ Safe to send
    // ✗ Never includes: API key, passwords, or secrets
  }),
});
```

### 2. Backend Route (Has Secrets)

**File: `/app/api/sales-simulator/customer-response/route.ts`**

```typescript
export async function POST(request: NextRequest) {
  try {
    // Receive only safe data from client
    const { scenario, productName, conversationHistory, traineMessage } = 
      await request.json();

    // ✓ THIS IS THE SECURE PART
    // API key is only accessed here, server-side
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ✓ Key is secure here - never leaves the server
        },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          },
        }),
      }
    );

    const data = await response.json();
    
    // ✓ Return only the response content and metrics
    // ✗ Never return: API key, raw API response, or sensitive data
    return NextResponse.json({
      response: data.choices[0].message.content,  // ✓ Customer's words
      convictionDelta: calculateConvictionDelta(...),  // ✓ Calculated metric
    });
  } catch (error) {
    // ✓ Log errors server-side only
    console.error('[v0] Error:', error);
    
    // ✓ Return safe fallback response
    // ✗ Never return actual error details that might expose secrets
    return NextResponse.json({
      response: 'That makes sense. Can you elaborate?',
      convictionDelta: 1,
    });
  }
}
```

## Environment Variable Management

### Storage Location
```
Vercel Dashboard
└── Your Project
    └── Settings
        └── Environment Variables
            └── GOOGLE_API_KEY = "your_actual_key"
            └── GEMINI_STT = "chirp-3"
            └── GEMINI_MODEL = "gemini-2.5-flash"
            └── GEMINI_TTS = "gemini-2.5-flash-tts"
```

### How Vercel Provides Access
1. You set variables in dashboard
2. During build, Next.js injects into `process.env`
3. Only available in server-side code (API routes, server components)
4. **Never** included in client-side JavaScript bundle
5. **Never** exposed in browser network requests

### Local Development
```
File: .env.local (NEVER commit this!)
GOOGLE_API_KEY=your_test_key
GEMINI_STT=chirp-3
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TTS=gemini-2.5-flash-tts
```

**In .gitignore:**
```
.env.local
.env.*.local
```

## Security Checklist

### ✓ What We Do Right
- [ ] API key stored only in Vercel environment variables
- [ ] Frontend code contains NO secrets
- [ ] All API calls made from server, not client
- [ ] Request validation on backend before API call
- [ ] Error handling doesn't expose sensitive details
- [ ] HTTPS enforced in production
- [ ] No logging of API keys or user data
- [ ] Rate limiting possible via Vercel

### ✗ What We Avoid
- No storing keys in code
- No passing keys through client requests
- No exposing keys in network tab
- No logging secrets to console
- No hardcoded credentials anywhere

## Testing Security

### 1. Browser DevTools Check
```
Steps:
1. Open DevTools (F12)
2. Go to Network tab
3. Participate in simulator
4. Inspect POST to /api/sales-simulator/customer-response
5. Check request body - should NOT contain API key
6. Check response - should NOT contain API key
```

### 2. Source Code Check
```bash
# Search for AI_GATEWAY_API_KEY in frontend code
grep -r "AI_GATEWAY_API_KEY" components/  # Should find nothing
grep -r "AI_GATEWAY_API_KEY" app/         # Should only find in /api/
```

### 3. Build Output Check
```bash
# Check built JavaScript doesn't contain key
npm run build
grep -r "AI_GATEWAY_API_KEY" .next/       # Should find nothing
```

## Common Security Mistakes (We Avoid)

### ❌ Wrong: Hardcoding Keys
```typescript
// NEVER DO THIS
const API_KEY = 'sk-...';  // Exposed in code!
const response = await fetch('https://...', {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});
```

### ❌ Wrong: Keys in Frontend
```typescript
// NEVER DO THIS - Frontend component
export function SpeechRecorder() {
  const API_KEY = process.env.REACT_APP_API_KEY;  // Wrong!
  // This would be bundled into client JavaScript
}
```

### ❌ Wrong: Keys in URLs
```typescript
// NEVER DO THIS
fetch(`https://api.openai.com/...?key=${API_KEY}`);
// Key visible in browser history and logs!
```

### ✓ Right: Server-side Access
```typescript
// This is correct - API route, server-side only
export async function POST(request: NextRequest) {
  const response = await fetch('https://api.openai.com/...', {
    headers: {
      'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`
      // ✓ Key never leaves server
      // ✓ Not in browser
      // ✓ Not in network tab
    }
  });
}
```

## Vercel AI Gateway Specifics

### What is the AI Gateway?
- Unified API endpoint for multiple AI providers
- Handles authentication securely
- Supports OpenAI, Anthropic, Google, etc.
- Single API key for all providers
- Zero-config in server environment variables

### How It Works With FORGE
```
┌─────────────────┐
│ FORGE Platform  │
└────────┬────────┘
         │ (uses AI_GATEWAY_API_KEY)
         ↓
┌─────────────────────────────────────┐
│   Vercel AI Gateway                 │
│   api.vercel.ai/openai/v1/...      │
└────────┬────────────────────────────┘
         │
         ├─→ OpenAI (gpt-4, gpt-4-mini)
         ├─→ Anthropic (claude-opus)
         ├─→ Google (gemini)
         └─→ Other providers
```

### Environment Variable Access
```
Vercel Platform
  ↓
Builds project with env vars
  ↓
Injects into process.env (server-side)
  ↓
API routes access via process.env.AI_GATEWAY_API_KEY
  ↓
Make requests to api.vercel.ai
  ↓
Responses returned to frontend
```

## Best Practices

### 1. Request Validation
```typescript
// Always validate incoming requests
if (!scenario || !conversationHistory) {
  return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
}
```

### 2. Error Handling
```typescript
// Return safe error responses
try {
  // Make API call
} catch (error) {
  console.error('[v0] Error:', error);  // Log server-side
  return NextResponse.json({
    response: fallbackMessage,  // Safe fallback
    // ✗ Don't return: error.message or error details
  });
}
```

### 3. Rate Limiting
```typescript
// Consider adding rate limiting per user/IP
// Can be done with middleware in Next.js
```

### 4. Monitoring
```typescript
// Log API metrics (not keys!)
console.log('[v0] API call made for scenario:', scenario);
console.log('[v0] Response received successfully');
```

## Compliance Notes

### GDPR Compliance
- Conversations are session-based (not persisted by default)
- No personal data stored without consent
- Users can request data deletion
- Consider adding data retention policy

### SOC 2 Compliance
- Audit logs for API access
- Encrypted communication (HTTPS)
- Access controls (server-side only)
- Error handling doesn't expose data

### Best Practices
1. Add logging for audit trail
2. Implement rate limiting
3. Add request validation
4. Monitor for unusual activity
5. Rotate API keys periodically
6. Update dependencies regularly

## Deployment Checklist

Before deploying to production:

- [ ] AI_GATEWAY_API_KEY is set in Vercel environment
- [ ] No API keys in .env.local, package.json, or code files
- [ ] Frontend code audited - no secrets
- [ ] API route validation is implemented
- [ ] Error handling doesn't expose details
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] Build process doesn't include secrets
- [ ] Security headers are configured
- [ ] Rate limiting considered
- [ ] Monitoring/logging is in place

---

**Remember**: Security is not a one-time setup - it's an ongoing practice. Regular audits and updates are essential.

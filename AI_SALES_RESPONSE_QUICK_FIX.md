# Quick Reference: AI Sales Response Fix

## What Changed?

### Problem
- Gemini responses were being truncated
- JSON parsing was failing
- Token limit (150) was too low

### Solution
✅ Use **plain text format** instead of JSON  
✅ Increase **token limit to 300**  
✅ **Regex parsing** for reliability  

---

## Response Format

### Gemini Should Return
```
RESPONSE: <customer response here>
SCORE: <0-100>
FEEDBACK: <brief feedback>
```

### No More
```
❌ JSON format
❌ Markdown code blocks
❌ Multiple languages
```

---

## Code Examples

### Parse Function
```typescript
function parseTextResponse(rawText: string): ParsedResponse {
  const responseMatch = rawText.match(/RESPONSE:\s*(.+?)(?=\nSCORE:|$)/s);
  const scoreMatch = rawText.match(/SCORE:\s*(\d+)/);
  const feedbackMatch = rawText.match(/FEEDBACK:\s*(.+?)$/s);
  
  // Returns: { response, score, feedback }
  // With fallback values if parsing fails
}
```

### System Prompt Snippet
```typescript
`IMPORTANT: Return your response in PLAIN TEXT using this exact format:

RESPONSE: <your customer reply here - 1-2 sentences>
SCORE: <number between 0 and 100>
FEEDBACK: <short feedback on their pitch - one line>`
```

### Generation Config
```typescript
generationConfig: {
  maxOutputTokens: 300,  // ← Was 150, now 300
  temperature: 0.7,
}
```

---

## Logging Added

```typescript
console.log('[v0] Max tokens:', 300);
console.log('[v0] Finish reason:', finishReason);     // ← NEW
console.log('[v0] Raw text length:', rawText.length); // ← NEW
console.log('[v0] Raw text:', rawText.substring(0, 200)); // ← NEW
console.log('[v0] Parsed response:', { ... });        // ← NEW
```

---

## Fallback Values (If Parsing Fails)

```typescript
{
  response: "I'm interested, can you tell me more?",
  score: 50,
  feedback: "Keep pitching!"
}
```

---

## Testing

### In Browser Console
```javascript
// After sending message to AI customer:
fetch('/api/ai-sales-response', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userMessage: "We offer a 30% discount",
    productName: "CloudSync Pro",
    productDescription: "Cloud-based project management",
    productPrice: "$99/month",
    conversationHistory: []
  })
})
.then(r => r.json())
.then(console.log)
```

Expected output:
```json
{
  "response": "That sounds interesting! What about support?",
  "score": 65,
  "feedback": "Good value proposition"
}
```

---

## Logs to Check

### Success
```
[v0] ========== AI SALES RESPONSE REQUEST ==========
[v0] Model: gemini-2.5-flash
[v0] Max tokens: 300
[v0] ========== GEMINI API SUCCESS ==========
[v0] Finish reason: STOP
[v0] Raw text length: 250
[v0] Raw text: RESPONSE: ...
[v0] Parsed response: { response: "...", score: 65, feedback: "..." }
```

### Warning
```
[v0] Finish reason: MAX_TOKENS  ← Response might be cut off
[v0] Raw text length: 50      ← Response too short
```

### Error
```
[v0] Error parsing text response: ...
[v0] AI response error: ...
```

---

## FAQ

**Q: Why plain text instead of JSON?**  
A: JSON can be truncated mid-object. Plain text is simpler and more reliable.

**Q: Why increase token limit to 300?**  
A: Customer response + score + feedback needs ~150-250 tokens. 300 is safe.

**Q: What if parsing fails?**  
A: Returns fallback values: "I'm interested, can you tell me more?", score: 50, feedback: "Keep pitching!"

**Q: Does this break the frontend?**  
A: No, still returns `{ response, score, feedback }` JSON.

**Q: What's finishReason?**  
A: Tells if response was complete (STOP) or cut off (MAX_TOKENS).

---

## File Location
`app/api/ai-sales-response/route.ts`

## Related Files
- `hooks/useConversation.ts` - Calls this endpoint
- `lib/types.ts` - ConversationMessage interface

---

**Status**: ✅ Production Ready

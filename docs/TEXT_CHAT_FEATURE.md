# Text Chat Alternative Feature

## Overview

The text chat alternative feature provides users with a text-based conversation mode alongside the existing voice-based sales simulator. This ensures accessibility across all devices and network conditions while maintaining a seamless, professional user experience.

## Architecture

### Components

**1. ModeToggle Component** (`components/sales-simulator/ModeToggle.tsx`)
- Allows users to switch between Voice and Text modes
- Provides clear visual feedback on current mode
- Responsive design: icons only on mobile, text on desktop
- Uses orange FORGE branding for active state

**2. TextChatInput Component** (`components/sales-simulator/TextChatInput.tsx`)
- Text input area with auto-resizing textarea
- Send button with Send icon
- Keyboard shortcuts: Ctrl+Enter (Cmd+Enter on Mac) to send
- Shift+Enter for new lines
- Disabled state when loading
- Helpful hint text for keyboard navigation

**3. useConversation Hook** (`hooks/useConversation.ts`)
- Manages conversation state (messages, loading, errors)
- Handles message sending for both voice and text modes
- Automatically fetches TTS audio when available
- Gracefully handles TTS API failures

### Updated Components

**AISalesSimulator** (`components/lesson/AISalesSimulator.tsx`)
- Added mode state management
- Integrated ModeToggle component
- Conditional rendering based on active mode
- New `handleTextMessage()` method
- Reuses existing AI response logic for both modes

## Features

### Voice Mode (Existing)
- Microphone input via Web Speech API
- Audio transcription via Google Speech-to-Text API
- Voice responses with text-to-speech via Google TTS API
- Play button to replay audio responses
- All existing functionality preserved

### Text Mode (New)
- Type-to-send interface
- Real-time message display
- Audio playback of AI responses (when TTS is available)
- Same AI backend using `/api/ai-sales-response` endpoint
- Keyboard-friendly (Tab navigation, Ctrl+Enter to send)

## API Integration

Both modes use the same backend endpoint:
- **Endpoint**: `/api/ai-sales-response`
- **Text TTS**: `/api/text-to-speech` (optional, fails gracefully)
- **Voice STT**: `/api/transcribe` (voice mode only)

## Responsive Design

### Mobile (< 768px)
- Stacked layout: Full-width mode toggle, messages, input
- Icons only in mode toggle (text hidden)
- Single-column message display
- Full-width text input area

### Tablet/Desktop (≥ 768px)
- Side-by-side layout: Messages on left, metrics on right
- Text + icons in mode toggle buttons
- Optimal message width (max-w-xs)
- Spacious input area

## Accessibility Features

- **Keyboard Navigation**: Full support for Tab, Enter, Ctrl+Enter
- **ARIA Labels**: Semantic button labels for screen readers
- **Contrast**: Orange/gray scheme meets WCAG AA standards
- **Focus States**: Visible focus indicators on all interactive elements
- **Text Hints**: Clear instructions for keyboard shortcuts
- **Error Messages**: Accessible error notifications with icons
- **Mode Indicators**: Clear visual feedback on active mode

## Usage

### Switching Modes

Users can switch between Voice and Text modes using the ModeToggle button at the top of the conversation panel. Mode switching is instant and doesn't affect conversation history.

### Text Mode Interaction

1. **Type Message**: Click the text input area and type your sales pitch
2. **Send Message**: 
   - Click the "Send" button, or
   - Press Ctrl+Enter (Cmd+Enter on Mac), or
   - Press Enter on mobile (Shift+Enter for new line)
3. **Listen**: AI response automatically plays audio if available
4. **Continue**: Type your next response

### Voice Mode Interaction

1. **Start Recording**: Click "Start Speaking" button
2. **Speak**: Talk naturally to the AI customer
3. **Stop**: Recording stops automatically after 2 seconds of silence
4. **Listen**: AI response automatically plays audio
5. **Continue**: Start speaking again

## Error Handling

### Text Mode Errors
- **API Failure**: Shows error message, allows retry by sending another message
- **Network Issues**: Graceful fallback, suggests checking connection
- **Invalid Input**: Disabled send button for empty messages

### Voice Mode Errors
- **Microphone Access**: Alert prompts user to check browser permissions
- **Transcription Failure**: Error message with retry option
- **Audio Playback**: Falls back to silent mode, message still displays

### TTS Failures (Both Modes)
- Doesn't break user experience
- Message displays normally without audio
- No error shown to user (graceful degradation)

## Configuration

No additional configuration required. The feature uses existing environment variables:
- `GOOGLE_API_KEY`: For both STT and TTS APIs
- `GEMINI_MODEL`: For AI response generation

## Future Enhancements

1. **Message History**: Persist and restore conversations
2. **Export Conversations**: Download chat transcript
3. **Performance Metrics**: Time-to-response, message count analysis
4. **Typing Indicators**: Show when AI is generating response
5. **Rich Text Support**: Markdown formatting in messages
6. **Multi-language Support**: Support for different languages beyond en-US

## Files Structure

```
components/
  sales-simulator/
    ModeToggle.tsx
    TextChatInput.tsx
    SpeechRecorder.tsx (existing)
    ConversationSimulator.tsx (existing)
    ...
  lesson/
    AISalesSimulator.tsx (updated)

hooks/
  useConversation.ts (new)

lib/
  sales-simulator.ts (existing)
  types.ts (existing)
```

## Testing Checklist

- [ ] Text mode input sends messages
- [ ] Voice mode records and transcribes
- [ ] Mode switching preserves conversation history
- [ ] Audio plays on both modes when available
- [ ] Mobile layout is responsive (< 768px)
- [ ] Desktop layout is optimal (≥ 768px)
- [ ] Keyboard navigation works (Tab, Enter, Ctrl+Enter)
- [ ] Error messages display correctly
- [ ] TTS failures don't crash the app
- [ ] Voice mode still works without text mode

## Known Limitations

1. **Text Mode Audio**: Requires TTS API; fails gracefully if unavailable
2. **Voice Mode**: Requires microphone permissions and Web Speech API support
3. **Keyboard Shortcuts**: Ctrl+Enter may conflict with some browser extensions
4. **Audio Playback**: Limited by browser autoplay policies (user interaction required)

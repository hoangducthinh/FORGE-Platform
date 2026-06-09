import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, language = 'vi-VN' } = await request.json();

    console.log('[TTS] ========== REQUEST START ==========');
    console.log('[TTS] Text (first 100 chars):', text?.substring(0, 100));

    if (!text || text.trim().length === 0) {
      console.error('[TTS] No text provided');
      return NextResponse.json(
        { error: 'No text provided', audioBase64: '', fallback: true },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      console.error('[TTS] ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID not configured');
      return NextResponse.json(
        {
          error: 'ElevenLabs credentials not configured',
          audioBase64: '',
          fallback: true,
        },
        { status: 500 }
      );
    }

    console.log('[TTS] Calling ElevenLabs TTS API');

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    // We try eleven_flash_v2_5 for speed and low cost, fallback to turbo/multilingual if needed.
    const requestBody = {
      text,
      model_id: 'eleven_flash_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.1,
        use_speaker_boost: true,
      }
    };

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[TTS] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] API Error:', response.status, errorText);

      // User reminder: For ElevenLabs free accounts, library voices are not allowed via API.
      // Please use a default/cloned voice ID in ELEVENLABS_VOICE_ID, or upgrade your plan.
      if (response.status === 402 || errorText.includes('paid_plan_required')) {
        return NextResponse.json(
          {
            error: 'ELEVENLABS_VOICE_NOT_AVAILABLE_FOR_FREE_PLAN',
            audioBase64: '',
            fallback: true,
          },
          { status: 200 } // Return 200 to prevent frontend crash, handle gracefully via fallback
        );
      }

      return NextResponse.json(
        {
          error: `TTS API failed: ${response.status}`,
          audioBase64: '',
          fallback: true,
        },
        { status: 200 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString('base64');
    const mimeType = 'audio/mpeg';

    console.log('[TTS] ✅ Audio generated successfully');
    console.log('[TTS] Audio size:', audioBase64.length, 'bytes');
    console.log('[TTS] ========== REQUEST SUCCESS ==========');

    return NextResponse.json({
      audioBase64,
      mimeType,
      fallback: false,
      language,
    });
  } catch (error) {
    console.error('[TTS] ❌ EXCEPTION:', error);
    return NextResponse.json(
      {
        error: 'TTS exception',
        audioBase64: '',
        fallback: true,
      },
      { status: 200 }
    );
  }
}
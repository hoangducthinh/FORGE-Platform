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

    let response: Response | null = null;
    let attempts = 0;
    const maxAttempts = 2; // 1 initial + 1 retry

    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`[TTS] Attempt ${attempts}...`);
        response = await fetch(elevenLabsUrl, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(20000) // Increase timeout to 20000ms
        });
        
        if (response.ok) {
          break; // Success
        }
        
        const errorText = await response.text();
        console.error(`[TTS] Attempt ${attempts} API Error:`, response.status, errorText);
        if (response.status === 402 || errorText.includes('paid_plan_required')) {
          break; // Don't retry auth/billing errors
        }
      } catch (err: any) {
        console.error(`[TTS] Attempt ${attempts} fetch error:`, err.message || err);
        if (attempts >= maxAttempts) {
           break;
        }
      }
    }

    if (!response || !response.ok) {
      console.warn('[TTS] ⚠️ TTS fallback no-audio');
      return NextResponse.json(
        {
          success: false,
          audio: null,
          error: `TTS_TIMEOUT`
        },
        { status: 200 } // Return 200 to prevent frontend crash
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[TTS] ✅ TTS success. Audio generated.');
    console.log('[TTS] Audio size:', buffer.length, 'bytes');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[TTS] ❌ EXCEPTION:', error.message || error);
    console.warn('[TTS] ⚠️ TTS fallback no-audio');
    return NextResponse.json(
      {
        success: false,
        audio: null,
        error: 'TTS exception: ' + (error.message || 'unknown'),
      },
      { status: 200 }
    );
  }
}
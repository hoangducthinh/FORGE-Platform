import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, language = 'en-US' } = await request.json();

    console.log('[TTS] ========== REQUEST START ==========');
    console.log('[TTS] Text (first 100 chars):', text?.substring(0, 100));
    console.log('[TTS] Language:', language);

    if (!text || text.trim().length === 0) {
      console.error('[TTS] No text provided');
      return NextResponse.json(
        { error: 'No text provided', audioBase64: '', fallback: true },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const ttsModel = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';

    if (!apiKey) {
      console.error('[TTS] GEMINI_API_KEY not configured');
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY not configured',
          audioBase64: '',
          fallback: true,
        },
        { status: 500 }
      );
    }

    console.log('[TTS] Calling Gemini TTS API');
    console.log('[TTS] Model:', ttsModel);
    console.log('[TTS] API Key present:', !!apiKey);

    // Call Gemini TTS API with audio generation
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: language === 'vi-VN' ? 'Kore' : 'Puck',
            },
          },
        },
      },
    };

    console.log('[TTS] Sending request to:', geminiUrl.split('?')[0]);
    console.log('[TTS] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[TTS] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] API Error:', response.status, errorText);

      return NextResponse.json(
        {
          error: `TTS API failed: ${response.status}`,
          audioBase64: '',
          fallback: true,
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    console.log('[TTS] Response received from Gemini');
    console.log('[TTS] Has candidates:', !!data?.candidates?.length);
    console.log(
      '[TTS] Has audio data:',
      !!data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    );
    console.log(
      '[TTS] Audio mime type:',
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType
    );
    console.log(
      '[TTS] Audio base64 length:',
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data?.length || 0
    );

    // Extract audio from Gemini TTS response
    const audioContent =
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
    const mimeType =
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (!audioContent) {
      console.warn('[TTS] No audio content in response');
      console.log('[TTS] Response keys:', Object.keys(data));
      if (data.candidates) {
        console.log('[TTS] Candidates:', JSON.stringify(data.candidates, null, 2));
      }

      return NextResponse.json(
        {
          error: 'No audio content generated',
          audioBase64: '',
          fallback: true,
        },
        { status: 200 }
      );
    }

    console.log('[TTS] ✅ Audio generated successfully');
    console.log('[TTS] Audio size:', audioContent.length, 'bytes');
    console.log('[TTS] MIME type:', mimeType);
    console.log('[TTS] ========== REQUEST SUCCESS ==========');

    return NextResponse.json({
      audioBase64: audioContent,
      mimeType: mimeType,
      fallback: false,
      language: language,
    });
  } catch (error) {
    console.error('[TTS] ❌ EXCEPTION:', error);
    console.error('[TTS] Error type:', typeof error);
    if (error instanceof Error) {
      console.error('[TTS] Error message:', error.message);
      console.error('[TTS] Error stack:', error.stack);
    }

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
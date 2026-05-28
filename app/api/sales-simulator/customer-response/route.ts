import { NextRequest, NextResponse } from 'next/server';
import { ConversationMessage, CustomerScenario } from '@/lib/types';
import {
  getSystemPrompt,
  SALES_SCENARIOS,
  determineCustomerStage,
  determineSaleOutcome,
  getStageSpecificInstruction,
  getFallbackResponseForStage,
} from '@/lib/sales-simulator';

// Google Gemini model for AI responses
const MODEL = 'gemini-2.5-flash';

export async function POST(request: NextRequest) {
  try {
    const { scenario, productName, conversationHistory, traineMessage, turnCount, sessionScore } =
      await request.json();

    console.log('[v0] ========== GEMINI API REQUEST ==========');
    console.log('[v0] Model:', MODEL);
    console.log('[v0] Scenario:', scenario);
    console.log('[v0] Turn count:', turnCount);
    console.log('[v0] Session score:', sessionScore);

    if (!scenario || !conversationHistory || !traineMessage) {
      console.error('[v0] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[v0] GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Determine current stage
    const currentStage = determineCustomerStage(turnCount, sessionScore, scenario as CustomerScenario);
    console.log('[v0] Current stage:', currentStage);

    // Get stage-specific instruction
    const stageInstruction = getStageSpecificInstruction(currentStage);

    // Get the system prompt for this scenario with stage instruction
    const baseSystemPrompt = getSystemPrompt(scenario as CustomerScenario);
    const systemPrompt = baseSystemPrompt + '\n\n' + stageInstruction;
    console.log('[v0] System prompt with stage:', systemPrompt.substring(0, 100));

    // Format conversation history for the Gemini API
    const messages = conversationHistory.map((msg: ConversationMessage) => ({
      role: msg.role === 'trainee' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    console.log('[v0] Formatted messages count:', messages.length);

    // Build the request body for Gemini API
    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
      },
    };

    console.log('[v0] Request body prepared with stage:', currentStage);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    // Call Gemini API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[v0] Gemini API Response Status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[v0] ========== GEMINI API ERROR ==========');
      console.error('[v0] Status:', response.status);
      console.error('[v0] Error Response:', error);

      try {
        const errorJson = JSON.parse(error);
        console.error('[v0] Error JSON:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('[v0] Could not parse error as JSON');
      }

      // Fallback response
      const fallbackResponse = getFallbackResponseForStage(currentStage);
      return NextResponse.json({
        response: fallbackResponse,
        convictionDelta: 1,
        stage: currentStage,
        outcome: null,
        isConversationComplete: false,
      });
    }

    const data = await response.json();
    console.log('[v0] ========== GEMINI API SUCCESS ==========');

    let customerResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      getFallbackResponseForStage(currentStage);

    console.log('[v0] Raw response:', customerResponse);

    // Clean up incomplete sentences
    customerResponse = cleanupIncompleteResponse(customerResponse);

    // Calculate conviction delta
    const convictionDelta = calculateConvictionDelta(
      traineMessage,
      scenario as CustomerScenario
    );

    // Determine if conversation should close and outcome
    let outcome = null;
    let isConversationComplete = false;

    if (currentStage === 'closing' && turnCount >= 6) {
      const finalScore = sessionScore + convictionDelta;
      outcome = determineSaleOutcome(finalScore, turnCount + 1, scenario as CustomerScenario);
      isConversationComplete = outcome !== null;

      console.log('[v0] Sale outcome determined:', outcome);

      // If closing, inject outcome into response
      if (outcome && isConversationComplete) {
        customerResponse = generateClosingResponse(outcome, scenario as CustomerScenario);
      }
    }

    return NextResponse.json({
      response: customerResponse,
      convictionDelta,
      stage: currentStage,
      outcome,
      isConversationComplete,
    });
  } catch (error) {
    console.error('[v0] Error in customer-response route:', error);

    return NextResponse.json({
      response: 'Nghe cũng khá ổn. Bạn có thể giải thích thêm được không?',
      convictionDelta: 1,
      stage: 'mid',
      outcome: null,
      isConversationComplete: false,
    });
  }
}

/**
 * Clean up incomplete responses
 */
function cleanupIncompleteResponse(response: string): string {
  let cleaned = response.trim();

  // Remove trailing incomplete words
  const incompleteEndings = [
    'nhưng',
    'và',
    'hoặc',
    'để',
    'vì',
    'làm',
    'khi',
    'nếu',
    'hay',
    'là',
    ',',
  ];

  incompleteEndings.forEach((ending) => {
    const regex = new RegExp(`\\s+${ending}$`, 'i');
    cleaned = cleaned.replace(regex, '');
  });

  // If too short, return with fallback
  if (cleaned.length < 15) {
    cleaned = 'Nghe cũng hay. Bạn có thể giải thích thêm được không?';
  }

  return cleaned;
}

/**
 * Generate closing response with outcome
 */
function generateClosingResponse(outcome: string, scenario: string): string {
  const responses: Record<string, Record<string, string>> = {
    buy: {
      skeptical:
        'Được rồi, tôi bị thuyết phục. Tôi quyết định mua CloudSync Pro. Bạn có thể cho tôi biết các bước tiếp theo như thế nào không?',
      warm_lead:
        'Tuyệt vời! Tôi thực sự ấn tượng với lời giới thiệu của bạn. Tôi muốn mua ngay bây giờ. Làm sao để bắt đầu?',
      random:
        'Tôi thích điều tôi nghe được. Tôi quyết định sẽ mua CloudSync Pro. Điều gì xảy ra tiếp theo?',
    },
    need_more_info: {
      skeptical:
        'Bạn đã trả lời khá tốt, nhưng tôi vẫn muốn có thêm một số thông tin trước khi quyết định. Tôi sẽ liên hệ lại trong vài ngày tới.',
      warm_lead:
        'Cảm ơn bạn! Tôi thích những gì bạn nói. Tôi muốn xem lại tài liệu và liên hệ với bạn nếu có câu hỏi thêm.',
      random:
        'Nghe cũng không tệ lắm. Nhưng tôi muốn tìm hiểu thêm trước khi quyết định. Bạn có thể gửi tài liệu cho tôi không?',
    },
    reject: {
      skeptical:
        'Tôi vẫn không chắc chắn. Cảm ơn bạn, nhưng lúc này tôi sẽ không mua CloudSync Pro. Có thể sẽ xem xét lại trong tương lai.',
      warm_lead:
        'Tôi đánh giá cao nỗ lực của bạn, nhưng tôi quyết định không mua ngay bây giờ. Có thể là lúc khác.',
      random:
        'Sau khi lắng nghe, tôi cảm thấy rằng sản phẩm này không phải là lựa chọn tốt nhất cho chúng tôi. Cảm ơn bạn.',
    },
  };

  return (
    responses[outcome]?.[scenario] || 'Cảm ơn bạn. Tôi sẽ quyết định sau.'
  );
}

function calculateConvictionDelta(traineMessage: string, scenario: CustomerScenario): number {
  let delta = 0;

  // Positive indicators
  if (
    traineMessage.toLowerCase().includes('benefit') ||
    traineMessage.toLowerCase().includes('save') ||
    traineMessage.toLowerCase().includes('improve') ||
    traineMessage.toLowerCase().includes('lợi ích') ||
    traineMessage.toLowerCase().includes('tiết kiệm') ||
    traineMessage.toLowerCase().includes('cải thiện')
  ) {
    delta += 5;
  }

  if (
    traineMessage.toLowerCase().includes('example') ||
    traineMessage.toLowerCase().includes('case study') ||
    traineMessage.toLowerCase().includes('customer') ||
    traineMessage.toLowerCase().includes('ví dụ') ||
    traineMessage.toLowerCase().includes('khách hàng')
  ) {
    delta += 5;
  }

  if (
    traineMessage.toLowerCase().includes('roi') ||
    traineMessage.toLowerCase().includes('cost') ||
    traineMessage.toLowerCase().includes('price') ||
    traineMessage.toLowerCase().includes('giá') ||
    traineMessage.toLowerCase().includes('chi phí')
  ) {
    delta += 3;
  }

  // Negative indicators
  if (
    traineMessage.toLowerCase().includes('uh') ||
    traineMessage.toLowerCase().includes('um') ||
    traineMessage.toLowerCase().includes('like') ||
    traineMessage.toLowerCase().includes('hmm')
  ) {
    delta -= 2;
  }

  // Scenario adjustments
  if (scenario === 'skeptical') {
    if (traineMessage.length > 100) delta += 2;
  } else if (scenario === 'warm_lead') {
    delta += 2;
  }

  return Math.max(1, delta);
}

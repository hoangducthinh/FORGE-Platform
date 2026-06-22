import { NextRequest, NextResponse } from 'next/server';
import { ConversationMessage, CustomerScenario, CustomerStage, SimulatorConfig, SimulatorEvaluation } from '@/lib/types';
import { getSystemPrompt } from '@/lib/sales-simulator';

// ─── Constants ────────────────────────────────────────────────────────────────
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20';

// ─── Types ────────────────────────────────────────────────────────────────────
type ClosingOutcome = 'INTERESTED' | 'FOLLOW_UP' | 'NOT_INTERESTED';

interface GeminiResponse {
  customerReply: string;
  nextStage: 'early' | 'mid' | 'closing' | 'complete';
  closingOutcome: ClosingOutcome | null;
  isConversationComplete: boolean;
  topicKey?: string;
  followUpRequired?: boolean;
  scoreDelta: number;
  turnScore?: number;
  sessionScore?: number;
  feedback: string;
  evaluation?: SimulatorEvaluation;
  salesAnalysis: {
    understoodUserMessage: string;
    missedOpportunity: string;
    nextBestAction: string;
  };
}

// ─── Default Configurations ─────────────────────────────────────────────────
const DEFAULT_SALES_CONFIG: SimulatorConfig = {
  mode: 'sales_simulation',
  sessionSettings: {
    estimatedMinutes: 15,
    minTurns: 8,
    maxTurns: 10,
    maxFollowUpsPerTopic: 1,
    maxRepeatedQuestion: 0,
    autoCompleteScore: 80
  },
  stageTurnTargets: {
    early: 2,
    mid: 5,
    closing: 2,
    complete: 1
  },
  questionStrategy: {
    basicQuestions: 2,
    deepQuestions: 3,
    objections: 2,
    closingQuestions: 2
  }
};

const DEFAULT_KNOWLEDGE_CONFIG: SimulatorConfig = {
  mode: 'knowledge_check',
  sessionSettings: {
    estimatedMinutes: 10,
    minQuestions: 5,
    maxQuestions: 7,
    maxFollowUpsPerQuestion: 1,
    passingScore: 70
  },
  questionDistribution: {
    basic: 2,
    understanding: 2,
    application: 2,
    summary: 1
  }
};

// ─── Information Score Calculator ────────────────────────────────────────────
function calculateInformationScore(history: ConversationMessage[]): number {
  const allTraineeText = history
    .filter(m => m.role === 'trainee')
    .map(m => m.content.toLowerCase())
    .join(' ');

  let score = 0;
  if (allTraineeText.match(/vị trí|đường |quận|phường|thuận an|bình dương|tp.hcm|hồ chí minh|hạ long|quảng yên|hải phòng|vingroup|vinhomes|chủ đầu tư/)) score += 20;
  if (allTraineeText.match(/tiềm năng|tăng giá|lợi nhuận|đầu tư|cho thuê|quy hoạch|hạ tầng/)) score += 20;
  if (allTraineeText.match(/giá|tỷ|triệu|m²|mét vuông|tài chính/)) score += 20;
  if (allTraineeText.match(/vay|ngân hàng|lãi suất|thanh toán|trả góp/)) score += 20;
  if (allTraineeText.match(/chiết khấu|ưu đãi|khuyến mãi|hỗ trợ lãi|tặng|miễn phí/)) score += 20;

  return score;
}

// ─── Resolve Stage Logic ───────────────────────────────────────────────────
function resolveStage(
  config: SimulatorConfig,
  informationScore: number,
  turnCount: number,
  currentStage: CustomerStage,
): CustomerStage {
  if (config.mode === 'knowledge_check') {
    const kcConfig = config;
    if (turnCount >= kcConfig.sessionSettings.maxQuestions) return 'closed';
    return 'mid'; // Default for knowledge check
  }

  const scConfig = config;
  const { early, mid } = scConfig.stageTurnTargets;

  if (currentStage === 'closed' || currentStage === ('complete' as any)) return 'closed';

  if (informationScore >= scConfig.sessionSettings.autoCompleteScore || turnCount >= scConfig.sessionSettings.maxTurns - scConfig.stageTurnTargets.closing) {
     return 'closing';
  }

  if (currentStage === 'early') {
     if (informationScore >= 40 || turnCount >= early) return 'mid';
     return 'early';
  }

  if (currentStage === 'mid') {
     if (turnCount >= (early + mid) || informationScore >= 80) return 'closing';
     return 'mid';
  }

  return currentStage;
}

// ─── JSON Sanitiser ───────────────────────────────────────────────────────────
function sanitizeJsonStringValues(json: string): string {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (ch === '\\' && inString) {
      result += ch; i++;
      if (i < json.length) { result += json[i]; i++; }
      continue;
    }
    if (ch === '"') { inString = !inString; result += ch; i++; continue; }
    if (inString && (ch === '\n' || ch === '\r' || ch === '\t')) { result += ' '; i++; continue; }
    result += ch; i++;
  }
  return result;
}

function safeParseCustomerResponse(rawText: string): GeminiResponse | null {
  try {
    let c = rawText.trim().replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const f = c.indexOf('{'), l = c.lastIndexOf('}');
    if (f !== -1 && l > f) c = c.slice(f, l + 1);
    return JSON.parse(sanitizeJsonStringValues(c)) as GeminiResponse;
  } catch (_) {}

  try {
    const s = rawText.replace(/[\n\r\t]/g, ' ');
    const f = s.indexOf('{'), l = s.lastIndexOf('}');
    if (f !== -1 && l > f) return JSON.parse(s.slice(f, l + 1)) as GeminiResponse;
  } catch (_) {}

  console.warn('[v0] ⚠️ All parse layers failed — regex extraction');
  
  const replyM    = rawText.match(/"customerReply"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const feedbackM = rawText.match(/"feedback"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const scoreM    = rawText.match(/"scoreDelta"\s*:\s*(-?\d+)/);
  const turnScoreM = rawText.match(/"turnScore"\s*:\s*(\d+)/);
  const stageM    = rawText.match(/"nextStage"\s*:\s*"(early|mid|closing|complete)"/);
  const outcomeM  = rawText.match(/"closingOutcome"\s*:\s*"(INTERESTED|FOLLOW_UP|NOT_INTERESTED)"/);
  const completeM = rawText.match(/"isConversationComplete"\s*:\s*(true|false)/);
  const topicKeyM = rawText.match(/"topicKey"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);

  if (!replyM?.[1]) return null;

  return {
    customerReply: replyM[1],
    nextStage: (stageM?.[1] as any) ?? 'early',
    closingOutcome: (outcomeM?.[1] as ClosingOutcome) ?? null,
    isConversationComplete: completeM?.[1] === 'true',
    scoreDelta: scoreM ? parseInt(scoreM[1], 10) : 0,
    turnScore: turnScoreM ? parseInt(turnScoreM[1], 10) : undefined,
    topicKey: topicKeyM?.[1] ?? undefined,
    feedback: feedbackM?.[1] ?? 'Đã ghi nhận câu trả lời.',
    salesAnalysis: { understoodUserMessage: '', missedOpportunity: '', nextBestAction: '' },
    _isPartial: true
  } as any;
}

// ─── Dynamic Fallback ────────────────────────────────────────────────────────
function buildDynamicFallback(traineMessage: string, stage: CustomerStage, previousAiReplies: string[] = []): string {
  const normPrev = previousAiReplies.map(t => t.toLowerCase().trim());
  const options = [
    'Thuận An cụ thể khu nào? Khu vực đó gần tiện ích gì và đi về Sài Gòn mất bao lâu?',
    'Khu vực Hạ Long tiềm năng du lịch rất tốt. Dự án của Vinhomes có lợi thế gì nổi bật so với các dự án khác quanh đó?',
    'Vị trí nghe thuận tiện đó. Hạ tầng khu vực xung quanh đang phát triển như thế nào?',
    'Tiện ích nội khu ổn. Vậy pháp lý dự án ra sao, đã có sổ đỏ chưa?',
    'Pháp lý nghe rõ ràng. Vậy giá bán bao nhiêu và chính sách thanh toán thế nào?',
    'Giá đó có hỗ trợ vay ngân hàng không? Lãi suất ưu đãi ra sao?',
    'Lợi nhuận kỳ vọng có số liệu thực tế từ các dự án tương tự không?',
    'Chủ đầu tư có dự án nào bàn giao đúng tiến độ rồi chưa?'
  ];
  const freshOptions = options.filter(opt => !normPrev.includes(opt.toLowerCase().trim()));
  if (freshOptions.length > 0) return freshOptions[0];
  return 'Thông tin khá đầy đủ. Bạn giải thích thêm về chính sách bán hàng giúp tôi.';
}

// ─── Normalize for anti-loop ─────────────────────────────────────────────────
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?;:""'']/g, '').replace(/\s+/g, ' ');
}

// ─── Stage Prompt ────────────────────────────────────────────────────────────
function buildStagePrompt(
  config: SimulatorConfig,
  stage: CustomerStage,
  informationScore: number,
  turnCount: number,
  previousAiReplies: string[],
): string {
  const checklist = `
Thông tin nhận được đến nay (informationScore = ${informationScore}/100):
${informationScore >= 20 ? '✓' : '✗'} Vị trí rõ ràng
${informationScore >= 40 ? '✓' : '✗'} Tiềm năng đầu tư
${informationScore >= 60 ? '✓' : '✗'} Giá / tài chính
${informationScore >= 60 ? '✓' : '✗'} Chính sách vay
${informationScore >= 80 ? '✓' : '✗'} Ưu đãi / chiết khấu`.trim();

  if (config.mode === 'knowledge_check') {
    return `
=== GIAI ĐOẠN KIỂM TRA KIẾN THỨC ===
Bạn đã hỏi ${turnCount} câu.
Tối thiểu cần hỏi: ${config.sessionSettings.minQuestions} câu.
Tối đa được hỏi: ${config.sessionSettings.maxQuestions} câu.

Mỗi câu chỉ được follow-up tối đa ${config.sessionSettings.maxFollowUpsPerQuestion} lần. Nếu học viên vẫn sai, đưa feedback và hỏi sang câu mới.
Nếu đã hỏi đủ ${config.sessionSettings.maxQuestions} câu, BẮT BUỘC trả về isConversationComplete = true và nextStage = "complete".
`;
  }

  const scConfig = config as SalesSimulationConfig;
  
  if (stage === 'closing' || stage === ('complete' as any)) {
    return `
=== GIAI ĐOẠN: CLOSING ===
${checklist}
Bạn PHẢI chọn MỘT trong 3 hướng và đặt isConversationComplete = true:
- INTERESTED: "Thông tin khá phù hợp. Bạn gửi bảng giá chi tiết nhé."
- FOLLOW_UP: "Tôi đã có đủ thông tin để đánh giá. Cho tôi thêm thời gian cân nhắc."
- NOT_INTERESTED: "Dự án tốt nhưng chưa phù hợp kế hoạch tài chính của tôi hiện tại."
nextStage phải là "complete".
`;
  }

  if (stage === 'mid') {
    return `
=== GIAI ĐOẠN: MID ===
${checklist}
Lượt thứ: ${turnCount} / ${scConfig.sessionSettings.maxTurns}
Tập trung vào: chính sách vay, chiết khấu, lợi nhuận cho thuê, pháp lý.
ANTI-LOOP: KHÔNG lặp lại câu hỏi đã hỏi.
Nếu turnCount >= ${scConfig.sessionSettings.maxTurns - scConfig.stageTurnTargets.closing} → nextStage = "closing".
`;
  }

  return `
=== GIAI ĐOẠN: EARLY ===
${checklist}
Hỏi tổng quan dự án. Lượt thứ ${turnCount} / ${scConfig.stageTurnTargets.early}.
Khi đã hiểu cơ bản → nextStage = "mid".
`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scenario       = 'random',
      productName    = 'Căn hộ cao cấp',
      productDescription,
      productPrice,
      conversationHistory = [] as ConversationMessage[],
      traineMessage,
      turnCount      = 1,
      sessionScore   = 50,
      currentStage: clientStage = 'early',
      mode = 'sales_simulation',
      simulatorConfig: providedConfig
    } = body;

    if (!traineMessage) return NextResponse.json({ error: 'Missing traineMessage' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

    // Inject configuration defaults
    const isKnowledgeCheck = mode === 'knowledge_check';
    const defaultConfig = isKnowledgeCheck ? DEFAULT_KNOWLEDGE_CONFIG : DEFAULT_SALES_CONFIG;
    
    // Merge provided config with defaults to prevent undefined nested objects
    const config: any = {
      ...defaultConfig,
      ...(providedConfig || {})
    };
    
    // Deep merge sessionSettings
    if (defaultConfig.sessionSettings) {
      config.sessionSettings = {
        ...defaultConfig.sessionSettings,
        ...(providedConfig?.sessionSettings || {})
      };
    }
    
    // Deep merge stageTurnTargets if sales simulation
    if (!isKnowledgeCheck && (defaultConfig as any).stageTurnTargets) {
      config.stageTurnTargets = {
        ...(defaultConfig as any).stageTurnTargets,
        ...(providedConfig?.stageTurnTargets || {})
      };
    }

    const fullHistory: ConversationMessage[] = [
      ...conversationHistory,
      { id: 'cur', role: 'trainee', content: traineMessage, timestamp: new Date() },
    ];
    const informationScore = calculateInformationScore(fullHistory);

    const resolvedStage = resolveStage(config, informationScore, turnCount, clientStage as CustomerStage);

    console.log('[v0] ===== CUSTOMER-RESPONSE =====');
    console.log('[v0] Turn:', turnCount, '| resolvedStage:', resolvedStage);
    console.log('[v0] Config Mode:', config.mode);

    const previousAiReplies = (conversationHistory as ConversationMessage[])
      .filter(m => m.role === 'customer' || m.role === 'ai')
      .map(m => m.content);

    const formattedHistory = (conversationHistory as ConversationMessage[])
      .map(m => `${m.role === 'trainee' || m.role === 'user' ? 'Nhân viên' : 'Khách/AI'}: ${m.content}`)
      .join('\n');

    const previousRepliesBlock = previousAiReplies.length > 0
      ? `\nCÁC CÂU BẠN ĐÃ NÓI TRONG PHIÊN NÀY (BẮT BUỘC KHÔNG ĐƯỢC LẶP LẠI Ý NÀY NỮA):\n${previousAiReplies.map((r, i) => `${i + 1}. "${r}"`).join('\n')}`
      : '';

    const stagePrompt = buildStagePrompt(
      config,
      resolvedStage,
      informationScore,
      turnCount,
      previousAiReplies,
    );

    const basePersona = getSystemPrompt(scenario as CustomerScenario);

    let finalPrompt = '';

    if (config.mode === 'knowledge_check') {
      finalPrompt = `Bạn là AI Huấn luyện viên kiểm tra kiến thức bất động sản.
=== BỐI CẢNH ===
Học viên đang được kiểm tra kiến thức cơ bản về bất động sản, pháp lý, và kinh nghiệm tư vấn.
Sản phẩm: ${productName} - ${productDescription || ''}
LỊCH SỬ:
${formattedHistory}
${previousRepliesBlock}

CÂU HỌC VIÊN VỪA TRẢ LỜI:
"${traineMessage.slice(-800)}"

${stagePrompt}

=== CÁCH CHẤM ĐIỂM (EVALUATION - TỪ 0 ĐẾN 10) ===
Chấm điểm lượt này trên 5 tiêu chí:
- informationAccuracy: Tính chính xác kiến thức
- needsDiscovery: Mức độ hiểu câu hỏi
- answerStructure: Cấu trúc trả lời rõ ràng
- objectionHandling: Khả năng phản biện/giải thích
- nextStepClosing: Tính ứng dụng thực tế
turnScore = trung bình cộng 5 tiêu chí trên (nhân 10 để ra thang điểm 100).
scoreDelta = turnScore - 50.

=== FEEDBACK (TỐI ĐA 50 TỪ) ===
1. Nêu điểm học viên trả lời ĐÚNG.
2. Chỉ ra điểm THIẾU hoặc SAI.
3. Gợi ý CẢI THIỆN cụ thể.

=== QUY TẮC TRẢ LỜI ===
- customerReply: Tối đa 25 từ. Chỉ đặt 1 câu hỏi.
- KHÔNG lặp lại câu hỏi.
`;
    } else {
      finalPrompt = `${basePersona}

=== BỐI CẢNH ===
Bạn là khách hàng giả lập trong bài training sales bất động sản.
Sản phẩm: ${productName} - ${productDescription || ''} - Giá: ${productPrice || 'Liên hệ'}

LỊCH SỬ HỘI THOẠI:
${formattedHistory}
${previousRepliesBlock}

CÂU NHÂN VIÊN VỪA NÓI:
"${traineMessage.slice(-800)}"

${stagePrompt}

=== CHỐNG LẶP (ANTI-LOOP BẮT BUỘC) ===
KHÔNG HỎI LẠI những ý đã liệt kê trong "CÁC CÂU BẠN ĐÃ NÓI". Dùng topicKey khác biệt (ví dụ: "tien_ich", "phap_ly", "vi_tri").

=== CÁCH CHẤM ĐIỂM (EVALUATION - TỪ 0 ĐẾN 10) ===
- informationAccuracy: Thông tin sản phẩm chính xác
- needsDiscovery: Hỏi han nhu cầu khách
- answerStructure: Lời lẽ tư vấn mạch lạc
- objectionHandling: Xử lý từ chối/vấn đề của khách
- nextStepClosing: Có hẹn chốt/đề xuất tiếp theo không?
turnScore = trung bình cộng 5 tiêu chí trên (nhân 10 để ra thang điểm 100).
scoreDelta = (turnScore - 50) / 2.

=== QUY TẮC TRẢ LỜI ===
- customerReply: BẮT BUỘC CHỈ 1 CÂU, TỐI ĐA 25 TỪ.
- feedback: 30-50 từ, nêu rõ nhân viên làm tốt gì, thiếu gì, và cải thiện gì.
`;
    }

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 1536,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            customerReply: { type: 'STRING' },
            nextStage: { type: 'STRING', enum: ['early', 'mid', 'closing', 'complete'] },
            closingOutcome: { type: 'STRING', enum: ['INTERESTED', 'FOLLOW_UP', 'NOT_INTERESTED'], nullable: true },
            isConversationComplete: { type: 'BOOLEAN' },
            scoreDelta: { type: 'INTEGER' },
            turnScore: { type: 'INTEGER' },
            topicKey: { type: 'STRING' },
            followUpRequired: { type: 'BOOLEAN' },
            feedback: { type: 'STRING' },
            evaluation: {
               type: 'OBJECT',
               properties: {
                 informationAccuracy: { type: 'INTEGER' },
                 needsDiscovery: { type: 'INTEGER' },
                 answerStructure: { type: 'INTEGER' },
                 objectionHandling: { type: 'INTEGER' },
                 nextStepClosing: { type: 'INTEGER' }
               }
            }
          },
          required: ['customerReply', 'nextStage', 'isConversationComplete', 'scoreDelta', 'turnScore', 'feedback', 'evaluation'],
        },
      },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!geminiRes.ok) {
      console.error('[v0] Gemini error', geminiRes.status, await geminiRes.text());
      return NextResponse.json(buildFallbackResponse(traineMessage, resolvedStage, scenario, turnCount, sessionScore, informationScore, previousAiReplies));
    }

    const geminiData = await geminiRes.json();
    const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    let responseSource = 'gemini';

    const parsed = safeParseCustomerResponse(rawText);
    if (!parsed) {
      return NextResponse.json(buildFallbackResponse(traineMessage, resolvedStage, scenario, turnCount, sessionScore, informationScore, previousAiReplies));
    }

    let customerReply = parsed.customerReply?.trim() || buildDynamicFallback(traineMessage, resolvedStage, previousAiReplies);
    const normPrev = previousAiReplies.map(normalizeText);
    if (parsed.customerReply && normPrev.includes(normalizeText(parsed.customerReply))) {
      customerReply = buildDynamicFallback(traineMessage, resolvedStage, previousAiReplies);
      responseSource = 'dynamic_fallback';
    } else if (!parsed.customerReply) {
      responseSource = 'dynamic_fallback';
    }

    let effectiveStage: CustomerStage = parsed.nextStage as any || resolvedStage;
    let closingOutcome = parsed.closingOutcome ?? null;
    let isConversationComplete = parsed.isConversationComplete ?? false;

    if (effectiveStage === ('complete' as any) || effectiveStage === 'closed' || (config.mode === 'sales_simulation' && informationScore >= 80)) {
      isConversationComplete = true;
      effectiveStage = 'closed';
      if (!closingOutcome && config.mode === 'sales_simulation') {
        const finalConviction = sessionScore + (parsed.turnScore || 50) / 10;
        closingOutcome = finalConviction >= 70 ? 'INTERESTED' : finalConviction >= 45 ? 'FOLLOW_UP' : 'NOT_INTERESTED';
      }
      if (config.mode === 'sales_simulation' && closingOutcome) {
         const map: any = { INTERESTED: 'Thông tin khá thuyết phục. Bạn gửi giúp tôi bảng giá chi tiết nhé.', FOLLOW_UP: 'Cho tôi thêm thời gian đánh giá.', NOT_INTERESTED: 'Dự án chưa phù hợp với tôi lúc này.' };
         customerReply = map[closingOutcome] || customerReply;
      }
    }

    const turnScore = parsed.turnScore ?? 50;
    const aiScore = Math.min(100, Math.max(0, Math.round((sessionScore * turnCount + turnScore) / (turnCount + 1)))); // Simple moving average

    return NextResponse.json({
      customerReply,
      response: customerReply,
      responseSource,
      stage: effectiveStage,
      nextStage: effectiveStage,
      closingOutcome,
      isConversationComplete,
      score: aiScore,
      scoreDelta: parsed.scoreDelta ?? 0,
      turnScore,
      topicKey: parsed.topicKey,
      evaluation: parsed.evaluation,
      informationScore,
      feedback: parsed.feedback ?? 'Tiếp tục tốt nhé.',
      salesAnalysis: parsed.salesAnalysis ?? null,
      outcome: closingOutcome,
    });

  } catch (err) {
    console.error('[v0] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function buildFallbackResponse(
  traineMessage: string,
  stage: CustomerStage,
  scenario: string,
  turnCount: number,
  sessionScore: number,
  informationScore: number,
  previousAiReplies: string[] = []
) {
  const customerReply = buildDynamicFallback(traineMessage, stage, previousAiReplies);
  const isClosing = stage === 'closing' || stage === ('closed' as any);
  return {
    customerReply,
    response: customerReply,
    responseSource: 'dynamic_fallback',
    stage,
    nextStage: stage,
    closingOutcome: isClosing ? 'FOLLOW_UP' : null,
    isConversationComplete: isClosing,
    score: sessionScore,
    scoreDelta: 0,
    turnScore: 50,
    informationScore,
    feedback: 'AI feedback đang tạm lỗi. Hãy tiếp tục tư vấn.',
    outcome: isClosing ? 'FOLLOW_UP' : null,
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { ConversationMessage, CustomerScenario, CustomerStage } from '@/lib/types';
import { getSystemPrompt } from '@/lib/sales-simulator';

// ─── Constants ────────────────────────────────────────────────────────────────
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20';

// ─── Types ────────────────────────────────────────────────────────────────────
type ClosingOutcome = 'INTERESTED' | 'FOLLOW_UP' | 'NOT_INTERESTED';

interface GeminiResponse {
  customerReply: string;
  nextStage: 'early' | 'mid' | 'closing';
  closingOutcome: ClosingOutcome | null;
  isConversationComplete: boolean;
  scoreDelta: number;
  feedback: string;
  salesAnalysis: {
    understoodUserMessage: string;
    missedOpportunity: string;
    nextBestAction: string;
  };
}

// ─── Information Score Calculator ────────────────────────────────────────────
/**
 * Scans the FULL conversation history to compute how much information
 * the trainee has already provided.  Each category is worth 20 pts → max 100.
 */
function calculateInformationScore(history: ConversationMessage[]): number {
  const allTraineeText = history
    .filter(m => m.role === 'trainee')
    .map(m => m.content.toLowerCase())
    .join(' ');

  let score = 0;

  // Vị trí và chủ đầu tư (+20)
  if (
    allTraineeText.includes('vị trí') ||
    allTraineeText.includes('đường ') ||
    allTraineeText.includes('quận') ||
    allTraineeText.includes('phường') ||
    allTraineeText.includes('thuận an') ||
    allTraineeText.includes('bình dương') ||
    allTraineeText.includes('tp.hcm') ||
    allTraineeText.includes('hồ chí minh') ||
    allTraineeText.includes('hạ long') ||
    allTraineeText.includes('quảng yên') ||
    allTraineeText.includes('hải phòng') ||
    allTraineeText.includes('vingroup') ||
    allTraineeText.includes('vinhomes') ||
    allTraineeText.includes('chủ đầu tư')
  ) score += 20;

  // Tiềm năng đầu tư (+20)
  if (
    allTraineeText.includes('tiềm năng') ||
    allTraineeText.includes('tăng giá') ||
    allTraineeText.includes('lợi nhuận') ||
    allTraineeText.includes('đầu tư') ||
    allTraineeText.includes('cho thuê') ||
    allTraineeText.includes('quy hoạch') ||
    allTraineeText.includes('hạ tầng')
  ) score += 20;

  // Giá hoặc tài chính (+20)
  if (
    allTraineeText.includes('giá') ||
    allTraineeText.includes('tỷ') ||
    allTraineeText.includes('triệu') ||
    allTraineeText.includes('m²') ||
    allTraineeText.includes('mét vuông') ||
    allTraineeText.includes('tài chính')
  ) score += 20;

  // Chính sách vay (+20)
  if (
    allTraineeText.includes('vay') ||
    allTraineeText.includes('ngân hàng') ||
    allTraineeText.includes('lãi suất') ||
    allTraineeText.includes('thanh toán') ||
    allTraineeText.includes('trả góp')
  ) score += 20;

  // Ưu đãi / chiết khấu (+20)
  if (
    allTraineeText.includes('chiết khấu') ||
    allTraineeText.includes('ưu đãi') ||
    allTraineeText.includes('khuyến mãi') ||
    allTraineeText.includes('hỗ trợ lãi') ||
    allTraineeText.includes('tặng') ||
    allTraineeText.includes('miễn phí')
  ) score += 20;

  return score;
}

/**
 * Determine which stage the customer SHOULD be in, based on informationScore
 * and turnCount — this is the ground truth used server-side.
 */
function resolveStage(
  informationScore: number,
  turnCount: number,
  currentStage: CustomerStage,
): CustomerStage {
  // Force CLOSING if score >= 80
  if (informationScore >= 80) return 'closing';

  // Progress to MID after EARLY once basics covered (score >= 20) or turn 3+
  if (currentStage === 'early' && (informationScore >= 20 || turnCount >= 3)) return 'mid';

  // Stay MID unless score forces closing
  if (currentStage === 'mid') return 'mid';

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
  // Layer 1 – sanitise & parse
  try {
    let c = rawText.trim().replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const f = c.indexOf('{'), l = c.lastIndexOf('}');
    if (f !== -1 && l > f) c = c.slice(f, l + 1);
    return JSON.parse(sanitizeJsonStringValues(c)) as GeminiResponse;
  } catch (_) {}

  // Layer 2 – strip all control chars
  try {
    const s = rawText.replace(/[\n\r\t]/g, ' ');
    const f = s.indexOf('{'), l = s.lastIndexOf('}');
    if (f !== -1 && l > f) return JSON.parse(s.slice(f, l + 1)) as GeminiResponse;
  } catch (_) {}

  // Layer 3 – regex field extraction (Partial Parse)
  console.warn('[v0] ⚠️ All parse layers failed — regex extraction');
  
  // Use more tolerant regex for partial extraction
  const replyM    = rawText.match(/"customerReply"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const feedbackM = rawText.match(/"feedback"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const scoreM    = rawText.match(/"scoreDelta"\s*:\s*(-?\d+)/);
  const stageM    = rawText.match(/"nextStage"\s*:\s*"(early|mid|closing)"/);
  const outcomeM  = rawText.match(/"closingOutcome"\s*:\s*"(INTERESTED|FOLLOW_UP|NOT_INTERESTED)"/);
  const completeM = rawText.match(/"isConversationComplete"\s*:\s*(true|false)/);
  const understoodM = rawText.match(/"understoodUserMessage"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const missedM     = rawText.match(/"missedOpportunity"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const nextM       = rawText.match(/"nextBestAction"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);

  if (!replyM?.[1]) return null;

  return {
    customerReply: replyM[1],
    nextStage: (stageM?.[1] as any) ?? 'early',
    closingOutcome: (outcomeM?.[1] as ClosingOutcome) ?? null,
    isConversationComplete: completeM?.[1] === 'true',
    scoreDelta: scoreM ? parseInt(scoreM[1], 10) : 0,
    feedback: feedbackM?.[1] ?? 'Đã ghi nhận câu trả lời, hãy bổ sung thêm số liệu hoặc bước tiếp theo.',
    salesAnalysis: {
      understoodUserMessage: understoodM?.[1] ?? '',
      missedOpportunity: missedM?.[1] ?? '',
      nextBestAction: nextM?.[1] ?? '',
    },
    _isPartial: true // Custom flag for detection
  } as any;
}

// ─── Context-aware fallback reply ────────────────────────────────────────────
function buildDynamicFallback(traineMessage: string, stage: CustomerStage, previousAiReplies: string[] = []): string {
  const msg = traineMessage.toLowerCase();
  const normPrev = previousAiReplies.map(normalizeText);

  const options: string[] = [];

  if (msg.includes('thuận an') || msg.includes('thuan an'))
    options.push('Thuận An cụ thể khu nào? Khu vực đó gần tiện ích gì và đi về Sài Gòn mất bao lâu?');
  if (msg.includes('hạ long') || msg.includes('ha long') || msg.includes('vinhomes'))
    options.push('Khu vực Hạ Long tiềm năng du lịch rất tốt. Dự án của Vinhomes có lợi thế gì nổi bật so với các dự án khác quanh đó?');
  if (msg.includes('vị trí') || msg.includes('đại lộ') || msg.includes('đường'))
    options.push('Vị trí nghe thuận tiện đó. Hạ tầng khu vực xung quanh đang phát triển như thế nào?');
  if (msg.includes('tiện ích') || msg.includes('hồ bơi') || msg.includes('gym'))
    options.push('Tiện ích nội khu ổn. Vậy pháp lý dự án ra sao, đã có sổ đỏ chưa?');
  if (msg.includes('pháp lý') || msg.includes('sổ đỏ'))
    options.push('Pháp lý nghe rõ ràng. Vậy giá bán bao nhiêu và chính sách thanh toán thế nào?');
  if (msg.includes('giá') || msg.includes('tỷ') || msg.includes('thanh toán'))
    options.push('Giá đó có hỗ trợ vay ngân hàng không? Lãi suất ưu đãi ra sao?');
  if (msg.includes('chiết khấu') || msg.includes('ưu đãi'))
    options.push('Ưu đãi nghe hấp dẫn. Thông tin khá đủ, để tôi cân nhắc thêm nhé.');
  if (msg.includes('lợi nhuận') || msg.includes('đầu tư') || msg.includes('cho thuê'))
    options.push('Lợi nhuận kỳ vọng có số liệu thực tế từ các dự án tương tự không?');
  if (msg.includes('chủ đầu tư') || msg.includes('uy tín'))
    options.push('Chủ đầu tư có dự án nào bàn giao đúng tiến độ rồi chưa?');

  const stageFallbacks: Record<CustomerStage, string[]> = {
    early:   [
      'Dự án nghe có vẻ tiềm năng. Vị trí cụ thể ở đâu và gần những tiện ích gì?',
      'Bạn có thể cho tôi biết thêm thông tin tổng quan về quy mô dự án được không?',
      'Chủ đầu tư dự án này là ai và đã có những dự án nào thành công rồi?'
    ],
    mid:     [
      'Thông tin cơ bản khá rõ. Vậy chính sách vay và chiết khấu hiện tại thế nào?',
      'Về mặt pháp lý thì dự án hiện tại đã hoàn thiện đến đâu rồi?',
      'Tiến độ thanh toán chia làm bao nhiêu đợt và mỗi đợt khoảng bao nhiêu?'
    ],
    closing: [
      'Thông tin đã đủ để tôi đánh giá. Để tôi cân nhắc và phản hồi lại nhé.',
      'Bạn có thể gửi toàn bộ tài liệu dự án và bảng giá qua Zalo cho tôi tham khảo không?',
      'Tôi sẽ xem xét thêm. Bạn cứ lưu số tôi, có chính sách mới thì báo nhé.'
    ],
    closed:  ['Cảm ơn bạn đã tư vấn nhiệt tình. Tôi sẽ liên hệ lại khi cần.'],
  };

  options.push(...stageFallbacks[stage]);

  // Lọc ra những câu chưa từng hỏi
  const freshOptions = options.filter(opt => !normPrev.includes(normalizeText(opt)));

  if (freshOptions.length > 0) {
    return freshOptions[0];
  }

  // Nếu hết câu chưa hỏi, lấy đại câu đầu tiên của stage hiện tại nhưng thêm một chút biến tấu nhẹ
  return stageFallbacks[stage][0] + ' Bạn giải thích thêm phần này giúp tôi.';
}

// ─── Closing outcome responses ───────────────────────────────────────────────
function getClosingReply(outcome: ClosingOutcome, scenario: CustomerScenario): string {
  const map: Record<ClosingOutcome, Record<CustomerScenario, string>> = {
    INTERESTED: {
      skeptical: 'Thông tin khá thuyết phục. Bạn gửi giúp tôi bảng giá chi tiết và pháp lý để tôi xem xét nhé.',
      warm_lead: 'Rất phù hợp với nhu cầu của gia đình tôi. Tôi muốn đặt lịch tham quan dự án.',
      random:    'Tỷ suất lợi nhuận hợp lý. Tôi muốn giữ căn và trao đổi thêm về thủ tục đặt cọc.',
    },
    FOLLOW_UP: {
      skeptical: 'Tôi đã có đủ thông tin để đánh giá. Cho tôi thêm thời gian so sánh với một vài dự án khác rồi phản hồi lại.',
      warm_lead: 'Cảm ơn bạn! Tôi cần bàn thêm với gia đình trước. Cho tôi vài ngày nhé.',
      random:    'Tôi muốn so sánh thêm với một vài kênh đầu tư khác trước khi quyết định.',
    },
    NOT_INTERESTED: {
      skeptical: 'Dự án khá tốt nhưng hiện chưa phù hợp với kế hoạch tài chính của tôi. Tôi sẽ tạm dừng tìm hiểu.',
      warm_lead: 'Tôi đánh giá cao sự tư vấn, nhưng ngân sách gia đình chưa phù hợp lúc này.',
      random:    'Sau khi phân tích, tỷ suất lợi nhuận chưa đủ hấp dẫn so với các kênh đầu tư khác tôi đang xét.',
    },
  };
  return map[outcome][scenario];
}

// ─── Normalize for anti-loop ─────────────────────────────────────────────────
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?;:"""'']/g, '').replace(/\s+/g, ' ');
}

// ─── Score conviction delta ──────────────────────────────────────────────────
function calculateConvictionDelta(msg: string, scenario: CustomerScenario): number {
  const m = msg.toLowerCase();
  let d = 0;
  if (m.includes('vị trí') || m.includes('gần') || m.includes('đường')) d += 5;
  if (m.includes('pháp lý') || m.includes('sổ đỏ')) d += 5;
  if (m.includes('tiện ích') || m.includes('trường') || m.includes('bệnh viện')) d += 4;
  if (m.includes('giá') || m.includes('thanh toán') || m.includes('trả góp')) d += 3;
  if (m.includes('chủ đầu tư') || m.includes('uy tín') || m.includes('bàn giao')) d += 4;
  if (m.includes('lợi nhuận') || m.includes('tăng giá') || m.includes('cho thuê')) d += 4;
  if (m.includes('chiết khấu') || m.includes('ưu đãi') || m.includes('hỗ trợ lãi')) d += 4;
  if (msg.length < 15) d -= 3;
  if (scenario === 'warm_lead') d += 2;
  if (scenario === 'skeptical' && msg.length > 100) d += 2;
  return Math.max(1, d);
}

// ─── Build stage instructions for prompt ────────────────────────────────────
function buildStagePrompt(
  stage: CustomerStage,
  informationScore: number,
  turnCount: number,
  previousAiReplies: string[],
  repeatCounts: { timeLoop: number },
): string {
  const checklist = `
Thông tin nhận được đến nay (informationScore = ${informationScore}/100):
${informationScore >= 20 ? '✓' : '✗'} Vị trí rõ ràng
${informationScore >= 40 ? '✓' : '✗'} Tiềm năng đầu tư
${informationScore >= 60 ? '✓' : '✗'} Giá / tài chính
${informationScore >= 60 ? '✓' : '✗'} Chính sách vay
${informationScore >= 80 ? '✓' : '✗'} Ưu đãi / chiết khấu`.trim();

  if (stage === 'closing' || informationScore >= 80) {
    return `
=== GIAI ĐOẠN: CLOSING ===
${checklist}

BẮT BUỘC: Bạn đã có đủ thông tin. KHÔNG được tạo thêm câu hỏi mới.
Bạn PHẢI chọn MỘT trong 3 hướng và đặt isConversationComplete = true:

- INTERESTED (nếu thông tin hợp lý): "Thông tin khá phù hợp. Bạn gửi bảng giá chi tiết nhé." / "Tôi muốn đặt lịch tham quan."
- FOLLOW_UP (nếu cần thêm thời gian): "Tôi đã có đủ thông tin để đánh giá. Cho tôi thêm thời gian cân nhắc."
- NOT_INTERESTED (nếu chưa phù hợp): "Dự án tốt nhưng chưa phù hợp kế hoạch tài chính của tôi hiện tại."

nextStage phải là "closing".
closingOutcome phải là "INTERESTED", "FOLLOW_UP", hoặc "NOT_INTERESTED".
isConversationComplete phải là true.`;
  }

  if (stage === 'mid') {
    return `
=== GIAI ĐOẠN: MID ===
${checklist}

Bạn đã hiểu cơ bản. Được phép phản biện, nghi ngờ và yêu cầu số liệu cụ thể.
Tập trung vào: chính sách vay, chiết khấu, lợi nhuận cho thuê, pháp lý.

ANTI-LOOP:
- KHÔNG hỏi lặp lại cùng nội dung quá 2 lần.
- Nếu nhân viên đã trả lời hợp lý về điều gì đó → KHÔNG hỏi lại.
- Các câu đã hỏi: ${previousAiReplies.slice(-5).map((r, i) => `${i + 1}. "${r}"`).join('; ')}

Nếu informationScore >= 80 sau khi tính → nextStage = "closing".
Nếu chưa đủ → nextStage = "mid".
closingOutcome phải là null.
isConversationComplete phải là false.`;
  }

  return `
=== GIAI ĐOẠN: EARLY ===
${checklist}

Bạn đang tìm hiểu dự án lần đầu. Hỏi các câu tổng quan:
- Vị trí dự án ở đâu?
- Chủ đầu tư là ai?
- Tiện ích nội khu có gì?
- Giá khoảng bao nhiêu?
- Tiềm năng khu vực ra sao?

Khi đã hiểu cơ bản → nextStage = "mid".
closingOutcome phải là null.
isConversationComplete phải là false.`;
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
      mode = 'sales',
    } = body;

    if (!traineMessage) {
      return NextResponse.json({ error: 'Missing traineMessage' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // ── Compute informationScore from full history + current message ────────
    const fullHistory: ConversationMessage[] = [
      ...conversationHistory,
      { id: 'cur', role: 'trainee', content: traineMessage, timestamp: new Date() },
    ];
    const informationScore = calculateInformationScore(fullHistory);

    // ── Resolve actual stage (server-side ground truth) ────────────────────
    const resolvedStage = resolveStage(informationScore, turnCount, clientStage as CustomerStage);

    console.log('[v0] ===== CUSTOMER-RESPONSE =====');
    console.log('[v0] Turn:', turnCount, '| clientStage:', clientStage, '| resolvedStage:', resolvedStage);
    console.log('[v0] informationScore:', informationScore);
    console.log('[v0] traineMessage:', traineMessage);

    // ── Conversation context ───────────────────────────────────────────────
    const previousAiReplies = (conversationHistory as ConversationMessage[])
      .filter(m => m.role === 'customer')
      .map(m => m.content);

    const formattedHistory = (conversationHistory as ConversationMessage[])
      .map(m => `${m.role === 'trainee' ? 'Nhân viên' : 'Khách hàng'}: ${m.content}`)
      .join('\n');

    const previousRepliesBlock = previousAiReplies.length > 0
      ? `\nCÁC CÂU BẠN ĐÃ NÓI (KHÔNG lặp lại):\n${previousAiReplies.map((r, i) => `${i + 1}. "${r}"`).join('\n')}`
      : '';

    // Count how many times AI has said "cần thêm thời gian" variations
    const timeLoopCount = previousAiReplies.filter(r =>
      r.includes('thêm thời gian') || r.includes('cần đọc') || r.includes('đang xem')
    ).length;

    // ── Stage-specific instructions ────────────────────────────────────────
    const stagePrompt = buildStagePrompt(
      resolvedStage,
      informationScore,
      turnCount,
      previousAiReplies,
      { timeLoop: timeLoopCount },
    );

    // ── Persona ────────────────────────────────────────────────────────────
    const basePersona = getSystemPrompt(scenario as CustomerScenario);

    // ── Final prompt ───────────────────────────────────────────────────────
    let finalPrompt = '';

    if (mode === 'knowledge_check') {
      finalPrompt = `Bạn là AI Huấn luyện viên kiểm tra kiến thức bất động sản.
=== BỐI CẢNH ===
* Học viên (nhân viên sales) đang được kiểm tra kiến thức cơ bản về bất động sản, pháp lý, và kinh nghiệm tư vấn.
* Nhiệm vụ của bạn là đặt câu hỏi ngắn gọn, theo dõi câu trả lời, và hỏi tiếp (follow-up) để đánh giá độ sâu kiến thức.
* Bạn KHÔNG đóng vai khách hàng đi mua nhà. Bạn là người ra đề/chấm điểm.

=== SẢN PHẨM/CHỦ ĐỀ ===
- Tên chủ đề/dự án: ${productName}
- Nội dung: ${productDescription || 'Kiến thức bất động sản'}

=== LỊCH SỬ HỘI THOẠI ===
${formattedHistory || '(Mới bắt đầu)'}
${previousRepliesBlock}

=== CÂU HỌC VIÊN VỪA TRẢ LỜI ===
"${traineMessage.slice(-800)}"

=== QUY TẮC HUẤN LUYỆN ===
1. Nếu học viên trả lời đúng và có ví dụ: Hỏi sâu hơn hoặc chuyển sang chủ đề khác nâng cao hơn.
2. Nếu học viên trả lời đúng nhưng thiếu ví dụ: Yêu cầu lấy ví dụ thực tế.
3. Nếu học viên trả lời sai hoặc mơ hồ: Giải thích ngắn gọn chỗ sai và hỏi lại hoặc hỏi câu dễ hơn.
4. KHÔNG lặp lại y nguyên câu hỏi cũ.

=== CÁCH TÍNH ĐIỂM (scoreDelta) ===
* Trả lời xuất sắc, đủ ý, có ví dụ cụ thể: +5 đến +15
* Trả lời đúng nhóm ý nhưng thiếu chi tiết/ví dụ: +1 đến +4
* Trả lời sai khái niệm: -3 đến -8
* Trả lời quá ngắn hoặc né tránh: -5 đến -10

=== FEEDBACK (RẤT QUAN TRỌNG — PHẢI CHI TIẾT) ===
Feedback phải dài 2-4 câu tiếng Việt và có cấu trúc rõ ràng:
1. Câu 1: Nêu phần học viên trả lời ĐÚNG (nếu có). Ví dụ: "Bạn đã nêu đúng các nhóm hồ sơ pháp lý chính như chấp thuận đầu tư, quy hoạch."
2. Câu 2: Chỉ ra phần THIẾU hoặc SAI cụ thể. Ví dụ: "Tuy nhiên câu trả lời còn thiếu tên giấy tờ cụ thể trong từng nhóm."
3. Câu 3-4: Gợi ý CẢI THIỆN cụ thể. Ví dụ: "Với hồ sơ đất đai, nên nêu giấy chứng nhận quyền sử dụng đất, mục đích sử dụng đất, thời hạn sử dụng, tình trạng thế chấp."

KHÔNG được viết feedback chung chung như "cần cụ thể hơn" hay "liệt kê chi tiết hơn".
Feedback phải trích dẫn/đề cập trực tiếp nội dung học viên vừa trả lời.
Nếu học viên trả lời tốt, vẫn gợi ý cách làm câu trả lời sắc nét hơn.

=== QUY TẮC TRẢ LỜI ===
* customerReply (câu hỏi tiếp theo của AI) BẮT BUỘC CHỈ 1 CÂU, TỐI ĐA 25 TỪ.
* feedback PHẢI 2-4 CÂU chi tiết (khoảng 40-80 từ).
* Chỉ trả về JSON hợp lệ, không giải thích ngoài JSON.

Format:
{
"customerReply": "...",
"nextStage": "early|mid|closing",
"closingOutcome": null,
"isConversationComplete": false,
"scoreDelta": 0,
"feedback": "Câu 1 nêu điểm đúng. Câu 2 nêu điểm thiếu/sai. Câu 3-4 gợi ý cải thiện cụ thể."
}
`;
    } else {
      finalPrompt = `${basePersona}

=== BỐI CẢNH ===
Bạn là khách hàng giả lập trong bài training sales bất động sản.
* Nhân viên sales đang tư vấn dự án căn hộ.
* Nhiệm vụ của bạn là đóng vai khách hàng thật, hỏi tự nhiên, đánh giá năng lực tư vấn của nhân viên và đẩy cuộc hội thoại tiến triển.
* Mục tiêu không phải là hỏi vô hạn, mà là mô phỏng một khách hàng có nhu cầu thật: tìm hiểu → cân nhắc → yêu cầu thông tin cụ thể → tiến tới bước tiếp theo.

=== SẢN PHẨM ===
- Tên: ${productName}
- Mô tả: ${productDescription || 'Căn hộ cao cấp'}
- Giá niêm yết: ${productPrice || 'Liên hệ'}

=== LỊCH SỬ HỘI THOẠI ===
${formattedHistory || '(Mới bắt đầu)'}
${previousRepliesBlock}

=== CÂU NHÂN VIÊN VỪA NÓI ===
"${traineMessage.slice(-800)}"

${stagePrompt}

=== QUY TẮC CHỐNG HỎI LẶP ===
1. Không được hỏi lại y nguyên hoặc gần giống câu hỏi đã hỏi trong 2 lượt gần nhất.
2. Nếu nhân viên đã trả lời tương đối đủ, hãy chuyển sang chủ đề tiếp theo.
3. Nếu nhân viên chưa có con số chính xác nhưng đã:
   * đưa khoảng tham khảo,
   * giải thích lý do chưa thể cam kết,
   * hẹn gửi bảng cập nhật,
   * và hỏi lại nhu cầu cụ thể của khách,
     thì phải chấp nhận tạm thời và chuyển sang bước tiếp theo.
4. Chỉ hỏi lại cùng một vấn đề tối đa 1 lần nếu nhân viên né tránh hoàn toàn.
5. Không hỏi lan man quá sâu vào một chủ đề nếu thông tin đó không còn cần thiết cho quyết định mua/thuê.
6. Anti-loop bổ sung: Không dùng "Tôi cần thêm thời gian" / "Tôi đang xem" quá ${2 - timeLoopCount} lần nữa (đã dùng ${timeLoopCount} lần). Nếu dùng hết, BẮT BUỘC chốt (closingOutcome).

=== LUẬT CHUYỂN GIAI ĐOẠN ===
* early: khách mới hỏi thông tin chung như vị trí, tiện ích, tổng quan dự án.
* mid: khách hỏi sâu hơn về giá, pháp lý, khả năng cho thuê, vay ngân hàng, lãi suất, chính sách thanh toán.
* closing: khi cuộc hội thoại đã qua 6-8 lượt hoặc nhân viên đã trả lời được tối thiểu 4 nhóm thông tin gồm: vị trí, tiện ích, giá, pháp lý, vay vốn, đầu tư/cho thuê.

Không được giữ mãi ở mid nếu nhân viên đã cung cấp đủ thông tin cơ bản.

Ở giai đoạn closing, khách hàng nên hỏi một trong các hướng sau:
* Em gửi giúp tôi bảng giá và chính sách vay chi tiết được không?
* Có căn nào phù hợp với ngân sách của tôi không?
* Nếu tôi muốn giữ chỗ thì quy trình thế nào?
* Tôi có thể xem nhà hoặc xem sa bàn khi nào?
* Em tính giúp tôi phương án dòng tiền cụ thể được không?
* Nếu mua/thuê thì bước tiếp theo là gì?

=== CÁCH ĐÁNH GIÁ CÂU TRẢ LỜI CỦA NHÂN VIÊN ===
* Nếu nhân viên trả lời có số liệu cụ thể hoặc khoảng tham khảo hợp lý: cộng điểm (scoreDelta dương, từ +5 đến +15).
* Nếu nhân viên không có số chính xác nhưng xử lý chuyên nghiệp, hẹn gửi bảng cập nhật và hỏi nhu cầu cụ thể: cộng nhẹ (scoreDelta từ +1 đến +4).
* Nếu nhân viên né tránh, trả lời quá chung chung, không đưa hướng xử lý, hoặc trả lời sai trọng tâm: TRỪ ĐIỂM (scoreDelta âm, từ -10 đến -1).
* Nếu nhân viên có câu hỏi chốt như “anh/chị muốn xem căn 1PN hay 2PN”, “mình muốn vay 50% hay 70%”, “em gửi bảng giá cho mình nhé” thì phải xem đó là tín hiệu chuyển sang closing.

=== QUY TẮC TRẢ LỜI (RẤT QUAN TRỌNG) ===
* customerReply BẮT BUỘC CHỈ 1 CÂU, TỐI ĐA 25 TỪ.
* feedback PHẢI 2-4 CÂU (khoảng 30-60 từ): nêu rõ nhân viên làm tốt gì, thiếu gì, và nên cải thiện gì.
* Không hỏi quá 1 ý trong một lượt. Không hỏi lại câu cũ.
* Không tạo câu hỏi quá khó hoặc quá học thuật.
* Trả lời ngắn gọn, chân thực, tập trung vào trọng tâm như một khách hàng thật.

=== OUTPUT BẮT BUỘC ===
Chỉ trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.

Format:
{
"customerReply": "...",
"nextStage": "early|mid|closing",
"closingOutcome": null,
"isConversationComplete": false,
"scoreDelta": 0,
"feedback": "Câu 1 điểm tốt. Câu 2 điểm cần cải thiện. Câu 3 gợi ý cụ thể."
}
`;
    }

    // ── Gemini request ─────────────────────────────────────────────────────
    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 1536,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            customerReply: {
              type: 'STRING',
              description: 'Câu phản hồi tự nhiên của khách hàng hoặc câu hỏi tiếp theo của huấn luyện viên, tối đa 25 từ',
            },
            nextStage: {
              type: 'STRING',
              enum: ['early', 'mid', 'closing'],
              description: 'Giai đoạn tiếp theo của cuộc hội thoại',
            },
            closingOutcome: {
              type: 'STRING',
              enum: ['INTERESTED', 'FOLLOW_UP', 'NOT_INTERESTED'],
              nullable: true,
              description: 'Kết quả chốt — chỉ điền khi nextStage = "closing", null nếu chưa closing',
            },
            isConversationComplete: {
              type: 'BOOLEAN',
              description: 'true khi đang ở CLOSING và đã chốt kết quả',
            },
            scoreDelta: {
              type: 'INTEGER',
              description: 'Điểm thay đổi -10 đến +15 cho lượt này',
            },
            feedback: {
              type: 'STRING',
              description: 'Nhận xét chi tiết 2-4 câu tiếng Việt: nêu điểm đúng, điểm thiếu/sai, và gợi ý cải thiện cụ thể',
            },
          },
          required: ['customerReply', 'nextStage', 'closingOutcome', 'isConversationComplete', 'scoreDelta', 'feedback'],
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
      const errText = await geminiRes.text();
      console.error('[v0] Gemini error', geminiRes.status, errText);
      return NextResponse.json(
        buildFallbackResponse(traineMessage, resolvedStage, scenario, turnCount, sessionScore, informationScore, previousAiReplies, 'gemini_error'),
      );
    }

    const geminiData = await geminiRes.json();
    const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const finishReason: string = geminiData.candidates?.[0]?.finishReason ?? 'STOP';

    console.log('[v0] finishReason:', finishReason);
    console.log('[v0] Raw Gemini response:', rawText);

    if (finishReason === 'MAX_TOKENS') {
      console.warn('[v0] ⚠️ Response truncated — will attempt partial parse');
    }

    let responseSource = 'gemini';

    // ── Parse ──────────────────────────────────────────────────────────────
    const parsed = safeParseCustomerResponse(rawText);
    if (!parsed) {
      console.error('[v0] ❌ All parse layers failed');
      return NextResponse.json(
        buildFallbackResponse(traineMessage, resolvedStage, scenario, turnCount, sessionScore, informationScore, previousAiReplies, 'dynamic_fallback'),
      );
    }
    
    if ((parsed as any)._isPartial) {
      console.warn('[v0] ⚠️ Partial parse successful, using extracted customerReply');
      responseSource = 'gemini_partial';
    }
    console.log('[v0] ✅ Parsed OK:', JSON.stringify(parsed).substring(0, 300));

    // ── Anti-loop ──────────────────────────────────────────────────────────
    let customerReply = parsed.customerReply?.trim() || buildDynamicFallback(traineMessage, resolvedStage, previousAiReplies);
    const normPrev = previousAiReplies.map(normalizeText);
    if (parsed.customerReply && normPrev.includes(normalizeText(parsed.customerReply))) {
      console.warn('[v0] ⚠️ Loop detected from Gemini — using dynamic fallback');
      customerReply = buildDynamicFallback(traineMessage, resolvedStage, previousAiReplies);
      responseSource = 'dynamic_fallback';
    } else if (!parsed.customerReply) {
      responseSource = 'dynamic_fallback';
    }

    // ── Server-side stage override ────────────────────────────────────────
    // informationScore >= 80 → FORCE closing regardless of what Gemini says
    let effectiveStage: CustomerStage = resolvedStage;
    let closingOutcome = parsed.closingOutcome ?? null;
    let isConversationComplete = parsed.isConversationComplete ?? false;

    if (effectiveStage === 'closing') {
      isConversationComplete = true;
      // If Gemini didn't provide a closingOutcome, infer from score
      if (!closingOutcome) {
        const finalConviction = sessionScore + calculateConvictionDelta(traineMessage, scenario as CustomerScenario);
        closingOutcome = finalConviction >= 70 ? 'INTERESTED' : finalConviction >= 45 ? 'FOLLOW_UP' : 'NOT_INTERESTED';
      }
      customerReply = getClosingReply(closingOutcome, scenario as CustomerScenario);
      if (responseSource === 'gemini') responseSource = 'static_fallback';
    }

    // ── Score ──────────────────────────────────────────────────────────────
    const rawScore = typeof parsed.scoreDelta === 'number' ? parsed.scoreDelta : 0;
    const aiScore  = Math.min(100, Math.max(0, sessionScore + rawScore));
    const convictionDelta = calculateConvictionDelta(traineMessage, scenario as CustomerScenario);

    console.log('[v0] Final customerReply:', customerReply);
    console.log('[v0] effectiveStage:', effectiveStage, '| closingOutcome:', closingOutcome, '| complete:', isConversationComplete);
    console.log('[v0] responseSource:', responseSource);

    return NextResponse.json({
      customerReply,
      response: customerReply,
      responseSource,
      stage: effectiveStage,
      nextStage: parsed.nextStage ?? effectiveStage,
      closingOutcome,
      isConversationComplete,
      score: aiScore,
      scoreDelta: rawScore,
      informationScore,
      feedback: parsed.feedback ?? 'Hãy bắt đầu trả lời để nhận feedback chi tiết.',
      salesAnalysis: parsed.salesAnalysis ?? null,
      convictionDelta,
      outcome: closingOutcome,   // legacy alias
      metrics: {
        currentStage: effectiveStage,
        informationScore,
        turnCount,
        sessionScore,
      },
    });

  } catch (err) {
    console.error('[v0] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─── Fallback builder ─────────────────────────────────────────────────────────
function buildFallbackResponse(
  traineMessage: string,
  stage: CustomerStage,
  scenario: string,
  turnCount: number,
  sessionScore: number,
  informationScore: number,
  previousAiReplies: string[] = [],
  fallbackType: 'dynamic_fallback' | 'static_fallback' | 'gemini_error' = 'dynamic_fallback'
) {
  const customerReply = buildDynamicFallback(traineMessage, stage, previousAiReplies);
  const convictionDelta = calculateConvictionDelta(traineMessage, scenario as CustomerScenario);
  const isClosing = stage === 'closing';
  const closingOutcome: ClosingOutcome | null = isClosing
    ? (sessionScore >= 70 ? 'INTERESTED' : sessionScore >= 45 ? 'FOLLOW_UP' : 'NOT_INTERESTED')
    : null;

  return {
    customerReply: isClosing && closingOutcome ? getClosingReply(closingOutcome, scenario as CustomerScenario) : customerReply,
    response: customerReply,
    responseSource: fallbackType,
    stage,
    nextStage: stage,
    closingOutcome,
    isConversationComplete: isClosing,
    score: 50,
    scoreDelta: 0,
    informationScore,
    feedback: 'AI feedback đang tạm lỗi, nhưng hội thoại vẫn tiếp tục. Hãy tiếp tục trả lời để nhận đánh giá chi tiết ở lượt sau.',
    salesAnalysis: {
      understoodUserMessage: `Nhân viên nói: "${traineMessage.slice(0, 100)}..."`,
      missedOpportunity: 'Không phân tích sâu do thời gian xử lý nhanh.',
      nextBestAction: 'Tiếp tục cung cấp thêm thông tin chi tiết.',
    },
    convictionDelta,
    outcome: closingOutcome,
    metrics: { currentStage: stage, informationScore, turnCount, sessionScore },
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission: premium, admin, or manager
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role, plan, is_premium')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    const canCreate =
      profile.role === 'admin' ||
      profile.role === 'manager' ||
      profile.is_premium === true;

    if (!canCreate) {
      return NextResponse.json({ error: 'Premium required' }, { status: 403 });
    }

    const body = await request.json();
    const { lessonType, topic, goal, audience, description } = body;

    if (!lessonType || !topic) {
      return NextResponse.json({ error: 'Missing required fields: lessonType, topic' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Build prompt based on lesson type
    const prompt = lessonType === 'knowledge_check'
      ? buildKnowledgeCheckPrompt(topic, goal, audience, description)
      : buildSalesSimulationPrompt(topic, goal, audience, description);

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[generate-ai-config] Gemini error:', errText);
      return NextResponse.json({ error: 'Gemini API error' }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error('[generate-ai-config] Failed to parse Gemini JSON:', rawText.substring(0, 500));
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
    }

    return NextResponse.json({
      title: parsed.title || topic,
      content: parsed.content || `Bài học về ${topic}`,
      simulator_config: parsed.simulator_config || parsed,
    });
  } catch (error) {
    console.error('[generate-ai-config] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Prompt Builders ─────────────────────────────────────────────────────────

function buildKnowledgeCheckPrompt(
  topic: string,
  goal?: string,
  audience?: string,
  description?: string,
): string {
  return `Bạn là chuyên gia tạo bài kiểm tra kiến thức AI cho nền tảng đào tạo.

Hãy tạo cấu hình simulator_config cho bài kiểm tra kiến thức với thông tin sau:
- Chủ đề: ${topic}
- Mục tiêu: ${goal || 'Kiểm tra và củng cố kiến thức'}
- Đối tượng: ${audience || 'Nhân viên sales'}
- Mô tả thêm: ${description || 'Không có'}

Trả JSON theo đúng cấu trúc sau (KHÔNG thêm bất kỳ text nào ngoài JSON):
{
  "title": "Tiêu đề bài học ngắn gọn",
  "content": "Mô tả nội dung bài học (2-3 câu)",
  "simulator_config": {
    "mode": "knowledge_check",
    "projectName": "Tên chủ đề kiểm tra",
    "salesPitch": "AI kiểm tra kiến thức",
    "productType": "Đào tạo kiến thức",
    "description": "Mô tả chi tiết nội dung kiểm tra",
    "customerPersona": "AI huấn luyện viên kiểm tra kiến thức của học viên",
    "openingCustomerMessage": "Câu mở đầu của AI huấn luyện viên",
    "goal": "Mục tiêu bài kiểm tra",
    "questionTopics": ["Chủ đề câu hỏi 1", "Chủ đề câu hỏi 2", "Chủ đề câu hỏi 3"],
    "commonQuestions": ["Câu hỏi cụ thể 1?", "Câu hỏi cụ thể 2?", "Câu hỏi cụ thể 3?"],
    "keyFeatures": ["Kiến thức trọng tâm 1", "Kiến thức trọng tâm 2"],
    "salesTips": ["Gợi ý trả lời 1", "Gợi ý trả lời 2"],
    "scoringCriteria": {
      "good": "Trả lời chính xác, có ví dụ thực tế",
      "average": "Trả lời đúng nhưng chưa đủ chi tiết",
      "bad": "Trả lời sai hoặc không rõ ràng"
    },
    "feedbackRules": {
      "positive": "Khen ngợi và hỏi câu sâu hơn",
      "needMoreDetail": "Yêu cầu giải thích thêm",
      "correctMistake": "Chỉ ra sai sót và giải thích đúng"
    },
    "stageRules": {
      "early": "Câu hỏi cơ bản",
      "mid": "Câu hỏi chuyên sâu",
      "closing": "Tình huống ứng dụng",
      "complete": "Tổng kết"
    }
  }
}`;
}

function buildSalesSimulationPrompt(
  topic: string,
  goal?: string,
  audience?: string,
  description?: string,
): string {
  return `Bạn là chuyên gia tạo bài mô phỏng bán hàng AI cho nền tảng đào tạo sales.

Hãy tạo cấu hình simulator_config cho bài mô phỏng sales với thông tin sau:
- Sản phẩm/dự án: ${topic}
- Mục tiêu sales: ${goal || 'Thuyết phục khách hàng quan tâm và chốt bước tiếp theo'}
- Đối tượng học: ${audience || 'Nhân viên sales'}
- Mô tả thêm: ${description || 'Không có'}

Trả JSON theo đúng cấu trúc sau (KHÔNG thêm bất kỳ text nào ngoài JSON):
{
  "title": "Tiêu đề bài học ngắn gọn",
  "content": "Mô tả nội dung bài mô phỏng (2-3 câu)",
  "simulator_config": {
    "mode": "sales_simulation",
    "projectName": "Tên dự án/sản phẩm",
    "salesPitch": "Pitch ngắn gọn về sản phẩm",
    "productType": "Loại sản phẩm",
    "location": "Vị trí (nếu có)",
    "priceInfo": "Thông tin giá tham khảo",
    "description": "Mô tả chi tiết sản phẩm/dự án",
    "customerPersona": "Mô tả chân dung khách hàng AI",
    "openingCustomerMessage": "Câu mở đầu của khách hàng AI",
    "goal": "Mục tiêu sales cần đạt",
    "keyFeatures": ["Đặc điểm nổi bật 1", "Đặc điểm nổi bật 2", "Đặc điểm nổi bật 3"],
    "commonObjections": ["Phản đối thường gặp 1", "Phản đối thường gặp 2"],
    "salesTips": ["Mẹo bán hàng 1", "Mẹo bán hàng 2"],
    "scoringCriteria": {
      "good": "Trả lời thuyết phục, xử lý phản đối tốt",
      "average": "Trả lời đúng nhưng chưa thuyết phục",
      "bad": "Không xử lý được phản đối, mất khách"
    },
    "feedbackRules": {
      "positive": "Khen ngợi kỹ năng xử lý",
      "needMoreDetail": "Cần cung cấp thêm thông tin cụ thể",
      "moveToClosing": "Nên chuyển sang bước chốt"
    },
    "stageRules": {
      "early": "Khách hỏi thông tin tổng quan",
      "mid": "Khách hỏi sâu về giá, pháp lý, đầu tư",
      "closing": "Khách hỏi bước tiếp theo",
      "complete": "Kết thúc"
    }
  }
}`;
}

import { SalesScenario, CustomerScenario, SalesMetrics, CustomerStage, SaleOutcome } from './types';

// ============================================================================
// KỊCH BẢN BÁN HÀNG BẤT ĐỘNG SẢN VIỆT NAM
// ============================================================================

export const SALES_SCENARIOS: Record<CustomerScenario, SalesScenario> = {
  skeptical: {
    id: 'skeptical-scenario',
    name: 'Khách hàng khó tính',
    type: 'skeptical',
    productName: 'Căn hộ cao cấp',
    productDescription:
      'Dự án căn hộ cao cấp tại Việt Nam với đầy đủ tiện ích nội khu, pháp lý rõ ràng, vị trí đắc địa và tiềm năng tăng giá cao.',
    customerPersonality:
      'Khó tính, hay đặt câu hỏi khó, lo ngại về pháp lý và rủi ro thị trường, đòi hỏi bằng chứng cụ thể, so sánh nhiều dự án',
    initialObjection:
      'Thị trường bất động sản đang bất ổn, giá thì cao mà pháp lý nhiều dự án có vấn đề. Tại sao tôi nên tin tưởng dự án này?',
    winConditions: [
      'Giải đáp được lo ngại về pháp lý (sổ đỏ, giấy phép xây dựng)',
      'Chứng minh được tiềm năng tăng giá và lợi nhuận đầu tư',
      'So sánh được ưu thế với các dự án cạnh tranh trong khu vực',
      'Đưa ra chính sách bán hàng hấp dẫn (chiết khấu, hỗ trợ vay)',
    ],
  },
  warm_lead: {
    id: 'warm-scenario',
    name: 'Người mua nhà lần đầu',
    type: 'warm_lead',
    productName: 'Căn hộ cao cấp',
    productDescription:
      'Dự án căn hộ cao cấp tại Việt Nam phù hợp cho gia đình trẻ, gần trường học, bệnh viện, công viên, với chính sách thanh toán linh hoạt.',
    customerPersonality:
      'Cởi mở, hào hứng nhưng lo lắng vì lần đầu mua nhà, cần hướng dẫn cụ thể về quy trình và tài chính',
    initialObjection:
      'Tôi rất quan tâm đến dự án nhưng đây là lần đầu tiên mua nhà. Anh/chị có thể tư vấn giúp tôi từ đầu không?',
    winConditions: [
      'Hướng dẫn rõ ràng quy trình mua nhà và thủ tục pháp lý',
      'Giới thiệu tiện ích phù hợp gia đình trẻ (trường học, bệnh viện, công viên)',
      'Tư vấn phương thức thanh toán và hỗ trợ vay ngân hàng',
      'Tạo cảm giác an tâm về chất lượng xây dựng và uy tín chủ đầu tư',
    ],
  },
  random: {
    id: 'random-scenario',
    name: 'Nhà đầu tư bất động sản',
    type: 'random',
    productName: 'Căn hộ cao cấp',
    productDescription:
      'Dự án căn hộ cao cấp tại Việt Nam với tiềm năng sinh lời cao, thanh khoản tốt, phù hợp cho nhà đầu tư dài hạn.',
    customerPersonality:
      'Nhà đầu tư có kinh nghiệm, tính toán ROI kỹ lưỡng, so sánh với kênh đầu tư khác, thái độ thay đổi theo chất lượng tư vấn',
    initialObjection:
      'Tôi đang cân nhắc giữa bất động sản, vàng và chứng khoán. Thuyết phục tôi tại sao nên chọn dự án này?',
    winConditions: [
      'Phân tích được tiềm năng tăng giá và lợi nhuận cho thuê',
      'So sánh thuyết phục với kênh đầu tư khác (vàng, chứng khoán, tiết kiệm)',
      'Đưa ra số liệu cụ thể về thanh khoản và tỷ suất lợi nhuận',
      'Trình bày chiến lược đầu tư phù hợp với thị trường hiện tại',
    ],
  },
};

// ============================================================================
// PROMPT HỆ THỐNG CHO AI KHÁCH HÀNG (TIẾNG VIỆT)
// ============================================================================

export const SYSTEM_PROMPTS = {
  skeptical: `Bạn là một khách hàng khó tính đang xem xét mua bất động sản. Đặc điểm của bạn:
  - Bạn lo ngại về pháp lý dự án: sổ đỏ đã có chưa, giấy phép xây dựng thế nào, chủ đầu tư có uy tín không
  - Bạn cho rằng giá bất động sản đang quá cao so với giá trị thực
  - Bạn lo ngại về rủi ro thị trường: bong bóng bất động sản, thanh khoản kém, chậm bàn giao
  - Bạn đòi hỏi bằng chứng cụ thể, số liệu rõ ràng, không chấp nhận lời hứa suông
  - Bạn so sánh với nhiều dự án khác trong khu vực và hỏi về tiến độ bàn giao thực tế

  Giữ thái độ hoài nghi trong suốt cuộc trò chuyện. Hỏi câu hỏi sắc bén khi nhân viên bán hàng đưa ra tuyên bố.
  Phản bác lại những phát biểu chung chung. Hỏi về pháp lý, giá cả, so sánh với dự án khác, và uy tín chủ đầu tư.
  Chỉ dịu đi nếu nhân viên bán hàng đưa ra câu trả lời thực sự thuyết phục với bằng chứng cụ thể.`,

  warm_lead: `Bạn là người mua nhà lần đầu, thuộc gia đình trẻ có con nhỏ. Đặc điểm của bạn:
  - Bạn quan tâm đến tiện ích xung quanh: trường học, bệnh viện, công viên, siêu thị
  - Bạn lo lắng về an ninh khu vực và chất lượng xây dựng
  - Bạn cần hướng dẫn cụ thể về quy trình mua nhà, thủ tục pháp lý
  - Bạn quan tâm đến phương thức thanh toán, hỗ trợ vay ngân hàng, lãi suất
  - Bạn cởi mở và sẵn sàng lắng nghe, nhưng cần được tư vấn tận tình

  Thể hiện sự quan tâm thật sự đến dự án. Hỏi các câu hỏi thực tế như "Trường học gần nhất cách bao xa?",
  "Quy trình mua nhà gồm những bước nào?", "Ngân hàng nào hỗ trợ vay?".
  Bày tỏ sự hào hứng nếu nhân viên bán hàng tư vấn tốt và giải đáp được thắc mắc của bạn.`,

  random: `Bạn là nhà đầu tư bất động sản có kinh nghiệm. Đặc điểm của bạn:
  - Bạn quan tâm đến lợi nhuận đầu tư, tỷ suất sinh lời, và tiềm năng tăng giá
  - Bạn so sánh bất động sản với các kênh đầu tư khác: vàng, chứng khoán, gửi tiết kiệm
  - Bạn phân tích thanh khoản, khả năng cho thuê, và dòng tiền
  - Bạn đánh giá vị trí, hạ tầng giao thông, quy hoạch tương lai
  - Thái độ của bạn thay đổi theo chất lượng tư vấn: tích cực nếu tư vấn tốt, tiêu cực nếu tư vấn kém

  Bắt đầu với thái độ trung lập, để cuộc hội thoại diễn ra tự nhiên. Phản ứng chân thực với những gì nhân viên bán hàng nói.
  Nếu họ đưa ra câu trả lời chung chung hoặc thiếu số liệu, hãy tỏ ra hoài nghi.
  Nếu họ cung cấp phân tích chi tiết với số liệu cụ thể, hãy thể hiện sự quan tâm.`,
};

// ============================================================================
// HÀM LẤY PROMPT HỆ THỐNG
// ============================================================================

export function getSystemPrompt(scenario: CustomerScenario): string {
  return SYSTEM_PROMPTS[scenario];
}

// ============================================================================
// KHỞI TẠO CHỈ SỐ BÁN HÀNG
// ============================================================================

export function initializeMetrics(): SalesMetrics {
  return {
    convictionRate: 30,
    pitchQuality: 0,
    engagementScore: 0,
    turnsToClose: 0,
    keyObjectionsHandled: 0,
  };
}

// ============================================================================
// TÍNH TỶ LỆ THUYẾT PHỤC KHÁCH HÀNG
// ============================================================================

export function calculateConvictionRate(messages: number, scenario: CustomerScenario): number {
  // Tỷ lệ thuyết phục tăng dần theo số lượt hội thoại có ý nghĩa
  const baseRate = scenario === 'warm_lead' ? 40 : scenario === 'skeptical' ? 20 : 30;
  const increasePerMessage = scenario === 'warm_lead' ? 8 : scenario === 'skeptical' ? 4 : 6;
  return Math.min(100, baseRate + messages * increasePerMessage);
}

// ============================================================================
// ĐÁNH GIÁ CHẤT LƯỢNG TƯ VẤN BẤT ĐỘNG SẢN
// ============================================================================

export function calculatePitchQuality(content: string): number {
  // Đánh giá chất lượng tư vấn dựa trên từ khóa bất động sản Việt Nam
  let score = 0;
  const lowerContent = content.toLowerCase();

  if (content.length > 50) score += 10; // Câu trả lời có nội dung đầy đủ
  if (lowerContent.includes('vị trí') || lowerContent.includes('vi tri')) score += 10; // Đề cập vị trí dự án
  if (lowerContent.includes('pháp lý') || lowerContent.includes('phap ly')) score += 10; // Đề cập pháp lý
  if (lowerContent.includes('tiện ích') || lowerContent.includes('tien ich')) score += 10; // Đề cập tiện ích
  if (lowerContent.includes('giá') || lowerContent.includes('gia')) score += 10; // Đề cập giá cả
  if (lowerContent.includes('thanh toán') || lowerContent.includes('thanh toan')) score += 10; // Phương thức thanh toán
  if (lowerContent.includes('sổ đỏ') || lowerContent.includes('so do')) score += 10; // Giấy tờ pháp lý
  if (lowerContent.includes('chủ đầu tư') || lowerContent.includes('chu dau tu')) score += 10; // Uy tín chủ đầu tư
  if (lowerContent.includes('bàn giao') || lowerContent.includes('ban giao')) score += 5; // Tiến độ bàn giao
  if (lowerContent.includes('vay ngân hàng') || lowerContent.includes('vay ngan hang')) score += 10; // Hỗ trợ vay
  if (lowerContent.includes('lợi nhuận') || lowerContent.includes('loi nhuan')) score += 5; // Lợi nhuận đầu tư

  return Math.min(100, score);
}

// ============================================================================
// ĐÁNH GIÁ CHẤT LƯỢNG HỘI THOẠI
// ============================================================================

export function evaluateConversationQuality(turnCount: number, objectionsHandled: number): number {
  // Điểm tương tác dựa trên tiến trình hội thoại
  if (turnCount < 3) return 20;
  if (turnCount < 5) return 40;
  if (turnCount < 8) return 60 + objectionsHandled * 5;
  return Math.min(100, 80 + objectionsHandled * 3);
}

// ============================================================================
// XÁC ĐỊNH GIAI ĐOẠN KHÁCH HÀNG
// ============================================================================

/**
 * Xác định giai đoạn hiện tại của khách hàng dựa trên số lượt hội thoại và điểm phiên
 */
export function determineCustomerStage(
  turnCount: number,
  sessionScore: number,
  scenario: CustomerScenario
): CustomerStage {
  // Giai đoạn đầu: 1-2 lượt đầu tiên
  if (turnCount <= 2) {
    return 'early';
  }

  // Giai đoạn giữa: lượt 3-4, hoặc đang thu thập thông tin
  if (turnCount <= 4) {
    return 'mid';
  }

  // Giai đoạn chốt: lượt 5 trở đi, nếu điểm đủ cao cho kịch bản này
  if (turnCount >= 5) {
    const closingThreshold = scenario === 'skeptical' ? 65 : 60;
    if (sessionScore >= closingThreshold) {
      return 'closing';
    }
  }

  // Mặc định quay về giai đoạn giữa nếu chưa đạt điều kiện
  return 'mid';
}

// ============================================================================
// XÁC ĐỊNH KẾT QUẢ BÁN HÀNG
// ============================================================================

/**
 * Xác định kết quả bán hàng dựa trên điểm số cuối cùng
 */
export function determineSaleOutcome(
  finalSessionScore: number,
  turnCount: number,
  scenario: CustomerScenario
): SaleOutcome {
  // Cần ít nhất 6 lượt hội thoại để đạt giai đoạn chốt
  if (turnCount < 6) {
    return null;
  }

  const buyThreshold = scenario === 'skeptical' ? 75 : scenario === 'warm_lead' ? 70 : 72;
  const rejectThreshold = 40;

  if (finalSessionScore >= buyThreshold) {
    return 'buy';
  }

  if (finalSessionScore <= rejectThreshold) {
    return 'reject';
  }

  return 'need_more_info';
}

// ============================================================================
// HƯỚNG DẪN THEO GIAI ĐOẠN (BẤT ĐỘNG SẢN VIỆT NAM)
// ============================================================================

/**
 * Lấy hướng dẫn hệ thống theo từng giai đoạn hội thoại
 */
export function getStageSpecificInstruction(stage: CustomerStage): string {
  const instructions = {
    early: `Giai đoạn Đầu — Bạn đang làm quen với dự án.
Hành vi: Tò mò nhẹ, chưa biết nhiều về dự án. Phản hồi theo đúng những gì học viên vừa nói rồi hỏi thêm thông tin cơ bản nếu phù hợp.
Nếu học viên chưa giới thiệu gì → hỏi câu khái quát như vị trí, loại hình.
Nếu học viên đã giới thiệu → phản hồi về điều đó trước, rồi có thể hỏi thêm một điểm liên quan.`,

    mid: `Giai đoạn Giữa — Bạn đã biết cơ bản, muốn hiểu sâu hơn.
Hành vi: Quan tâm nhưng thận trọng. Luôn phản hồi đúng nội dung học viên vừa nói trước.
Nếu học viên đề cập vị trí → hỏi thêm về pháp lý hoặc tiện ích.
Nếu học viên đề cập pháp lý → hỏi về tiến độ bàn giao hoặc so sánh với dự án khác.
Nếu học viên đề cập tiện ích → hỏi về phương thức thanh toán hoặc giá.`,

    closing: `Giai đoạn Chốt — Bạn gần bị thuyết phục, đang cân nhắc mua.
Hành vi: Tập trung vào yếu tố quyết định cuối. Phản hồi theo đúng những gì học viên nói, sau đó hỏi về giá chiết khấu, hỗ trợ vay, hoặc thời gian bàn giao nếu chưa được đề cập.`,

    closed: `Giai đoạn Kết Thúc — Cuộc hội thoại sắp kết thúc.
Hành vi: Phản hồi ngắn gọn theo nội dung học viên nói, rồi đưa ra quyết định cuối: mua / cần thêm thông tin / từ chối — tùy thuộc chất lượng tư vấn.`,
  };

  return instructions[stage];
}

// ============================================================================
// CÂU TRẢ LỜI DỰ PHÒNG THEO GIAI ĐOẠN (BẤT ĐỘNG SẢN VIỆT NAM)
// ============================================================================

/**
 * Lấy câu trả lời dự phòng phù hợp với từng giai đoạn
 */
export function getFallbackResponseForStage(stage: CustomerStage): string {
  const fallbacks = {
    early:
      'Dự án này ở vị trí nào vậy? Anh/chị có thể giới thiệu tổng quan cho tôi không?',
    mid: 'Nghe cũng hay, nhưng pháp lý dự án thế nào? Đã có sổ đỏ chưa?',
    closing:
      'Giá cuối cùng là bao nhiêu? Có hỗ trợ vay ngân hàng không?',
    closed: 'Cảm ơn anh/chị đã tư vấn. Tôi sẽ cân nhắc và liên hệ lại.',
  };

  return fallbacks[stage];
}

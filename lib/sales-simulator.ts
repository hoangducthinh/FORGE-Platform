import { SalesScenario, CustomerScenario, SalesMetrics, CustomerStage, SaleOutcome } from './types';

export const SALES_SCENARIOS: Record<CustomerScenario, SalesScenario> = {
  skeptical: {
    id: 'skeptical-scenario',
    name: 'Skeptical Customer',
    type: 'skeptical',
    productName: 'CloudSync Pro',
    productDescription:
      'A cloud-based project management and collaboration platform that helps teams work more efficiently',
    customerPersonality:
      'Skeptical, asks tough questions, needs proof of ROI, concerned about data security',
    initialObjection:
      "We're already using another tool and it's working fine. Why would we switch?",
    winConditions: [
      'Addressed data security concerns',
      'Demonstrated clear ROI or time savings',
      'Provided comparison with competitors',
      'Offered trial or money-back guarantee',
    ],
  },
  warm_lead: {
    id: 'warm-scenario',
    name: 'Warm Lead',
    type: 'warm_lead',
    productName: 'CloudSync Pro',
    productDescription:
      'A cloud-based project management and collaboration platform that helps teams work more efficiently',
    customerPersonality:
      'Interested, asked for a demo, looking to improve team productivity, open-minded',
    initialObjection: "I'm interested, but I'd like to understand how this compares to what we're using",
    winConditions: [
      'Explained key differentiators',
      'Provided use case examples',
      'Offered implementation support',
      'Scheduled a follow-up demo',
    ],
  },
  random: {
    id: 'random-scenario',
    name: 'Random Scenario',
    type: 'random',
    productName: 'CloudSync Pro',
    productDescription:
      'A cloud-based project management and collaboration platform that helps teams work more efficiently',
    customerPersonality:
      'Mixed personality - could be skeptical, warm, or neutral depending on conversation flow',
    initialObjection: 'Tell me, why should I care about this product?',
    winConditions: [
      'Built rapport with customer',
      'Understood customer needs',
      'Articulated clear value proposition',
      'Addressed at least one concern',
    ],
  },
};

export const SYSTEM_PROMPTS = {
  skeptical: `You are a skeptical B2B customer evaluating CloudSync Pro, a project management platform. 
  Your characteristics:
  - You ask tough questions and need proof
  - You're concerned about data security and integration with existing tools
  - You want to see clear ROI and concrete examples
  - You're suspicious of sales pitches and marketing claims
  - You require specific metrics and evidence before committing
  
  Maintain this skeptical attitude throughout the conversation. Ask clarifying questions when the trainee makes claims.
  Push back on vague statements. Ask about pricing, security certifications, integration capabilities, and implementation timeline.
  Only soften your stance if the trainee provides genuinely convincing answers.`,

  warm_lead: `You are a warm lead considering CloudSync Pro for your team. Your characteristics:
  - You've already asked for a demo, so you're generally interested
  - You want to improve team productivity and collaboration
  - You're open-minded and willing to listen to the pitch
  - You'll ask practical questions about implementation and support
  - You respond well to specific use cases and examples
  
  Show genuine interest in the product. Ask practical questions like "How long does implementation take?" 
  and "What kind of support do you offer?" Give the trainee a chance to convince you with real answers.
  Express excitement if they address your needs well.`,

  random: `You are a potential customer with mixed sentiments about CloudSync Pro. Your characteristics:
  - Your initial reaction is neutral/curious ("Why should I care?")
  - Your attitude will shift based on how well the trainee engages with you
  - You respond to clear explanations and real-world examples
  - You'll become more skeptical if the trainee is pushy or vague
  - You'll warm up if they demonstrate genuine understanding of customer needs
  
  Start cautiously and let the conversation flow naturally. React authentically to what the trainee says.
  If they give vague or generic responses, express skepticism. If they provide thoughtful, specific answers, show interest.`,
};

export function getSystemPrompt(scenario: CustomerScenario): string {
  const basePrompt = SYSTEM_PROMPTS[scenario];
  return `${basePrompt}

You are role-playing as a customer in a sales training simulation. Respond naturally and authentically as this customer would.
Keep your responses concise (1-3 sentences) to simulate real conversation. Ask follow-up questions to understand the product better.
Be prepared to state objections, ask for proof, request demos, or ask about implementation details depending on the scenario.`;
}

export function initializeMetrics(): SalesMetrics {
  return {
    convictionRate: 30,
    pitchQuality: 0,
    engagementScore: 0,
    turnsToClose: 0,
    keyObjectionsHandled: 0,
  };
}

export function calculateConvictionRate(messages: number, scenario: CustomerScenario): number {
  // Conviction rate increases with meaningful conversation
  const baseRate = scenario === 'warm_lead' ? 40 : scenario === 'skeptical' ? 20 : 30;
  const increasePerMessage = scenario === 'warm_lead' ? 8 : scenario === 'skeptical' ? 4 : 6;
  return Math.min(100, baseRate + messages * increasePerMessage);
}

export function calculatePitchQuality(content: string): number {
  // Simple heuristic for pitch quality based on content length and structure
  let score = 0;

  if (content.length > 50) score += 20; // Substantive response
  if (content.includes('feature') || content.includes('benefit')) score += 15; // Feature/benefit focus
  if (content.includes('customer') || content.includes('team')) score += 15; // Customer-focused
  if (content.includes('time') || content.includes('cost') || content.includes('ROI')) score += 20; // Business value
  if (content.includes('example') || content.includes('case')) score += 15; // Concrete examples
  if (content.includes('question')) score += 15; // Asks about needs

  return Math.min(100, score);
}

export function evaluateConversationQuality(turnCount: number, objectionsHandled: number): number {
  // Engagement score based on conversation progression
  if (turnCount < 3) return 20;
  if (turnCount < 5) return 40;
  if (turnCount < 8) return 60 + objectionsHandled * 5;
  return Math.min(100, 80 + objectionsHandled * 3);
}

/**
 * Determine current customer stage based on turn count and session score
 */
export function determineCustomerStage(
  turnCount: number,
  sessionScore: number,
  scenario: CustomerScenario
): CustomerStage {
  // Early: first 1-2 turns
  if (turnCount <= 2) {
    return 'early';
  }

  // Mid: turns 3-4, or still gathering information
  if (turnCount <= 4) {
    return 'mid';
  }

  // Closing: turn 5+, and if score is good enough for this scenario
  if (turnCount >= 5) {
    const closingThreshold = scenario === 'skeptical' ? 65 : 60;
    if (sessionScore >= closingThreshold) {
      return 'closing';
    }
  }

  // Default to mid if conditions not met
  return 'mid';
}

/**
 * Determine sale outcome based on final metrics
 */
export function determineSaleOutcome(
  finalSessionScore: number,
  turnCount: number,
  scenario: CustomerScenario
): SaleOutcome {
  // Must have at least 6 turns to reach closing
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

/**
 * Get stage-specific system prompt instruction
 */
export function getStageSpecificInstruction(stage: CustomerStage): string {
  const instructions = {
    early: `STAGE: EARLY
You are just starting to evaluate the product. Ask high-level questions to understand what it is and who it's for.
Your questions should be general like: "What does this product do?", "Who is it designed for?", "How is it different from other solutions?"
Show mild skepticism or curiosity. Keep it simple and natural.`,

    mid: `STAGE: MID
You've learned the basics. Now ask deeper questions about features, benefits, real-world applications, and value proposition.
Your questions should be specific like: "How does it specifically solve our problem?", "What are the key features?", "Can you give me an example?", "What makes it different?"
Show genuine interest but remain somewhat cautious. Ask for proof or examples.`,

    closing: `STAGE: CLOSING
You're almost convinced. Now focus only on final decision factors like price, implementation timeline, support, warranty, or ROI.
Your questions should be about purchase-related topics like: "What's the pricing?", "How long to implement?", "What support do you offer?", "Do you have a guarantee?"
Show that you're seriously considering buying. The conversation is winding down - this is your last chance to ask crucial questions before deciding.`,

    closed: `STAGE: CLOSED
The conversation is ending. Based on the trainee's answers to your closing questions, make a final decision.
You must choose ONE outcome:
- BUY if they answered your closing questions well and demonstrated clear value
- NEED_MORE_INFO if they were good but you're still not 100% sure
- REJECT if they failed to convince you or gave unsatisfactory answers

Be direct and clear about your decision. No more questions. State your final verdict.`,
  };

  return instructions[stage];
}

/**
 * Get stage-appropriate fallback response
 */
export function getFallbackResponseForStage(stage: CustomerStage): string {
  const fallbacks = {
    early:
      'Nghe có vẻ thú vị đấy. Bạn có thể nói cho tôi biết sản phẩm này là gì và dùng để làm gì không?',
    mid: 'Nghe cũng khá ổn. Nhưng bạn có thể giải thích rõ hơn về cách nó hoạt động và mang lại lợi ích gì cho chúng tôi không?',
    closing:
      'Được, tôi sẽ cân nhắc. Nhưng trước khi quyết định, bạn có thể cho tôi biết giá bao nhiêu và chính sách bảo hành như thế nào không?',
    closed: 'Cảm ơn bạn đã giới thiệu. Tôi sẽ cân nhắc kỹ lưỡng và quay lại với bạn.',
  };

  return fallbacks[stage];
}

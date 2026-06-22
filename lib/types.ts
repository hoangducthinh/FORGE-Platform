// User types
export type UserRole = 'student' | 'manager' | 'admin';
export type UserPlan = 'free' | 'team' | 'enterprise';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  plan: UserPlan;
  is_premium: boolean;
  premium_until: Date | string | null;
  subscription_status: 'active' | 'trialing' | 'expired' | 'cancelled' | null;
  subscription_started_at: Date | string | null;
  subscription_ends_at: Date | string | null;
  organization_id: string | null;
  seat_limit: number;
  seats_used: number;
  created_at: Date | string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Course types
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  level: string;
  category: string;
  is_published: boolean;
  visibility: 'public' | 'private' | 'unlisted';
  allow_self_enroll: boolean;
  invite_code: string | null;
  created_by: string;
  created_at: string;
}

export interface CourseMember {
  id: string;
  course_id: string;
  user_id: string;
  member_role: 'student' | 'instructor' | 'manager';
  added_by: string | null;
  joined_at: string;
  profile?: Profile;
}

export interface CourseInvitation {
  id: string;
  course_id: string;
  email: string;
  invited_user_id: string | null;
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'revoked';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  createdAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  videoUrl?: string;
  resources?: Record<string, string>[];
  order: number;
  createdAt: Date;
}

// Progress types
export type ProgressStatus = 'in_progress' | 'completed' | 'failed';

export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  enrollmentDate: Date;
  progressPercentage: number;
  status: ProgressStatus;
  lastAccessed: Date;
}

export interface LessonCompletion {
  id: string;
  userId: string;
  lessonId: string;
  completedAt: Date;
  timeSpentMinutes: number;
}

// AI types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  courseId?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Moderation types
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ModerationReport {
  id: string;
  reportedById: string;
  reportType: string;
  content: string;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Sales Simulator types
export type CustomerScenario = 'skeptical' | 'warm_lead' | 'random';
export type CustomerStage = 'early' | 'mid' | 'closing' | 'closed';
export type SaleOutcome = 'buy' | 'need_more_info' | 'reject' | null;

export interface ConversationMessage {
  id: string;
  role: 'trainee' | 'customer';
  content: string;
  transcription?: string;
  audioUrl?: string;
  timestamp: Date;
}

export interface TurnScore {
  turnNumber: number;
  score: number;
  feedback: string;
}

export interface SalesSession {
  id: string;
  userId: string;
  lessonId: string;
  scenario: CustomerScenario;
  messages: ConversationMessage[];
  metrics: SalesMetrics;
  turnScores: TurnScore[];
  finalSessionScore?: number;
  currentStage: CustomerStage;
  saleOutcome: SaleOutcome;
  isConversationComplete: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface SalesMetrics {
  convictionRate: number; // 0-100: how convinced the customer is
  pitchQuality: number; // 0-100: quality of the pitch
  engagementScore: number; // 0-100: overall engagement
  turnsToClose: number; // number of back-and-forth turns before closing
  keyObjectionsHandled: number; // how many objections successfully addressed
  turnScore?: number; // Current turn score
  finalSessionScore?: number; // Session average score
  stage?: CustomerStage;
  outcome?: SaleOutcome;
}

export interface SalesScenario {
  id: string;
  name: string;
  type: CustomerScenario;
  productName: string;
  productDescription: string;
  customerPersonality: string;
  initialObjection?: string;
  winConditions: string[];
}

// ─── Simulator Config Types ───────────────────────────────────────────────────
export type SimulatorMode = 'knowledge_check' | 'sales_simulation';

export interface BaseSimulatorConfig {
  mode: SimulatorMode;
}

export interface KnowledgeCheckConfig extends BaseSimulatorConfig {
  mode: 'knowledge_check';
  sessionSettings: {
    estimatedMinutes: number;
    minQuestions: number;
    maxQuestions: number;
    maxFollowUpsPerQuestion: number;
    passingScore: number;
  };
  questionDistribution: {
    basic: number;
    understanding: number;
    application: number;
    summary: number;
  };
}

export interface SalesSimulationConfig extends BaseSimulatorConfig {
  mode: 'sales_simulation';
  sessionSettings: {
    estimatedMinutes: number;
    minTurns: number;
    maxTurns: number;
    maxFollowUpsPerTopic: number;
    maxRepeatedQuestion: number;
    autoCompleteScore: number;
  };
  stageTurnTargets: {
    early: number;
    mid: number;
    closing: number;
    complete: number;
  };
  questionStrategy: {
    basicQuestions: number;
    deepQuestions: number;
    objections: number;
    closingQuestions: number;
  };
}

export type SimulatorConfig = KnowledgeCheckConfig | SalesSimulationConfig;

export interface SimulatorEvaluation {
  informationAccuracy: number;
  needsDiscovery: number;
  answerStructure: number;
  objectionHandling: number;
  nextStepClosing: number;
}

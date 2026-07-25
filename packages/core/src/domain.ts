export const directionIds = ["life", "work", "skills"] as const;

export type DirectionId = (typeof directionIds)[number];

export type Priority = "low" | "normal" | "high" | "urgent";

export type NeedStatus =
  | "draft"
  | "needs_clarification"
  | "ready_for_match"
  | "matched"
  | "connected"
  | "resolved";

export type Availability = "available" | "limited" | "unavailable";

export type LifeUrgency = "flexible" | "scheduled" | "urgent";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type InteractionFormat = "chat" | "video" | "in_person" | "async";

export type TrustSignalType =
  | "identity"
  | "portfolio"
  | "reference"
  | "company"
  | "manual_review";

export interface Location {
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  remoteAllowed?: boolean;
}

export interface CategoryDefinition {
  id: string;
  title: string;
  summary: string;
}

export interface DirectionDefinition {
  id: DirectionId;
  title: string;
  summary: string;
  categories: CategoryDefinition[];
}

export interface LifeNeedMatchingContext {
  urgency?: LifeUrgency;
  requiresVerifiedIdentity?: boolean;
  maxDistanceKm?: number;
}

export interface WorkNeedMatchingContext {
  requiredRoles?: string[];
  projectContext?: string[];
  minimumExperienceYears?: number;
  requiresPortfolio?: boolean;
  requiresCompanyVerification?: boolean;
}

export interface SkillsNeedMatchingContext {
  currentLevel?: SkillLevel;
  targetLevel?: SkillLevel;
  goals?: string[];
  preferredFormats?: InteractionFormat[];
}

export interface NeedMatchingContext {
  life?: LifeNeedMatchingContext;
  work?: WorkNeedMatchingContext;
  skills?: SkillsNeedMatchingContext;
}

export interface NeedInput {
  direction: DirectionId;
  categoryId: string;
  title: string;
  description: string;
  expectedResult: string;
  ownerUserProfileId?: string;
  schemaId?: string;
  schemaVersion?: number;
  originalContentLanguage?: string;
  communicationLanguage?: string;
  preferredResultLanguage?: string;
  answers?: Record<string, unknown>;
  context?: string;
  constraints?: string[];
  location?: Location;
  priority?: Priority;
  tags?: string[];
  matching?: NeedMatchingContext;
}

export interface Need extends NeedInput {
  id: string;
  status: NeedStatus;
  priority: Priority;
  tags: string[];
  constraints: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrustSignal {
  type: TrustSignalType;
  label: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface LifeProfileMatchingContext {
  supportsUrgent?: boolean;
  serviceRadiusKm?: number;
}

export interface WorkProfileMatchingContext {
  roles?: string[];
  domains?: string[];
  experienceYears?: number;
}

export interface SkillsProfileMatchingContext {
  supportedLevels?: SkillLevel[];
  goals?: string[];
  formats?: InteractionFormat[];
}

export interface ProfileMatchingContext {
  life?: LifeProfileMatchingContext;
  work?: WorkProfileMatchingContext;
  skills?: SkillsProfileMatchingContext;
}

export interface Profile {
  id: string;
  displayName: string;
  role: string;
  summary: string;
  directions: DirectionId[];
  categoryIds: string[];
  capabilities: string[];
  availability: Availability;
  location?: Location;
  trustSignals: TrustSignal[];
  matching?: ProfileMatchingContext;
}

export type RecommendedAction =
  | "request_contact"
  | "shortlist"
  | "review_manually"
  | "skip";

export interface MatchExplanation {
  reasons: string[];
  risks: string[];
  matchedCategories: string[];
  matchedCapabilities: string[];
  scoreBreakdown: MatchScoreBreakdown;
}

export interface MatchScoreBreakdown {
  direction: number;
  category: number;
  capabilities: number;
  location: number;
  availability: number;
  trust: number;
  directionSpecific: number;
  total: number;
}

export interface MatchCandidate {
  profile: Profile;
  score: number;
  recommendedAction: RecommendedAction;
  explanation: MatchExplanation;
}

export type DecisionType = "viewed" | "saved" | "rejected" | "requested_contact";

export interface CandidateDecisionInput {
  needId: string;
  profileId: string;
  decision: DecisionType;
  matchScore?: number;
  note?: string;
}

export interface CandidateDecision extends CandidateDecisionInput {
  id: string;
  decidedAt: string;
}

export interface ShortlistItem {
  profileId: string;
  score: number;
  decision: Extract<DecisionType, "saved" | "requested_contact">;
  position: number;
  reasons: string[];
}

export interface Shortlist {
  id: string;
  needId: string;
  items: ShortlistItem[];
  createdAt: string;
}

export interface ConversationBrief {
  needId: string;
  profileId: string;
  goal: string;
  context: string[];
  questions: string[];
  risks: string[];
  nextStep: string;
}

export type ConversationState =
  | "draft"
  | "opened"
  | "assigned"
  | "waiting_user"
  | "waiting_operator"
  | "resolved"
  | "failed";

export type ConversationChannel = "chatwoot_concierge" | "direct_product_chat";

export interface ConversationExternalRef {
  provider: "chatwoot" | "cifedra";
  id?: string;
  url?: string;
}

export interface Conversation {
  id: string;
  needId: string;
  profileId: string;
  decisionId: string;
  channel: ConversationChannel;
  state: ConversationState;
  goal: string;
  context: string[];
  questions: string[];
  risks: string[];
  firstMessage: string;
  externalRef?: ConversationExternalRef;
  createdAt: string;
  updatedAt: string;
}

export type EngagementStatus = "planned" | "in_progress" | "completed" | "cancelled";

export type EngagementResultArtifactFormat = "structured_markdown";

export interface EngagementExecutionBrief {
  readonly summary: string;
  readonly context: readonly string[];
  readonly risks: readonly string[];
  readonly nextStep: string;
}

export interface EngagementResultArtifact {
  readonly format: EngagementResultArtifactFormat;
  readonly title: string;
  readonly content: string;
}

export interface Engagement {
  readonly id: string;
  readonly needId: string;
  readonly profileId: string;
  readonly contactRequestId: string;
  readonly conversationId?: string;
  readonly clientUserProfileId: string;
  readonly providerProfileId: string;
  readonly status: EngagementStatus;
  readonly title: string;
  readonly expectedResult: string;
  readonly executionBrief: EngagementExecutionBrief;
  readonly resultArtifactFormat: EngagementResultArtifactFormat;
  readonly resultArtifact?: EngagementResultArtifact;
  readonly plannedAt: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly cancelledAt?: string;
  readonly cancellationReason?: string;
  readonly aggregateVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ContactOutcome =
  | "agreed"
  | "not_relevant"
  | "no_response"
  | "needs_follow_up"
  | "needs_another_person";

export interface ContactResultInput {
  needId: string;
  profileId: string;
  conversationId?: string;
  decisionId?: string;
  outcome: ContactOutcome;
  summary: string;
  matchScore?: number;
  nextStep?: string;
  qualityScore?: number;
}

export interface ContactResult extends ContactResultInput {
  id: string;
  nextStep: string;
  qualityScore: number;
  recordedAt: string;
}

export type MatchQualityImpact = "positive" | "neutral" | "negative";

export interface MatchQualitySignal {
  id: string;
  resultId: string;
  needId: string;
  profileId: string;
  conversationId?: string;
  decisionId?: string;
  outcome: ContactOutcome;
  matchScore?: number;
  qualityScore: number;
  impact: MatchQualityImpact;
  createdAt: string;
}

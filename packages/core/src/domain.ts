export const directionIds = ["life", "work", "skills"] as const;

export type DirectionId = (typeof directionIds)[number];

export type Priority = "low" | "normal" | "high" | "urgent";

export type NeedStatus =
  | "draft"
  | "ready_for_match"
  | "matched"
  | "connected"
  | "resolved";

export type Availability = "available" | "limited" | "unavailable";

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

export interface NeedInput {
  direction: DirectionId;
  categoryId: string;
  title: string;
  description: string;
  expectedResult: string;
  context?: string;
  constraints?: string[];
  location?: Location;
  priority?: Priority;
  tags?: string[];
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

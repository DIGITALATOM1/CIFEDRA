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

export interface ConversationBrief {
  needId: string;
  profileId: string;
  goal: string;
  context: string[];
  questions: string[];
  risks: string[];
  nextStep: string;
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
  outcome: ContactOutcome;
  summary: string;
  nextStep?: string;
  qualityScore?: number;
}

export interface ContactResult extends ContactResultInput {
  id: string;
  recordedAt: string;
}

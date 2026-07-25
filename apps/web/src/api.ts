export type DirectionId = "life" | "work" | "skills";

export interface AuthPrincipal {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly string[];
}

export interface AuthSessionResponse {
  readonly token: string;
  readonly expiresAt: string;
  readonly user: AuthPrincipal;
}

export interface DirectionDefinition {
  readonly id: DirectionId;
  readonly title: string;
  readonly summary: string;
  readonly categories: readonly {
    readonly id: string;
    readonly title: string;
    readonly summary: string;
  }[];
}

export interface NeedInput {
  readonly direction: DirectionId;
  readonly categoryId: string;
  readonly title: string;
  readonly description: string;
  readonly expectedResult: string;
  readonly answers?: Record<string, unknown>;
  readonly context?: string;
  readonly constraints?: readonly string[];
  readonly location?: {
    readonly city?: string;
    readonly district?: string;
    readonly remoteAllowed?: boolean;
  };
  readonly priority?: "low" | "normal" | "high" | "urgent";
  readonly tags?: readonly string[];
  readonly matching?: Record<string, unknown>;
}

export interface Need extends NeedInput {
  readonly id: string;
  readonly status: string;
  readonly priority: NonNullable<NeedInput["priority"]>;
  readonly tags: readonly string[];
  readonly constraints: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MatchCandidate {
  readonly profile: {
    readonly id: string;
    readonly displayName: string;
    readonly role: string;
    readonly summary: string;
    readonly capabilities: readonly string[];
    readonly availability: string;
    readonly trustSignals: readonly {
      readonly type: string;
      readonly label: string;
      readonly verified: boolean;
    }[];
  };
  readonly score: number;
  readonly recommendedAction: string;
  readonly explanation: {
    readonly reasons: readonly string[];
    readonly risks: readonly string[];
    readonly matchedCategories: readonly string[];
    readonly matchedCapabilities: readonly string[];
    readonly scoreBreakdown: Record<string, number>;
  };
}

export interface CandidateDecision {
  readonly id: string;
  readonly needId: string;
  readonly profileId: string;
  readonly decision: "viewed" | "saved" | "rejected" | "requested_contact";
  readonly matchScore?: number;
  readonly note?: string;
  readonly decidedAt: string;
}

export interface ContactRequest {
  readonly id: string;
  readonly needId: string;
  readonly profileId: string;
  readonly decisionId: string;
  readonly clientUserProfileId: string;
  readonly providerProfileId: string;
  readonly status: "requested" | "accepted" | "declined" | "expired" | "cancelled";
  readonly disclosureSnapshot: {
    readonly policyVersion: string;
    readonly publicBrief: {
      readonly direction: DirectionId;
      readonly categoryId: string;
      readonly title: string;
      readonly expectedResult: string;
      readonly serviceRegion?: {
        readonly city?: string;
        readonly district?: string;
        readonly remoteAllowed?: boolean;
      };
      readonly serviceVariants?: readonly string[];
      readonly preferredTimeWindow?: string;
      readonly originalContentLanguage?: string;
      readonly communicationLanguage?: string;
      readonly preferredResultLanguage?: string;
    };
    readonly hiddenFields: readonly string[];
  };
  readonly consentSnapshot: {
    readonly allowedDisclosureFields: readonly string[];
  };
  readonly requestedAt: string;
  readonly expiresAt?: string;
  readonly aggregateVersion: number;
}

export interface Engagement {
  readonly id: string;
  readonly needId: string;
  readonly profileId: string;
  readonly contactRequestId: string;
  readonly conversationId?: string;
  readonly clientUserProfileId: string;
  readonly providerProfileId: string;
  readonly status: "planned" | "in_progress" | "completed" | "cancelled";
  readonly title: string;
  readonly expectedResult: string;
  readonly executionBrief: {
    readonly summary: string;
    readonly context: readonly string[];
    readonly risks: readonly string[];
    readonly nextStep: string;
  };
  readonly resultArtifactFormat: "structured_markdown";
  readonly resultArtifact?: {
    readonly format: "structured_markdown";
    readonly title: string;
    readonly content: string;
  };
  readonly plannedAt: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly cancelledAt?: string;
  readonly cancellationReason?: string;
  readonly aggregateVersion: number;
}

export interface ConversationBrief {
  readonly needId: string;
  readonly profileId: string;
  readonly goal: string;
  readonly context: readonly string[];
  readonly questions: readonly string[];
  readonly risks: readonly string[];
  readonly nextStep: string;
}

export interface Conversation {
  readonly id: string;
  readonly needId: string;
  readonly profileId: string;
  readonly decisionId: string;
  readonly channel: "chatwoot_concierge" | "direct_product_chat";
  readonly state: string;
  readonly goal: string;
  readonly context: readonly string[];
  readonly questions: readonly string[];
  readonly risks: readonly string[];
  readonly firstMessage: string;
}

export interface DemoMatchResponse {
  readonly need: Need;
  readonly matches: readonly MatchCandidate[];
  readonly decisions: readonly CandidateDecision[];
  readonly shortlist: {
    readonly id: string;
    readonly needId: string;
    readonly items: readonly Record<string, unknown>[];
  };
  readonly firstContactRequest: ContactRequest | null;
  readonly firstBrief: ConversationBrief | null;
  readonly firstConversationDraft: Conversation | null;
  readonly firstEngagement: Engagement | null;
  readonly integrationWorkflow: Record<string, unknown>;
  readonly actor: AuthPrincipal;
}

export interface DemoEngagementSimulationResponse {
  readonly acceptedContactRequest: ContactRequest;
  readonly engagement: Engagement;
  readonly actor: AuthPrincipal;
}

export interface DemoEngagementTransitionResponse {
  readonly engagement: Engagement;
  readonly actor: AuthPrincipal;
}

export interface ApiError extends Error {
  status: number;
}

const defaultApiUrl = "http://localhost:3030";

export const apiBaseUrl =
  import.meta.env.VITE_CIFEDRA_API_URL?.replace(/\/$/, "") ?? defaultApiUrl;

export async function getDirections(): Promise<readonly DirectionDefinition[]> {
  const body = await request<{ directions: readonly DirectionDefinition[] }>("/directions");

  return body.directions;
}

export async function register(input: {
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
}): Promise<AuthSessionResponse> {
  return request<AuthSessionResponse>("/auth/register", {
    method: "POST",
    body: input
  });
}

export async function login(input: {
  readonly email: string;
  readonly password: string;
}): Promise<AuthSessionResponse> {
  return request<AuthSessionResponse>("/auth/login", {
    method: "POST",
    body: input
  });
}

export async function createDemoMatch(
  token: string,
  input: NeedInput
): Promise<DemoMatchResponse> {
  return request<DemoMatchResponse>("/demo/match", {
    method: "POST",
    token,
    body: input
  });
}

export async function simulateEngagement(
  token: string,
  input: {
    readonly need: Need;
    readonly contactRequest: ContactRequest;
    readonly conversation?: Conversation | null;
    readonly brief?: ConversationBrief | null;
  }
): Promise<DemoEngagementSimulationResponse> {
  return request<DemoEngagementSimulationResponse>("/demo/engagements/simulate", {
    method: "POST",
    token,
    body: input
  });
}

export async function transitionEngagement(
  token: string,
  input: {
    readonly engagement: Engagement;
    readonly action: "start" | "complete" | "cancel";
    readonly summary?: string;
    readonly nextStep?: string;
    readonly reason?: string;
  }
): Promise<DemoEngagementTransitionResponse> {
  return request<DemoEngagementTransitionResponse>("/demo/engagements/transition", {
    method: "POST",
    token,
    body: input
  });
}

export async function request<T>(
  path: string,
  options: {
    readonly method?: "GET" | "POST";
    readonly token?: string;
    readonly body?: unknown;
  } = {}
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const payload = await safeJson<{ error?: string }>(response);
    const error = new Error(payload?.error ?? `API request failed with ${response.status}`);
    (error as ApiError).status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

async function safeJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

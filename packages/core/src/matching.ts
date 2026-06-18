import type {
  MatchCandidate,
  MatchExplanation,
  MatchScoreBreakdown,
  Need,
  Profile,
  RecommendedAction
} from "./domain.js";
import { scoreDirectionRules } from "./matching-rules.js";
import { clampScore, overlap } from "./utils.js";

export interface MatchOptions {
  limit?: number;
  minScore?: number;
}

export function rankProfilesForNeed(
  need: Need,
  profiles: Profile[],
  options: MatchOptions = {}
): MatchCandidate[] {
  const limit = options.limit ?? 10;
  const minScore = options.minScore ?? 25;

  return profiles
    .map((profile) => scoreProfileForNeed(need, profile))
    .filter((candidate) => candidate.score >= minScore)
    .sort(
      (left, right) =>
        right.score - left.score || left.profile.id.localeCompare(right.profile.id)
    )
    .slice(0, limit);
}

export function scoreProfileForNeed(need: Need, profile: Profile): MatchCandidate {
  const hasDirectionFit = profile.directions.includes(need.direction);
  const directionFit = hasDirectionFit ? 20 : -40;
  const matchedCategories = overlap([need.categoryId], profile.categoryIds);
  const categoryFit = matchedCategories.length > 0 ? 20 : 0;
  const matchedCapabilities = overlap(need.tags, profile.capabilities);
  const capabilityFit = Math.min(15, matchedCapabilities.length * 5);
  const availabilityFit = scoreAvailability(profile);
  const trustFit = scoreTrust(profile);
  const directionRules = scoreDirectionRules(need, profile);
  const scoreBreakdown = buildScoreBreakdown({
    direction: directionFit,
    category: categoryFit,
    capabilities: capabilityFit,
    location: directionRules.location,
    availability: availabilityFit,
    trust: trustFit,
    directionSpecific: directionRules.directionSpecific
  });

  return {
    profile,
    score: scoreBreakdown.total,
    recommendedAction: getRecommendedAction(
      scoreBreakdown.total,
      profile,
      hasDirectionFit,
      directionRules.requiresManualReview
    ),
    explanation: buildExplanation(
      need,
      profile,
      matchedCategories,
      matchedCapabilities,
      scoreBreakdown,
      directionRules.reasons,
      directionRules.risks
    )
  };
}

function scoreAvailability(profile: Profile): number {
  if (profile.availability === "available") {
    return 10;
  }

  if (profile.availability === "limited") {
    return 5;
  }

  return -10;
}

function scoreTrust(profile: Profile): number {
  const verifiedSignals = profile.trustSignals.filter((signal) => signal.verified).length;
  return Math.min(10, verifiedSignals * 4);
}

function getRecommendedAction(
  score: number,
  profile: Profile,
  hasDirectionFit: boolean,
  requiresManualReview: boolean
): RecommendedAction {
  if (profile.availability === "unavailable" || !hasDirectionFit) {
    return "skip";
  }

  if (requiresManualReview) {
    return "review_manually";
  }

  if (score >= 65) {
    return "request_contact";
  }

  if (score >= 45) {
    return "shortlist";
  }

  return "review_manually";
}

function buildExplanation(
  need: Need,
  profile: Profile,
  matchedCategories: string[],
  matchedCapabilities: string[],
  scoreBreakdown: MatchScoreBreakdown,
  directionReasons: string[],
  directionRisks: string[]
): MatchExplanation {
  const reasons: string[] = [...directionReasons];
  const risks: string[] = [...directionRisks];

  if (profile.directions.includes(need.direction)) {
    reasons.push(`Профиль работает с направлением ${need.direction}`);
  } else {
    risks.push(`Профиль не работает с направлением ${need.direction}`);
  }

  if (matchedCategories.length > 0) {
    reasons.push(`Совпадает категория: ${matchedCategories.join(", ")}`);
  }

  if (matchedCapabilities.length > 0) {
    reasons.push(`Совпадают навыки: ${matchedCapabilities.join(", ")}`);
  }

  if (profile.availability === "available") {
    reasons.push("Профиль сейчас доступен для контакта");
  }

  if (profile.availability === "limited") {
    risks.push("Доступность ограничена");
  }

  if (profile.availability === "unavailable") {
    risks.push("Профиль сейчас недоступен");
  }

  if (profile.trustSignals.every((signal) => !signal.verified)) {
    risks.push("Пока нет подтвержденных сигналов доверия");
  }

  return {
    reasons,
    risks,
    matchedCategories,
    matchedCapabilities,
    scoreBreakdown
  };
}

function buildScoreBreakdown(
  values: Omit<MatchScoreBreakdown, "total">
): MatchScoreBreakdown {
  return {
    ...values,
    total: clampScore(
      values.direction +
        values.category +
        values.capabilities +
        values.location +
        values.availability +
        values.trust +
        values.directionSpecific
    )
  };
}

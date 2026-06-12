import type { MatchCandidate, MatchExplanation, Need, Profile, RecommendedAction } from "./domain.js";
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
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function scoreProfileForNeed(need: Need, profile: Profile): MatchCandidate {
  const directionFit = profile.directions.includes(need.direction) ? 30 : 0;
  const matchedCategories = overlap([need.categoryId], profile.categoryIds);
  const categoryFit = matchedCategories.length > 0 ? 20 : 0;
  const matchedCapabilities = overlap(need.tags, profile.capabilities);
  const capabilityFit = Math.min(20, matchedCapabilities.length * 7);
  const locationFit = scoreLocationFit(need, profile);
  const availabilityFit = scoreAvailability(profile);
  const trustFit = scoreTrust(profile);

  const score = clampScore(
    directionFit + categoryFit + capabilityFit + locationFit + availabilityFit + trustFit
  );

  return {
    profile,
    score,
    recommendedAction: getRecommendedAction(score, profile),
    explanation: buildExplanation(need, profile, matchedCategories, matchedCapabilities)
  };
}

function scoreLocationFit(need: Need, profile: Profile): number {
  if (need.direction !== "life") {
    return need.location?.remoteAllowed || profile.location?.remoteAllowed ? 5 : 0;
  }

  if (!need.location || !profile.location) {
    return 0;
  }

  if (need.location.city && profile.location.city && sameText(need.location.city, profile.location.city)) {
    if (
      need.location.district &&
      profile.location.district &&
      sameText(need.location.district, profile.location.district)
    ) {
      return 15;
    }

    return 10;
  }

  return profile.location.remoteAllowed ? 4 : 0;
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
  return Math.min(15, verifiedSignals * 5);
}

function getRecommendedAction(score: number, profile: Profile): RecommendedAction {
  if (profile.availability === "unavailable") {
    return "skip";
  }

  if (score >= 75) {
    return "request_contact";
  }

  if (score >= 55) {
    return "shortlist";
  }

  return "review_manually";
}

function buildExplanation(
  need: Need,
  profile: Profile,
  matchedCategories: string[],
  matchedCapabilities: string[]
): MatchExplanation {
  const reasons: string[] = [];
  const risks: string[] = [];

  if (profile.directions.includes(need.direction)) {
    reasons.push(`Профиль работает с направлением ${need.direction}`);
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
    matchedCapabilities
  };
}

function sameText(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

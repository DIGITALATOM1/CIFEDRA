import type {
  InteractionFormat,
  Need,
  Profile,
  SkillLevel,
  TrustSignalType
} from "./domain.js";
import { overlap } from "./utils.js";

export interface DirectionRuleScore {
  location: number;
  directionSpecific: number;
  reasons: string[];
  risks: string[];
  requiresManualReview: boolean;
}

export function scoreDirectionRules(need: Need, profile: Profile): DirectionRuleScore {
  switch (need.direction) {
    case "life":
      return scoreLifeRules(need, profile);
    case "work":
      return scoreWorkRules(need, profile);
    case "skills":
      return scoreSkillsRules(need, profile);
  }
}

function scoreLifeRules(need: Need, profile: Profile): DirectionRuleScore {
  const reasons: string[] = [];
  const risks: string[] = [];
  const context = need.matching?.life;
  const profileContext = profile.matching?.life;
  const location = scoreLifeLocation(need, profile, reasons, risks);
  const urgency = context?.urgency ?? (need.priority === "urgent" ? "urgent" : undefined);
  let directionSpecific = 0;
  let requiresManualReview = false;

  if (urgency === "urgent") {
    if (profileContext?.supportsUrgent) {
      directionSpecific += 4;
      reasons.push("Профиль принимает срочные задачи");
    } else {
      directionSpecific -= 8;
      risks.push("Не подтверждена готовность к срочной задаче");
    }
  }

  if (context?.requiresVerifiedIdentity) {
    if (hasVerifiedSignal(profile, "identity")) {
      directionSpecific += 6;
      reasons.push("Личность подтверждена");
    } else {
      directionSpecific -= 20;
      requiresManualReview = true;
      risks.push("Для задачи требуется подтвержденная личность");
    }
  }

  return {
    location,
    directionSpecific,
    reasons,
    risks,
    requiresManualReview
  };
}

function scoreLifeLocation(
  need: Need,
  profile: Profile,
  reasons: string[],
  risks: string[]
): number {
  const needLocation = need.location;
  const profileLocation = profile.location;

  if (!needLocation || !profileLocation) {
    risks.push("Недостаточно данных для проверки географии");
    return 0;
  }

  const distance = calculateDistanceKm(needLocation, profileLocation);
  const requestedRadius = need.matching?.life?.maxDistanceKm;
  const serviceRadius = profile.matching?.life?.serviceRadiusKm;

  if (distance !== undefined) {
    const allowedDistance = minDefined(requestedRadius, serviceRadius);

    if (allowedDistance !== undefined && distance > allowedDistance) {
      risks.push(
        `Профиль находится за пределами допустимого радиуса (${formatDistance(distance)} км)`
      );
      return -15;
    }

    reasons.push(`Профиль находится примерно в ${formatDistance(distance)} км`);
    return distance <= 3 ? 15 : distance <= 10 ? 12 : 8;
  }

  if (
    needLocation.city &&
    profileLocation.city &&
    sameText(needLocation.city, profileLocation.city)
  ) {
    if (
      needLocation.district &&
      profileLocation.district &&
      sameText(needLocation.district, profileLocation.district)
    ) {
      reasons.push("Профиль находится в том же районе");
      return 15;
    }

    reasons.push("Профиль находится в том же городе");
    return 10;
  }

  risks.push("География профиля не совпадает с задачей");
  return -12;
}

function scoreWorkRules(need: Need, profile: Profile): DirectionRuleScore {
  const reasons: string[] = [];
  const risks: string[] = [];
  const context = need.matching?.work;
  const profileContext = profile.matching?.work;
  let directionSpecific = scoreRemoteFit(need, profile, reasons, risks);
  let requiresManualReview = false;

  if (context?.requiredRoles?.length) {
    const matchedRoles = overlap(context.requiredRoles, [
      profile.role,
      ...(profileContext?.roles ?? [])
    ]);

    if (matchedRoles.length > 0) {
      directionSpecific += 4;
      reasons.push(`Совпадает требуемая роль: ${matchedRoles.join(", ")}`);
    } else {
      directionSpecific -= 8;
      risks.push("Не совпадает требуемая проектная роль");
    }
  }

  if (context?.projectContext?.length) {
    const matchedContext = overlap(context.projectContext, [
      ...profile.capabilities,
      ...(profileContext?.domains ?? [])
    ]);

    if (matchedContext.length > 0) {
      directionSpecific += Math.min(4, matchedContext.length * 2);
      reasons.push(`Совпадает проектный контекст: ${matchedContext.join(", ")}`);
    } else {
      directionSpecific -= 5;
      risks.push("Не найдено совпадений с проектным контекстом");
    }
  }

  if (context?.minimumExperienceYears !== undefined) {
    const experienceYears = profileContext?.experienceYears;

    if (experienceYears !== undefined && experienceYears >= context.minimumExperienceYears) {
      directionSpecific += 4;
      reasons.push(`Опыт ${experienceYears} лет соответствует требованию`);
    } else {
      directionSpecific -= 8;
      risks.push(
        experienceYears === undefined
          ? "Не указан подтвержденный опыт"
          : `Опыт ${experienceYears} лет ниже требуемого`
      );
    }
  }

  if (context?.requiresPortfolio) {
    if (hasVerifiedSignal(profile, "portfolio")) {
      directionSpecific += 3;
      reasons.push("Портфолио подтверждено");
    } else {
      directionSpecific -= 10;
      requiresManualReview = true;
      risks.push("Для задачи требуется подтвержденное портфолио");
    }
  }

  if (context?.requiresCompanyVerification) {
    if (hasVerifiedSignal(profile, "company")) {
      directionSpecific += 2;
      reasons.push("Корпоративный контекст подтвержден");
    } else {
      directionSpecific -= 8;
      requiresManualReview = true;
      risks.push("Требуется подтверждение корпоративного контекста");
    }
  }

  return {
    location: 0,
    directionSpecific,
    reasons,
    risks,
    requiresManualReview
  };
}

function scoreSkillsRules(need: Need, profile: Profile): DirectionRuleScore {
  const reasons: string[] = [];
  const risks: string[] = [];
  const context = need.matching?.skills;
  const profileContext = profile.matching?.skills;
  let directionSpecific = scoreRemoteFit(need, profile, reasons, risks);

  if (context?.currentLevel) {
    if (profileContext?.supportedLevels?.includes(context.currentLevel)) {
      directionSpecific += 4;
      reasons.push(`Профиль работает с уровнем ${context.currentLevel}`);
    } else {
      directionSpecific -= 6;
      risks.push(`Не подтверждена работа с уровнем ${context.currentLevel}`);
    }
  }

  if (context?.targetLevel && profileContext?.supportedLevels?.includes(context.targetLevel)) {
    directionSpecific += 2;
    reasons.push(`Профиль поддерживает целевой уровень ${context.targetLevel}`);
  }

  if (context?.goals?.length) {
    const matchedGoals = overlap(context.goals, [
      ...profile.capabilities,
      ...(profileContext?.goals ?? [])
    ]);

    if (matchedGoals.length > 0) {
      directionSpecific += Math.min(6, matchedGoals.length * 3);
      reasons.push(`Совпадают цели развития: ${matchedGoals.join(", ")}`);
    } else {
      directionSpecific -= 5;
      risks.push("Не найдено совпадений с целями развития");
    }
  }

  if (context?.preferredFormats?.length) {
    const matchedFormats = matchFormats(context.preferredFormats, profileContext?.formats ?? []);

    if (matchedFormats.length > 0) {
      directionSpecific += 5;
      reasons.push(`Подходит формат: ${matchedFormats.join(", ")}`);
    } else {
      directionSpecific -= 6;
      risks.push("Предпочитаемый формат занятий недоступен");
    }
  }

  return {
    location: 0,
    directionSpecific,
    reasons,
    risks,
    requiresManualReview: false
  };
}

function scoreRemoteFit(
  need: Need,
  profile: Profile,
  reasons: string[],
  risks: string[]
): number {
  if (!need.location?.remoteAllowed) {
    return 0;
  }

  if (profile.location?.remoteAllowed) {
    reasons.push("Профиль доступен для удаленного контакта");
    return 3;
  }

  risks.push("Для удаленного сценария не подтверждена удаленная доступность");
  return -5;
}

function hasVerifiedSignal(profile: Profile, type: TrustSignalType): boolean {
  return profile.trustSignals.some((signal) => signal.type === type && signal.verified);
}

function matchFormats(
  preferredFormats: InteractionFormat[],
  availableFormats: InteractionFormat[]
): InteractionFormat[] {
  return preferredFormats.filter((format) => availableFormats.includes(format));
}

function calculateDistanceKm(
  left: NonNullable<Need["location"]>,
  right: NonNullable<Profile["location"]>
): number | undefined {
  if (
    left.latitude === undefined ||
    left.longitude === undefined ||
    right.latitude === undefined ||
    right.longitude === undefined
  ) {
    return undefined;
  }

  const earthRadiusKm = 6371;
  const latitudeDelta = degreesToRadians(right.latitude - left.latitude);
  const longitudeDelta = degreesToRadians(right.longitude - left.longitude);
  const leftLatitude = degreesToRadians(left.latitude);
  const rightLatitude = degreesToRadians(right.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function minDefined(left?: number, right?: number): number | undefined {
  if (left === undefined) {
    return right;
  }

  if (right === undefined) {
    return left;
  }

  return Math.min(left, right);
}

function formatDistance(value: number): string {
  return value.toFixed(value < 10 ? 1 : 0);
}

function sameText(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

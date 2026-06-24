export const supportedLanguageCodes = ["ru", "en"] as const;
export const supportedLocaleCodes = ["ru-RU", "en-US"] as const;

export type LanguageCode = (typeof supportedLanguageCodes)[number];
export type LocaleCode = (typeof supportedLocaleCodes)[number];

export interface LocalePreference {
  readonly locale: LocaleCode;
  readonly timezone: string;
  readonly preferredContentLanguage: LanguageCode;
}

export class LanguageError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function assertSupportedLanguageCode(value: string): LanguageCode {
  assertCleanValue("language", value);

  if (!supportedLanguageCodes.includes(value as LanguageCode)) {
    throw new LanguageError(`Unsupported language: ${value}`);
  }

  return value as LanguageCode;
}

export function assertSupportedLocaleCode(value: string): LocaleCode {
  assertCleanValue("locale", value);

  if (!supportedLocaleCodes.includes(value as LocaleCode)) {
    throw new LanguageError(`Unsupported locale: ${value}`);
  }

  return value as LocaleCode;
}

export function assertValidTimezone(value: string): string {
  assertCleanValue("timezone", value);

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: value
    }).format(new Date("2026-01-01T00:00:00.000Z"));
  } catch {
    throw new LanguageError(`Invalid timezone: ${value}`);
  }

  return value;
}

export function normalizeLanguageCodes(values: readonly string[]): LanguageCode[] {
  const normalized: LanguageCode[] = [];

  for (const value of values) {
    const language = assertSupportedLanguageCode(value);

    if (!normalized.includes(language)) {
      normalized.push(language);
    }
  }

  return normalized;
}

function assertCleanValue(name: string, value: string): void {
  if (!value || value.trim() !== value) {
    throw new LanguageError(`${name} must not be empty or padded`);
  }

  if (/[\u0000-\u001F\u007F]/.test(value)) {
    throw new LanguageError(`${name} must not contain control characters`);
  }
}

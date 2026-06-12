export function createId(prefix: string): string {
  const entropy = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${entropy}`;
}

export function toIsoString(date: Date = new Date()): string {
  return date.toISOString();
}

export function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function uniqueTokens(values: string[] = []): string[] {
  return [...new Set(values.map(normalizeToken).filter(Boolean))];
}

export function overlap(left: string[], right: string[]): string[] {
  const rightSet = new Set(uniqueTokens(right));
  return uniqueTokens(left).filter((item) => rightSet.has(item));
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

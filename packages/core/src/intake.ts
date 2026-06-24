import type { DirectionId, Need, NeedInput, NeedStatus } from "./domain.js";
import { assertSupportedLanguageCode, type LanguageCode } from "./language.js";
import { validateNeedInput } from "./need.js";
import { createId, toIsoString } from "./utils.js";

export type NeedSchemaStatus = "draft" | "published" | "deprecated";
export type NeedFieldType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "boolean"
  | "integer"
  | "date"
  | "date_time"
  | "language_code";

export type ForbiddenContentKind = "url" | "email" | "phone" | "file" | "exact_address";

export interface NeedSchemaCondition {
  readonly fieldId: string;
  readonly equals?: unknown;
  readonly includes?: unknown;
  readonly minItems?: number;
}

export interface NeedSchemaInvalidWhen {
  readonly condition: NeedSchemaCondition;
  readonly forbiddenValues: readonly unknown[];
}

export interface NumericLimitByUnit {
  readonly unitFieldId: string;
  readonly maxByUnit: Record<string, number>;
}

export interface NeedSchemaField {
  readonly id: string;
  readonly label: string;
  readonly type: NeedFieldType;
  readonly required?: boolean;
  readonly requiredWhen?: NeedSchemaCondition;
  readonly allowedValues?: readonly string[];
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly minValue?: number;
  readonly maxValue?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly future?: boolean;
  readonly forbiddenContentKinds?: readonly ForbiddenContentKind[];
  readonly numericLimitByUnit?: NumericLimitByUnit;
  readonly mustBeTrueWhen?: NeedSchemaCondition;
  readonly invalidWhen?: NeedSchemaInvalidWhen;
}

export interface NeedSchema {
  readonly schemaId: string;
  readonly version: number;
  readonly status: NeedSchemaStatus;
  readonly direction: DirectionId;
  readonly categoryId: string;
  readonly title: string;
  readonly fields: readonly NeedSchemaField[];
}

export interface NeedCompleteness {
  readonly complete: boolean;
  readonly missingFieldIds: readonly string[];
  readonly invalidFieldIds: readonly string[];
}

export interface VersionedNeedInput {
  readonly ownerUserProfileId: string;
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly title: string;
  readonly description: string;
  readonly answers: Record<string, unknown>;
  readonly originalContentLanguage: string;
  readonly communicationLanguage: string;
  readonly preferredResultLanguage: string;
  readonly priority?: NeedInput["priority"];
  readonly tags?: readonly string[];
}

export interface VersionedNeed extends Need {
  readonly ownerUserProfileId: string;
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly aggregateVersion: number;
  readonly answers: Record<string, unknown>;
  readonly completeness: NeedCompleteness;
  readonly originalContentLanguage: LanguageCode;
  readonly communicationLanguage: LanguageCode;
  readonly preferredResultLanguage: LanguageCode;
}

export class IntakeError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
  }
}

export const localNeedSchemas: readonly NeedSchema[] = [
  {
    schemaId: "work.srs-review",
    version: 1,
    status: "published",
    direction: "work",
    categoryId: "work.expert-help",
    title: "Work / SRS Review",
    fields: [
      single("reviewType", ["quick_review"], true),
      single("requesterRole", ["analyst", "delivery_product", "engineering", "founder", "other"], true),
      single(
        "artifactType",
        ["srs", "requirements_specification", "api_requirements", "change_requirements", "other"],
        true
      ),
      longText("artifactTypeOther", {
        requiredWhen: {
          fieldId: "artifactType",
          equals: "other"
        }
      }),
      single("artifactStage", ["draft", "pre_estimation", "pre_development", "change_review"], true),
      multi("documentAudience", ["business", "development", "testing", "architecture", "operations"], true, {
        minItems: 1
      }),
      longText("reviewGoal", { required: true }),
      longText("systemContext", { required: true }),
      longText("expectedResult", { required: true }),
      integer("artifactSizeValue", {
        required: true,
        minValue: 1,
        numericLimitByUnit: {
          unitFieldId: "artifactSizeUnit",
          maxByUnit: {
            pages: 25,
            words: 10_000
          }
        }
      }),
      single("artifactSizeUnit", ["pages", "words"], true),
      single(
        "reviewFocus",
        ["completeness", "consistency", "ambiguity", "testability", "acceptance", "data", "integrations", "NFR"],
        true
      ),
      dateTime("desiredDeadline", { required: true, future: true }),
      single("dataMode", ["synthetic"], true),
      single("serviceFormat", ["online"], true),
      longText("knownConcerns"),
      longText("openBusinessDecisions"),
      single("preferredInteraction", ["async", "chat", "debrief"]),
      shortText("budgetRange")
    ]
  },
  {
    schemaId: "life.outdoor-maintenance",
    version: 1,
    status: "published",
    direction: "life",
    categoryId: "life.home-help",
    title: "Life / Outdoor Maintenance",
    fields: [
      multi("serviceTypes", ["pool_cleaning", "lawn_mowing"], true, {
        minItems: 1,
        maxItems: 2
      }),
      booleanField("singleProviderVisit", {
        required: true,
        mustBeTrueWhen: {
          fieldId: "serviceTypes",
          minItems: 2
        }
      }),
      single("serviceRegionId", ["synthetic_region_north", "synthetic_region_south"], true),
      dateField("desiredDate", { required: true, future: true }),
      longText("propertyContext", {
        required: true,
        forbiddenContentKinds: ["url", "email", "phone", "exact_address"]
      }),
      longText("expectedResult", { required: true }),
      single("accessPresence", ["client_present", "provider_independent", "to_be_agreed"], true),
      single("dataMode", ["synthetic"], true),
      single("serviceFormat", ["in_person"], true),
      integer("poolSizeValue", {
        minValue: 1,
        requiredWhen: {
          fieldId: "serviceTypes",
          includes: "pool_cleaning"
        }
      }),
      single("poolSizeUnit", ["square_meters", "cubic_meters"], false, {
        requiredWhen: {
          fieldId: "serviceTypes",
          includes: "pool_cleaning"
        }
      }),
      single("poolCondition", ["routine", "dirty", "algae", "unknown"], false, {
        requiredWhen: {
          fieldId: "serviceTypes",
          includes: "pool_cleaning"
        }
      }),
      integer("lawnAreaM2", {
        minValue: 1,
        requiredWhen: {
          fieldId: "serviceTypes",
          includes: "lawn_mowing"
        }
      }),
      single("terrainCondition", ["flat", "mixed", "difficult", "unknown"], false, {
        requiredWhen: {
          fieldId: "serviceTypes",
          includes: "lawn_mowing"
        }
      }),
      single("preferredTimeWindow", ["morning", "afternoon", "evening", "flexible"], true),
      single("equipmentResponsibility", ["client", "provider", "to_be_agreed"], true),
      longText("accessConstraints", {
        required: true,
        forbiddenContentKinds: ["url", "email", "phone"]
      }),
      longText("safetyConcerns", {
        required: true,
        forbiddenContentKinds: ["url", "email", "phone"]
      }),
      longText("additionalNotes", {
        forbiddenContentKinds: ["url", "email", "phone", "exact_address"]
      })
    ]
  },
  {
    schemaId: "skills.interview-preparation",
    version: 1,
    status: "published",
    direction: "skills",
    categoryId: "skills.career-help",
    title: "Skills / Interview Preparation",
    fields: [
      shortText("targetRole", { required: true }),
      single("targetSeniority", ["intern", "junior", "middle", "senior", "lead", "executive"], true),
      shortText("domainContext", { required: true }),
      single("currentSeniority", ["intern", "junior", "middle", "senior", "lead", "executive"], true),
      multi("interviewTypes", ["hr", "technical", "case", "system_design", "behavioral"], true, {
        minItems: 1
      }),
      single("preparationGoal", ["answers", "mock_interview", "resume_story", "case_practice", "feedback"], true),
      single("targetTimeline", ["within_week", "within_month", "exploring"], true),
      languageField("interviewLanguage", true),
      longText("vacancyContext", {
        required: true,
        forbiddenContentKinds: ["url", "email", "phone", "file"]
      }),
      longText("expectedResult", { required: true }),
      single("preferredFormat", ["video", "chat", "async"], true, {
        invalidWhen: {
          condition: {
            fieldId: "preparationGoal",
            equals: "mock_interview"
          },
          forbiddenValues: ["async"]
        }
      }),
      single("sessionDurationMinutes", ["30", "45", "60"], true),
      single("dataMode", ["synthetic"], true),
      longText("experienceSummary"),
      longText("weakAreas"),
      dateTime("interviewDate", { future: true }),
      longText("communicationPreferences")
    ]
  }
];

export function createNeedFromSchema(
  input: VersionedNeedInput,
  now: Date = new Date(),
  registry: readonly NeedSchema[] = localNeedSchemas
): VersionedNeed {
  const schema = requirePublishedSchema(input.schemaId, input.schemaVersion, registry);
  const completeness = evaluateNeedCompleteness(schema, input.answers, now);
  const status: NeedStatus = completeness.complete ? "ready_for_match" : "needs_clarification";
  const originalContentLanguage = assertSupportedLanguageCode(input.originalContentLanguage);
  const communicationLanguage = assertSupportedLanguageCode(input.communicationLanguage);
  const preferredResultLanguage = assertSupportedLanguageCode(input.preferredResultLanguage);
  const ownerUserProfileId = normalizeOwnerUserProfileId(input.ownerUserProfileId);
  const expectedResult = textAnswer(input.answers.expectedResult) ?? "Pending schema completion";
  const needInput: NeedInput = {
    direction: schema.direction,
    categoryId: schema.categoryId,
    title: input.title,
    description: input.description,
    expectedResult,
    ownerUserProfileId,
    schemaId: schema.schemaId,
    schemaVersion: schema.version,
    answers: cloneAnswers(input.answers),
    originalContentLanguage,
    communicationLanguage,
    preferredResultLanguage,
    priority: input.priority,
    tags: [...(input.tags ?? [])]
  };

  validateNeedInput(needInput);

  const timestamp = toIsoString(now);

  return {
    ...needInput,
    id: createId("need"),
    status,
    priority: needInput.priority ?? "normal",
    tags: needInput.tags ?? [],
    constraints: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    ownerUserProfileId,
    schemaId: schema.schemaId,
    schemaVersion: schema.version,
    aggregateVersion: 1,
    answers: cloneAnswers(input.answers),
    completeness,
    originalContentLanguage,
    communicationLanguage,
    preferredResultLanguage
  };
}

export function evaluateNeedCompleteness(
  schema: NeedSchema,
  answers: Record<string, unknown>,
  now: Date = new Date()
): NeedCompleteness {
  const missingFieldIds: string[] = [];
  const invalidFieldIds: string[] = [];
  const fieldById = new Map(schema.fields.map((field) => [field.id, field]));

  for (const field of schema.fields) {
    const value = answers[field.id];
    const required = isFieldRequired(field, answers);

    if (isMissing(value)) {
      if (required) {
        missingFieldIds.push(field.id);
      }
      continue;
    }

    if (!isValidFieldValue(field, value, answers, now)) {
      invalidFieldIds.push(field.id);
    }
  }

  for (const fieldId of Object.keys(answers).sort()) {
    if (!fieldById.has(fieldId)) {
      invalidFieldIds.push(fieldId);
    }
  }

  return {
    complete: missingFieldIds.length === 0 && invalidFieldIds.length === 0,
    missingFieldIds,
    invalidFieldIds
  };
}

export function findNeedSchema(
  schemaId: string,
  version: number,
  registry: readonly NeedSchema[] = localNeedSchemas
): NeedSchema | undefined {
  return registry.find((schema) => schema.schemaId === schemaId && schema.version === version);
}

export function requirePublishedSchema(
  schemaId: string,
  version: number,
  registry: readonly NeedSchema[] = localNeedSchemas
): NeedSchema {
  const schema = findNeedSchema(schemaId, version, registry);

  if (!schema) {
    throw new IntakeError("NEED_SCHEMA_NOT_FOUND", `Unknown NeedSchema ${schemaId}@${version}`);
  }

  if (schema.status !== "published") {
    throw new IntakeError(
      "NEED_SCHEMA_NOT_PUBLISHED",
      `NeedSchema ${schemaId}@${version} is not published`
    );
  }

  return schema;
}

export function assertNeedCanEnterMatching(need: Need): void {
  if (need.status !== "ready_for_match" && need.status !== "matched") {
    throw new IntakeError(
      "NEED_NOT_READY_FOR_MATCHING",
      `Need ${need.id} is not ready for matching`
    );
  }

  const completeness = (need as Partial<VersionedNeed>).completeness;

  if (completeness && !completeness.complete) {
    throw new IntakeError(
      "NEED_NOT_READY_FOR_MATCHING",
      `Need ${need.id} has incomplete intake`
    );
  }
}

function isFieldRequired(field: NeedSchemaField, answers: Record<string, unknown>): boolean {
  return Boolean(field.required || (field.requiredWhen && matchesCondition(field.requiredWhen, answers)));
}

function isValidFieldValue(
  field: NeedSchemaField,
  value: unknown,
  answers: Record<string, unknown>,
  now: Date
): boolean {
  if (field.invalidWhen && matchesCondition(field.invalidWhen.condition, answers)) {
    if (field.invalidWhen.forbiddenValues.includes(value)) {
      return false;
    }
  }

  switch (field.type) {
    case "short_text":
      return isValidText(value, field, 200);
    case "long_text":
      return isValidText(value, field, 5000);
    case "single_choice":
      return typeof value === "string" && Boolean(field.allowedValues?.includes(value));
    case "multiple_choice":
      return isValidMultipleChoice(value, field);
    case "boolean":
      return typeof value === "boolean" && isValidBooleanRules(value, field, answers);
    case "integer":
      return isValidInteger(value, field, answers);
    case "date":
    case "date_time":
      return isValidDateValue(value, field, now);
    case "language_code":
      return isValidLanguage(value);
  }
}

function isValidText(value: unknown, field: NeedSchemaField, defaultMaxLength: number): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const text = value.trim();
  const minLength = field.minLength ?? 1;
  const maxLength = field.maxLength ?? defaultMaxLength;

  return text.length >= minLength
    && text.length <= maxLength
    && !containsForbiddenContent(text, field.forbiddenContentKinds ?? []);
}

function isValidMultipleChoice(value: unknown, field: NeedSchemaField): boolean {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return false;
  }

  const uniqueValues = new Set(value);
  const minItems = field.minItems ?? 0;
  const maxItems = field.maxItems ?? Number.POSITIVE_INFINITY;

  return uniqueValues.size === value.length
    && value.length >= minItems
    && value.length <= maxItems
    && value.every((item) => field.allowedValues?.includes(item));
}

function isValidBooleanRules(
  value: boolean,
  field: NeedSchemaField,
  answers: Record<string, unknown>
): boolean {
  if (field.mustBeTrueWhen && matchesCondition(field.mustBeTrueWhen, answers)) {
    return value === true;
  }

  return true;
}

function isValidInteger(
  value: unknown,
  field: NeedSchemaField,
  answers: Record<string, unknown>
): boolean {
  if (!Number.isInteger(value)) {
    return false;
  }
  const integerValue = value as number;

  if (field.minValue !== undefined && integerValue < field.minValue) {
    return false;
  }

  if (field.maxValue !== undefined && integerValue > field.maxValue) {
    return false;
  }

  if (field.numericLimitByUnit) {
    const unit = answers[field.numericLimitByUnit.unitFieldId];

    if (typeof unit !== "string") {
      return false;
    }

    const max = field.numericLimitByUnit.maxByUnit[unit];

    if (max === undefined || integerValue > max) {
      return false;
    }
  }

  return true;
}

function isValidDateValue(value: unknown, field: NeedSchemaField, now: Date): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return !field.future || timestamp > now.getTime();
}

function isValidLanguage(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  try {
    assertSupportedLanguageCode(value);
    return true;
  } catch {
    return false;
  }
}

function matchesCondition(
  condition: NeedSchemaCondition,
  answers: Record<string, unknown>
): boolean {
  const value = answers[condition.fieldId];

  if (condition.equals !== undefined && value !== condition.equals) {
    return false;
  }

  if (condition.includes !== undefined) {
    if (!Array.isArray(value) || !value.includes(condition.includes)) {
      return false;
    }
  }

  if (condition.minItems !== undefined) {
    if (!Array.isArray(value) || value.length < condition.minItems) {
      return false;
    }
  }

  return true;
}

function containsForbiddenContent(
  text: string,
  kinds: readonly ForbiddenContentKind[]
): boolean {
  return kinds.some((kind) => forbiddenPattern(kind).test(text));
}

function forbiddenPattern(kind: ForbiddenContentKind): RegExp {
  switch (kind) {
    case "url":
      return /https?:\/\/|www\./i;
    case "email":
      return /[^\s@]+@[^\s@]+\.[^\s@]+/i;
    case "phone":
      return /\+?\d[\d\s().-]{7,}\d/;
    case "file":
      return /\b(file|attachment|cv|resume|pdf|docx|xlsx)\b/i;
    case "exact_address":
      return /\b(street|st\.|avenue|ave\.|apartment|apt\.)\b|дом\s*\d+|улиц[аеуы]|квартира|подъезд/i;
  }
}

function isMissing(value: unknown): boolean {
  return value === undefined
    || value === null
    || (typeof value === "string" && value.trim().length === 0)
    || (Array.isArray(value) && value.length === 0);
}

function textAnswer(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length >= 4 ? value.trim() : undefined;
}

function normalizeOwnerUserProfileId(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new IntakeError("NEED_OWNER_REQUIRED", "ownerUserProfileId is required");
  }

  return trimmed;
}

function cloneAnswers(answers: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(answers)) as Record<string, unknown>;
}

function shortText(
  id: string,
  options: Partial<NeedSchemaField> = {}
): NeedSchemaField {
  return {
    id,
    label: id,
    type: "short_text",
    ...options
  };
}

function longText(
  id: string,
  options: Partial<NeedSchemaField> = {}
): NeedSchemaField {
  return {
    id,
    label: id,
    type: "long_text",
    ...options
  };
}

function single(
  id: string,
  allowedValues: readonly string[],
  required = false,
  options: Partial<NeedSchemaField> = {}
): NeedSchemaField {
  return {
    id,
    label: id,
    type: "single_choice",
    required,
    allowedValues,
    ...options
  };
}

function multi(
  id: string,
  allowedValues: readonly string[],
  required = false,
  options: Partial<NeedSchemaField> = {}
): NeedSchemaField {
  return {
    id,
    label: id,
    type: "multiple_choice",
    required,
    allowedValues,
    ...options
  };
}

function booleanField(
  id: string,
  options: Partial<NeedSchemaField> = {}
): NeedSchemaField {
  return {
    id,
    label: id,
    type: "boolean",
    ...options
  };
}

function integer(
  id: string,
  options: Partial<NeedSchemaField> = {}
): NeedSchemaField {
  return {
    id,
    label: id,
    type: "integer",
    ...options
  };
}

function dateField(
  id: string,
  options: Partial<NeedSchemaField> = {}
): NeedSchemaField {
  return {
    id,
    label: id,
    type: "date",
    ...options
  };
}

function dateTime(
  id: string,
  options: Partial<NeedSchemaField> = {}
): NeedSchemaField {
  return {
    id,
    label: id,
    type: "date_time",
    ...options
  };
}

function languageField(id: string, required = false): NeedSchemaField {
  return {
    id,
    label: id,
    type: "language_code",
    required
  };
}

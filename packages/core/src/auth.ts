import {
  localIdentityIssuer,
  resolveIdentityRefFromTrustedMapping,
  type IdentityRef
} from "./identity.js";
import { toIsoString } from "./utils.js";

export const authRoleIds = ["client", "helper", "operator", "admin"] as const;

export type AuthRole = (typeof authRoleIds)[number];

export interface AuthRegistrationInput {
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
  readonly roles?: readonly AuthRole[];
}

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly AuthRole[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuthPrincipal {
  readonly id: string;
  readonly identityRef: IdentityRef;
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly AuthRole[];
}

export interface IntegrationIdentity {
  readonly provider: "cifedra";
  readonly identityRef: IdentityRef;
  readonly principal: AuthPrincipal;
  readonly claims: {
    readonly subject: string;
    readonly issuer: string;
    readonly identityRefId: string;
    readonly email: string;
    readonly name: string;
    readonly roles: readonly AuthRole[];
  };
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeAuthRoles(roles: readonly AuthRole[] = ["client"]): AuthRole[] {
  const uniqueRoles = [...new Set(roles)];

  return uniqueRoles.length > 0 ? uniqueRoles : ["client"];
}

export function validateAuthRegistrationInput(input: AuthRegistrationInput): void {
  if (!emailPattern.test(normalizeAuthEmail(input.email))) {
    throw new Error("Auth email is invalid");
  }

  if (input.displayName.trim().length < 2) {
    throw new Error("Auth displayName must contain at least 2 characters");
  }

  if (input.password.length < 8) {
    throw new Error("Auth password must contain at least 8 characters");
  }

  const unknownRole = input.roles?.find((role) => !authRoleIds.includes(role));

  if (unknownRole) {
    throw new Error(`Unknown auth role: ${unknownRole}`);
  }
}

export function createAuthUser(
  input: AuthRegistrationInput,
  id: string,
  now: Date = new Date()
): AuthUser {
  validateAuthRegistrationInput(input);

  const timestamp = toIsoString(now);

  return {
    id,
    email: normalizeAuthEmail(input.email),
    displayName: input.displayName.trim(),
    roles: normalizeAuthRoles(input.roles),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function toAuthPrincipal(user: AuthUser): AuthPrincipal {
  return {
    id: user.id,
    identityRef: buildAuthIdentityRef(user),
    email: user.email,
    displayName: user.displayName,
    roles: user.roles
  };
}

export function buildIntegrationIdentity(user: AuthUser): IntegrationIdentity {
  const principal = toAuthPrincipal(user);

  return {
    provider: "cifedra",
    identityRef: principal.identityRef,
    principal,
    claims: {
      subject: principal.id,
      issuer: localIdentityIssuer,
      identityRefId: principal.identityRef.id,
      email: principal.email,
      name: principal.displayName,
      roles: principal.roles
    }
  };
}

export function buildAuthIdentityRef(user: AuthUser): IdentityRef {
  return resolveIdentityRefFromTrustedMapping({
    issuer: localIdentityIssuer,
    subject: user.id,
    source: "local"
  });
}

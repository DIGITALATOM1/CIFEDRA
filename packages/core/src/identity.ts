import { createHash } from "node:crypto";

export const localIdentityIssuer = "cifedra-local";

export type IdentitySource = "local" | "oidc";

export interface TrustedIdentityMapping {
  readonly issuer: string;
  readonly subject: string;
  readonly source?: IdentitySource;
}

export interface IdentityRef {
  readonly id: string;
  readonly issuer: string;
  readonly subject: string;
  readonly source: IdentitySource;
}

export class IdentityError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function resolveIdentityRefFromTrustedMapping(
  mapping: TrustedIdentityMapping
): IdentityRef {
  const issuer = normalizeIdentityIssuer(mapping.issuer);
  const subject = validateOpaqueIdentityValue("subject", mapping.subject);
  const source = mapping.source ?? (issuer === localIdentityIssuer ? "local" : "oidc");

  if (source === "local" && issuer !== localIdentityIssuer) {
    throw new IdentityError("Local identity mapping must use cifedra-local issuer");
  }

  if (source === "oidc" && issuer === localIdentityIssuer) {
    throw new IdentityError("OIDC identity mapping must use an OIDC issuer");
  }

  return {
    id: createIdentityRefId(issuer, subject),
    issuer,
    subject,
    source
  };
}

export function createLocalIdentityRef(subject: string): IdentityRef {
  return resolveIdentityRefFromTrustedMapping({
    issuer: localIdentityIssuer,
    subject,
    source: "local"
  });
}

function createIdentityRefId(issuer: string, subject: string): string {
  const digest = createHash("sha256")
    .update(`${issuer}\u001f${subject}`)
    .digest("base64url")
    .slice(0, 24);

  return `idref_${digest}`;
}

function normalizeIdentityIssuer(issuer: string): string {
  const value = validateOpaqueIdentityValue("issuer", issuer);

  if (value === localIdentityIssuer) {
    return value;
  }

  return normalizeOidcIssuer(value);
}

function normalizeOidcIssuer(issuer: string): string {
  let url: URL;

  try {
    url = new URL(issuer);
  } catch {
    throw new IdentityError("OIDC issuer must be an absolute URI");
  }

  if (!url.protocol || !url.hostname) {
    throw new IdentityError("OIDC issuer must include scheme and host");
  }

  if (url.search || url.hash || url.username || url.password) {
    throw new IdentityError("OIDC issuer must not include query, fragment or credentials");
  }

  const schemeSeparator = issuer.indexOf("://");

  if (schemeSeparator <= 0) {
    throw new IdentityError("OIDC issuer must use scheme://host form");
  }

  const authorityStart = schemeSeparator + 3;
  const pathStart = findFirstPathSeparator(issuer, authorityStart);
  const authority = pathStart === -1
    ? issuer.slice(authorityStart)
    : issuer.slice(authorityStart, pathStart);
  const path = pathStart === -1 ? "" : issuer.slice(pathStart);

  if (!authority) {
    throw new IdentityError("OIDC issuer must include host");
  }

  return `${issuer.slice(0, schemeSeparator).toLowerCase()}://${authority.toLowerCase()}${path}`;
}

function findFirstPathSeparator(value: string, fromIndex: number): number {
  const separatorIndexes = ["/", "?", "#"]
    .map((separator) => value.indexOf(separator, fromIndex))
    .filter((index) => index !== -1);

  return separatorIndexes.length > 0 ? Math.min(...separatorIndexes) : -1;
}

function validateOpaqueIdentityValue(name: string, value: string): string {
  if (!value || value.trim() !== value) {
    throw new IdentityError(`Identity ${name} must not be empty or padded`);
  }

  if (/[\u0000-\u001F\u007F]/.test(value)) {
    throw new IdentityError(`Identity ${name} must not contain control characters`);
  }

  return value;
}

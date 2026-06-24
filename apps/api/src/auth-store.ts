import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import {
  buildIntegrationIdentity,
  createAuthUser,
  normalizeAuthEmail,
  toAuthPrincipal,
  type AuthPrincipal,
  type AuthRegistrationInput,
  type AuthUser,
  type IdentityRef,
  type IntegrationIdentity
} from "@cifedra/core";

interface StoredAuthUser extends AuthUser {
  readonly passwordSalt: string;
  readonly passwordHash: string;
}

interface StoredAuthSession {
  readonly tokenHash: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
}

interface AuthStoreData {
  readonly users: StoredAuthUser[];
  readonly sessions: StoredAuthSession[];
}

export interface AuthLoginInput {
  readonly email?: string;
  readonly password?: string;
}

export interface AuthSessionResponse {
  readonly token: string;
  readonly expiresAt: string;
  readonly user: AuthPrincipal;
  readonly identityRef: IdentityRef;
  readonly integrationIdentity: IntegrationIdentity;
}

export interface AuthContext {
  readonly user: AuthUser;
  readonly principal: AuthPrincipal;
  readonly identityRef: IdentityRef;
  readonly integrationIdentity: IntegrationIdentity;
}

export interface AuthStatus {
  readonly provider: "cifedra";
  readonly mode: "local-file";
  readonly storePath: string;
  readonly userCount: number;
  readonly activeSessionCount: number;
  readonly integrationPolicy: string;
}

const rootDir = new URL("../../..", import.meta.url).pathname;
const defaultAuthDir = join(rootDir, ".local", "auth");
const defaultAuthStorePath = join(defaultAuthDir, "store.json");
const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;

export async function getAuthStatus(): Promise<AuthStatus> {
  const data = await readStore();
  const activeSessions = data.sessions.filter((session) => !isExpired(session.expiresAt));

  if (activeSessions.length !== data.sessions.length) {
    await writeStore({
      ...data,
      sessions: activeSessions
    });
  }

  return {
    provider: "cifedra",
    mode: "local-file",
    storePath: ".local/auth/store.json",
    userCount: data.users.length,
    activeSessionCount: activeSessions.length,
    integrationPolicy:
      "CIFEDRA Auth is the source identity; integrated apps receive principal claims through adapters."
  };
}

export async function registerLocalUser(
  input: AuthRegistrationInput
): Promise<AuthSessionResponse> {
  if (input.roles?.some((role) => role !== "client")) {
    throw new AuthError(400, "Self-registration only supports the client role");
  }

  const data = await readStore();
  const email = normalizeAuthEmail(input.email);

  if (data.users.some((user) => user.email === email)) {
    throw new AuthError(409, "User already exists");
  }

  const password = input.password;
  const user = createAuthUser(
    {
      ...input,
      email,
      roles: ["client"]
    },
    `usr_${randomUUID()}`
  );
  const storedUser = withPassword(user, password);
  const session = createSession(storedUser.id);

  await writeStore({
    users: [...data.users, storedUser],
    sessions: [...purgeExpiredSessions(data.sessions), session.record]
  });

  return buildSessionResponse(storedUser, session.token, session.record.expiresAt);
}

export async function loginLocalUser(input: AuthLoginInput): Promise<AuthSessionResponse> {
  const email = normalizeAuthEmail(input.email ?? "");
  const password = input.password ?? "";
  const data = await readStore();
  const user = data.users.find((item) => item.email === email);

  if (!user || !verifyPassword(password, user)) {
    throw new AuthError(401, "Invalid email or password");
  }

  const session = createSession(user.id);
  const sessions = [...purgeExpiredSessions(data.sessions), session.record];

  await writeStore({
    ...data,
    sessions
  });

  return buildSessionResponse(user, session.token, session.record.expiresAt);
}

export async function getAuthContextFromHeader(
  authorizationHeader: string | string[] | undefined
): Promise<AuthContext | null> {
  const token = bearerToken(authorizationHeader);

  if (!token) {
    return null;
  }

  const data = await readStore();
  const tokenHash = hashToken(token);
  const session = data.sessions.find((item) => item.tokenHash === tokenHash);

  if (!session || isExpired(session.expiresAt)) {
    await writeStore({
      ...data,
      sessions: purgeExpiredSessions(data.sessions)
    });
    return null;
  }

  const user = data.users.find((item) => item.id === session.userId);

  if (!user) {
    return null;
  }
  const principal = toAuthPrincipal(user);

  return {
    user,
    principal,
    identityRef: principal.identityRef,
    integrationIdentity: buildIntegrationIdentity(user)
  };
}

export async function logoutLocalSession(
  authorizationHeader: string | string[] | undefined
): Promise<boolean> {
  const token = bearerToken(authorizationHeader);

  if (!token) {
    return false;
  }

  const data = await readStore();
  const tokenHash = hashToken(token);
  const sessions = data.sessions.filter((session) => session.tokenHash !== tokenHash);

  await writeStore({
    ...data,
    sessions
  });

  return sessions.length !== data.sessions.length;
}

export class AuthError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

function withPassword(user: AuthUser, password: string): StoredAuthUser {
  const passwordSalt = randomBytes(16).toString("base64url");

  return {
    ...user,
    passwordSalt,
    passwordHash: hashPassword(password, passwordSalt)
  };
}

function verifyPassword(password: string, user: StoredAuthUser): boolean {
  const expected = Buffer.from(user.passwordHash, "base64url");
  const actual = Buffer.from(hashPassword(password, user.passwordSalt), "base64url");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("base64url");
}

function createSession(userId: string): { token: string; record: StoredAuthSession } {
  const token = randomBytes(32).toString("base64url");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + sessionTtlMs);

  return {
    token,
    record: {
      tokenHash: hashToken(token),
      userId,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString()
    }
  };
}

function buildSessionResponse(
  user: AuthUser,
  token: string,
  expiresAt: string
): AuthSessionResponse {
  const principal = toAuthPrincipal(user);

  return {
    token,
    expiresAt,
    user: principal,
    identityRef: principal.identityRef,
    integrationIdentity: buildIntegrationIdentity(user)
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

function bearerToken(authorizationHeader: string | string[] | undefined): string | null {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

function purgeExpiredSessions(sessions: readonly StoredAuthSession[]): StoredAuthSession[] {
  return sessions.filter((session) => !isExpired(session.expiresAt));
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

async function readStore(): Promise<AuthStoreData> {
  try {
    const raw = await readFile(getAuthStorePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<AuthStoreData>;

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        users: [],
        sessions: []
      };
    }

    throw error;
  }
}

async function writeStore(data: AuthStoreData): Promise<void> {
  const authStorePath = getAuthStorePath();
  await mkdir(dirname(authStorePath), {
    recursive: true
  });
  await writeFile(authStorePath, `${JSON.stringify(data, null, 2)}\n`, {
    mode: 0o600
  });
}

function getAuthStorePath(): string {
  return process.env.CIFEDRA_AUTH_STORE_PATH ?? defaultAuthStorePath;
}

function isMissingFileError(error: unknown): boolean {
  return Boolean(
    error
      && typeof error === "object"
      && "code" in error
      && error.code === "ENOENT"
  );
}

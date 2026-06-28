import {
  acceptContactRequest,
  cancelContactRequest,
  declineContactRequest,
  expireContactRequest,
  type AuthPrincipal,
  type AuthRole,
  type ContactRequest,
  ContactRequestError
} from "@cifedra/core";

export interface ContactRequestTransactionalRepository {
  updateContactRequest(
    requestId: string,
    expectedAggregateVersion: number,
    transition: (current: ContactRequest) => ContactRequest
  ): Promise<ContactRequest>;
}

export interface ContactRequestTransitionCommand {
  readonly requestId: string;
  readonly expectedAggregateVersion: number;
  readonly actor: AuthPrincipal;
  readonly reason?: string;
  readonly now?: Date;
}

export interface ContactRequestTransitionResult {
  readonly contactRequest: ContactRequest;
  readonly audit: {
    readonly actorUserId: string;
    readonly action: "accept" | "decline" | "cancel" | "expire";
    readonly resourceId: string;
    readonly expectedAggregateVersion: number;
    readonly resultingAggregateVersion: number;
    readonly occurredAt: string;
  };
}

export class ContactRequestApplicationError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
  }
}

export class ContactRequestApplicationService {
  constructor(private readonly repository: ContactRequestTransactionalRepository) {}

  async accept(command: ContactRequestTransitionCommand): Promise<ContactRequestTransitionResult> {
    return this.transition(command, "accept", (current) => {
      assertProviderActor(command.actor, current);
      return acceptContactRequest(current, command.actor.id, command.now);
    });
  }

  async decline(command: ContactRequestTransitionCommand): Promise<ContactRequestTransitionResult> {
    return this.transition(command, "decline", (current) => {
      assertProviderActor(command.actor, current);
      return declineContactRequest(current, command.actor.id, command.reason, command.now);
    });
  }

  async cancel(command: ContactRequestTransitionCommand): Promise<ContactRequestTransitionResult> {
    return this.transition(command, "cancel", (current) => {
      assertClientActor(command.actor, current);
      return cancelContactRequest(current, command.actor.id, command.now);
    });
  }

  async expire(command: ContactRequestTransitionCommand): Promise<ContactRequestTransitionResult> {
    return this.transition(command, "expire", (current) => {
      assertSystemExpiryActor(command.actor);
      return expireContactRequest(current, command.now);
    });
  }

  private async transition(
    command: ContactRequestTransitionCommand,
    action: ContactRequestTransitionResult["audit"]["action"],
    transition: (current: ContactRequest) => ContactRequest
  ): Promise<ContactRequestTransitionResult> {
    validateTransitionCommand(command);

    try {
      const contactRequest = await this.repository.updateContactRequest(
        command.requestId,
        command.expectedAggregateVersion,
        transition
      );

      return {
        contactRequest,
        audit: {
          actorUserId: command.actor.id,
          action,
          resourceId: contactRequest.id,
          expectedAggregateVersion: command.expectedAggregateVersion,
          resultingAggregateVersion: contactRequest.aggregateVersion,
          occurredAt: contactRequest.updatedAt
        }
      };
    } catch (error) {
      throw mapApplicationError(error);
    }
  }
}

function validateTransitionCommand(command: ContactRequestTransitionCommand): void {
  if (!command.requestId.trim()) {
    throw new ContactRequestApplicationError(
      400,
      "CONTACT_REQUEST_ID_REQUIRED",
      "Contact request id is required"
    );
  }

  if (
    !Number.isInteger(command.expectedAggregateVersion) ||
    command.expectedAggregateVersion <= 0
  ) {
    throw new ContactRequestApplicationError(
      400,
      "CONTACT_REQUEST_EXPECTED_VERSION_REQUIRED",
      "expectedAggregateVersion must be a positive integer"
    );
  }
}

function assertClientActor(actor: AuthPrincipal, request: ContactRequest): void {
  assertHasRole(actor, "client");

  if (actor.id !== request.clientUserProfileId) {
    throw new ContactRequestApplicationError(
      403,
      "CONTACT_REQUEST_FORBIDDEN",
      "Only the Need owner can cancel contact request"
    );
  }
}

function assertProviderActor(actor: AuthPrincipal, request: ContactRequest): void {
  assertHasRole(actor, "helper");

  if (actor.id !== request.providerProfileId) {
    throw new ContactRequestApplicationError(
      403,
      "CONTACT_REQUEST_FORBIDDEN",
      "Only the selected provider can respond to contact request"
    );
  }
}

function assertSystemExpiryActor(actor: AuthPrincipal): void {
  if (actor.roles.includes("operator") || actor.roles.includes("admin")) {
    return;
  }

  throw new ContactRequestApplicationError(
    403,
    "CONTACT_REQUEST_FORBIDDEN",
    "Only operator/admin local worker role can expire contact requests"
  );
}

function assertHasRole(actor: AuthPrincipal, role: AuthRole): void {
  if (actor.roles.includes(role)) {
    return;
  }

  throw new ContactRequestApplicationError(
    403,
    "CONTACT_REQUEST_FORBIDDEN",
    `Contact request action requires ${role} role`
  );
}

function mapApplicationError(error: unknown): Error {
  if (error instanceof ContactRequestApplicationError) {
    return error;
  }

  if (error instanceof ContactRequestError) {
    if (error.code === "CONTACT_REQUEST_FORBIDDEN") {
      return new ContactRequestApplicationError(403, error.code, error.message);
    }

    return new ContactRequestApplicationError(409, error.code, error.message);
  }

  if (isNamedError(error, "RepositoryNotFoundError")) {
    return new ContactRequestApplicationError(
      404,
      "CONTACT_REQUEST_NOT_FOUND",
      getErrorMessage(error)
    );
  }

  if (isNamedError(error, "RepositoryConflictError")) {
    return new ContactRequestApplicationError(
      409,
      "CONTACT_REQUEST_VERSION_CONFLICT",
      getErrorMessage(error)
    );
  }

  return error instanceof Error ? error : new Error(String(error));
}

function isNamedError(error: unknown, name: string): boolean {
  return error instanceof Error && error.constructor.name === name;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type IntegrationKind = "tasks" | "chat";

export type IntegrationLicenseKind = "oss-permissive" | "oss-copyleft" | "source-available";

export type IntegrationRuntime = "docker-compose";

export interface IntegrationEndpoint {
  readonly label: string;
  readonly url: string;
  readonly purpose: string;
}

export interface IntegrationDefinition {
  readonly id: string;
  readonly name: string;
  readonly kind: IntegrationKind;
  readonly role: string;
  readonly decision: string;
  readonly license: string;
  readonly licenseKind: IntegrationLicenseKind;
  readonly runtime: IntegrationRuntime;
  readonly localUrl: string;
  readonly endpoints: readonly IntegrationEndpoint[];
  readonly integrationPattern: readonly string[];
  readonly prototypeScope: readonly string[];
  readonly notes: readonly string[];
  readonly sources: readonly string[];
}

export const integrationDefinitions: readonly IntegrationDefinition[] = [
  {
    id: "plane",
    name: "Plane CE",
    kind: "tasks",
    role: "Tasks / project workbench for Life, Work and Skills execution flows.",
    decision:
      "Use as the first local task-management integration: issues, cycles, modules, docs and execution tracking.",
    license: "AGPL-3.0",
    licenseKind: "oss-copyleft",
    runtime: "docker-compose",
    localUrl: "http://localhost:8082",
    endpoints: [
      {
        label: "Web UI",
        url: "http://localhost:8082",
        purpose: "Manual validation of projects, tasks and queues."
      }
    ],
    integrationPattern: [
      "CIFEDRA creates a task when a need requires managed execution.",
      "Plane stores lifecycle, assignee, priority and status.",
      "CIFEDRA keeps matching, brief and result quality in the core domain."
    ],
    prototypeScope: [
      "Open local Plane workspace from the console.",
      "Map CIFEDRA directions to Plane projects or modules.",
      "Prepare API contract for task creation after local service is running."
    ],
    notes: [
      "Copyleft license is acceptable for a modifiable local prototype, but distribution and SaaS plans need a separate legal review.",
      "Runs outside CIFEDRA core to keep replacement possible."
    ],
    sources: [
      "https://github.com/makeplane/plane",
      "https://developers.plane.so/self-hosting/methods/docker-compose"
    ]
  },
  {
    id: "chatwoot",
    name: "Chatwoot CE",
    kind: "chat",
    role: "Concierge / support chat for communication with helpers, experts and operators.",
    decision:
      "Use as the first local chat integration: inboxes, conversations and operator-assisted communication.",
    license: "MIT",
    licenseKind: "oss-permissive",
    runtime: "docker-compose",
    localUrl: "http://localhost:8083",
    endpoints: [
      {
        label: "Web UI",
        url: "http://localhost:8083",
        purpose: "Manual validation of inboxes and conversations."
      }
    ],
    integrationPattern: [
      "CIFEDRA prepares context and contact brief.",
      "Chatwoot stores the conversation and operator workflow.",
      "Conversation outcomes are written back to CIFEDRA result tracking."
    ],
    prototypeScope: [
      "Open local Chatwoot workspace from the console.",
      "Prepare concierge conversation model for selected match.",
      "Prepare API contract for conversation creation after local service is running."
    ],
    notes: [
      "MIT license is favorable for modification and integration.",
      "Keep account, inbox and token settings outside git in .local."
    ],
    sources: [
      "https://developers.chatwoot.com/self-hosted/deployment/docker",
      "https://developers.chatwoot.com/self-hosted/faq"
    ]
  }
];

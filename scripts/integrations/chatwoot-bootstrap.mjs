import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const rootDir = new URL("../..", import.meta.url).pathname;
const chatwootDir = join(rootDir, ".local", "integrations", "chatwoot");
const bootstrapPath = join(chatwootDir, "bootstrap.json");
const cifedraEnvPath = join(chatwootDir, "cifedra.env");

if (!existsSync(join(chatwootDir, "docker-compose.yaml")) || !existsSync(join(chatwootDir, ".env"))) {
  throw new Error(
    "Chatwoot local config is missing. Run npm run integrations:install first."
  );
}

const dockerPath = findDocker();

if (!dockerPath) {
  throw new Error("Docker CLI is not available. Run npm run docker:install first.");
}

const existingBootstrap = readJson(bootstrapPath);
const bootstrapConfig = {
  adminEmail: process.env.CIFEDRA_CHATWOOT_ADMIN_EMAIL
    ?? existingBootstrap?.admin?.email
    ?? "admin@cifedra.local",
  adminName: process.env.CIFEDRA_CHATWOOT_ADMIN_NAME
    ?? existingBootstrap?.admin?.name
    ?? "CIFEDRA Admin",
  adminPassword: process.env.CIFEDRA_CHATWOOT_ADMIN_PASSWORD
    ?? existingBootstrap?.admin?.password
    ?? generatePassword(),
  accountName: process.env.CIFEDRA_CHATWOOT_ACCOUNT_NAME
    ?? existingBootstrap?.account?.name
    ?? "CIFEDRA Local",
  inboxName: process.env.CIFEDRA_CHATWOOT_INBOX_NAME
    ?? existingBootstrap?.inbox?.name
    ?? "CIFEDRA Concierge",
  contactName: process.env.CIFEDRA_CHATWOOT_CONTACT_NAME
    ?? existingBootstrap?.contact?.name
    ?? "CIFEDRA Test Contact",
  contactEmail: process.env.CIFEDRA_CHATWOOT_CONTACT_EMAIL
    ?? existingBootstrap?.contact?.email
    ?? "client@cifedra.local",
  baseUrl: process.env.CIFEDRA_CHATWOOT_BASE_URL
    ?? existingBootstrap?.baseUrl
    ?? "http://localhost:8083"
};

const railsBootstrapScript = String.raw`
require "json"

admin_email = ENV.fetch("CIFEDRA_BOOTSTRAP_ADMIN_EMAIL")
admin_name = ENV.fetch("CIFEDRA_BOOTSTRAP_ADMIN_NAME")
admin_password = ENV.fetch("CIFEDRA_BOOTSTRAP_ADMIN_PASSWORD")
account_name = ENV.fetch("CIFEDRA_BOOTSTRAP_ACCOUNT_NAME")
inbox_name = ENV.fetch("CIFEDRA_BOOTSTRAP_INBOX_NAME")
contact_name = ENV.fetch("CIFEDRA_BOOTSTRAP_CONTACT_NAME")
contact_email = ENV.fetch("CIFEDRA_BOOTSTRAP_CONTACT_EMAIL")
channel_identifier = "cifedra-local-api"
contact_source_id = "cifedra-local-contact"

result = ActiveRecord::Base.transaction do
  user = User.find_or_initialize_by(email: admin_email)
  user.name = admin_name
  user.display_name = admin_name if user.respond_to?(:display_name=)
  user.provider = "email" if user.respond_to?(:provider=) && user.provider.blank?
  user.uid = admin_email if user.respond_to?(:uid=) && user.uid.blank?
  user.password = admin_password
  user.password_confirmation = admin_password

  if user.respond_to?(:skip_confirmation!)
    user.skip_confirmation!
  elsif user.respond_to?(:confirmed_at=)
    user.confirmed_at ||= Time.current
  end

  user.save!
  token = user.access_token || user.create_access_token

  account = Account.find_or_create_by!(name: account_name)

  account_user = AccountUser.find_or_initialize_by(account_id: account.id, user_id: user.id)
  account_user.role = :administrator
  account_user.availability = :online if account_user.respond_to?(:availability=)
  account_user.save!

  channel = Channel::Api.find_or_initialize_by(identifier: channel_identifier)
  channel.account = account
  channel.webhook_url = ""
  channel.hmac_mandatory = false if channel.respond_to?(:hmac_mandatory=)
  channel.additional_attributes ||= {}
  channel.save!

  inbox = channel.inbox || Inbox.find_or_initialize_by(
    account_id: account.id,
    channel_id: channel.id,
    channel_type: "Channel::Api"
  )
  inbox.account = account
  inbox.channel = channel
  inbox.name = inbox_name
  inbox.enable_auto_assignment = false if inbox.respond_to?(:enable_auto_assignment=)
  inbox.timezone = "UTC" if inbox.respond_to?(:timezone=) && inbox.timezone.blank?
  inbox.save!

  InboxMember.find_or_create_by!(inbox_id: inbox.id, user_id: user.id)

  contact = Contact.find_or_initialize_by(account_id: account.id, email: contact_email)
  contact.name = contact_name
  contact.identifier ||= "cifedra-local-contact"
  contact.save!

  contact_inbox = ContactInboxBuilder.new(
    contact: contact,
    inbox: inbox,
    source_id: contact_source_id
  ).perform

  ::Redis::Alfred.delete(::Redis::Alfred::CHATWOOT_INSTALLATION_ONBOARDING)

  {
    admin: {
      id: user.id,
      email: user.email
    },
    apiToken: token.token,
    account: {
      id: account.id,
      name: account.name
    },
    inbox: {
      id: inbox.id,
      name: inbox.name,
      channelType: inbox.channel_type
    },
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email
    },
    contactInbox: {
      id: contact_inbox.id,
      sourceId: contact_inbox.source_id
    },
    installation: {
      onboardingRequired: ::Redis::Alfred.get(::Redis::Alfred::CHATWOOT_INSTALLATION_ONBOARDING).present?
    }
  }
end

puts "CIFEDRA_BOOTSTRAP_RESULT=#{result.to_json}"
`;

const output = execFileSync(
  dockerPath,
  [
    "compose",
    "run",
    "--rm",
    "-e",
    `CIFEDRA_BOOTSTRAP_ADMIN_EMAIL=${bootstrapConfig.adminEmail}`,
    "-e",
    `CIFEDRA_BOOTSTRAP_ADMIN_NAME=${bootstrapConfig.adminName}`,
    "-e",
    `CIFEDRA_BOOTSTRAP_ADMIN_PASSWORD=${bootstrapConfig.adminPassword}`,
    "-e",
    `CIFEDRA_BOOTSTRAP_ACCOUNT_NAME=${bootstrapConfig.accountName}`,
    "-e",
    `CIFEDRA_BOOTSTRAP_INBOX_NAME=${bootstrapConfig.inboxName}`,
    "-e",
    `CIFEDRA_BOOTSTRAP_CONTACT_NAME=${bootstrapConfig.contactName}`,
    "-e",
    `CIFEDRA_BOOTSTRAP_CONTACT_EMAIL=${bootstrapConfig.contactEmail}`,
    "rails",
    "bundle",
    "exec",
    "rails",
    "runner",
    railsBootstrapScript
  ],
  {
    cwd: chatwootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"]
  }
);

const result = parseBootstrapResult(output);
const bootstrapRecord = {
  generatedAt: new Date().toISOString(),
  baseUrl: bootstrapConfig.baseUrl,
  admin: {
    id: result.admin.id,
    email: bootstrapConfig.adminEmail,
    name: bootstrapConfig.adminName,
    password: bootstrapConfig.adminPassword
  },
  account: result.account,
  inbox: result.inbox,
  contact: result.contact,
  contactInbox: result.contactInbox,
  installation: result.installation
};

mkdirSync(chatwootDir, {
  recursive: true
});
writeFileSync(bootstrapPath, `${JSON.stringify(bootstrapRecord, null, 2)}\n`, {
  mode: 0o600
});
chmodSync(bootstrapPath, 0o600);

writeFileSync(cifedraEnvPath, buildCifedraEnv(result, bootstrapConfig.baseUrl), {
  mode: 0o600
});
chmodSync(cifedraEnvPath, 0o600);

console.log("[ok] Chatwoot local bootstrap is ready.");
console.log(`- Admin email: ${bootstrapConfig.adminEmail}`);
console.log(`- Account ID: ${result.account.id}`);
console.log(`- Inbox ID: ${result.inbox.id}`);
console.log(`- Contact ID: ${result.contact.id}`);
console.log("- CIFEDRA env: .local/integrations/chatwoot/cifedra.env");
console.log("- Login details: .local/integrations/chatwoot/bootstrap.json");
console.log("[next] Run npm run local:restart so the API picks up Chatwoot live settings.");

function buildCifedraEnv(result, baseUrl) {
  return [
    "# Generated by npm run integrations:chatwoot:bootstrap. Do not commit.",
    "CIFEDRA_INTEGRATIONS_LIVE=1",
    `CIFEDRA_CHATWOOT_BASE_URL=${baseUrl}`,
    `CIFEDRA_CHATWOOT_API_TOKEN=${result.apiToken}`,
    `CIFEDRA_CHATWOOT_ACCOUNT_ID=${result.account.id}`,
    `CIFEDRA_CHATWOOT_INBOX_ID=${result.inbox.id}`,
    `CIFEDRA_CHATWOOT_CONTACT_ID=${result.contact.id}`,
    ""
  ].join("\n");
}

function parseBootstrapResult(output) {
  const line = output
    .split(/\r?\n/)
    .find((item) => item.startsWith("CIFEDRA_BOOTSTRAP_RESULT="));

  if (!line) {
    throw new Error("Chatwoot bootstrap did not return a result payload.");
  }

  return JSON.parse(line.slice("CIFEDRA_BOOTSTRAP_RESULT=".length));
}

function readJson(path) {
  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function generatePassword() {
  return `Cifedra-${randomBytes(18).toString("base64url")}1!`;
}

function commandPath(command) {
  try {
    return execFileSync("sh", ["-lc", `command -v ${command}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function findDocker() {
  return commandPath("docker") ?? appBundleDocker();
}

function appBundleDocker() {
  const path = "/Applications/Docker.app/Contents/Resources/bin/docker";

  try {
    execFileSync(path, ["--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    return path;
  } catch {
    return null;
  }
}

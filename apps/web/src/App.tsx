import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  apiBaseUrl,
  createDemoMatch,
  getDirections,
  login,
  register,
  simulateEngagement,
  transitionEngagement,
  type AuthSessionResponse,
  type ContactRequest,
  type DemoMatchResponse,
  type DirectionDefinition,
  type Engagement,
  type MatchCandidate
} from "./api";
import { pilotScenarios, type PilotScenario } from "./scenarios";
import "./styles.css";

type LoadState = "idle" | "loading" | "ready" | "error";

const columnLabels = [
  "Ally Request",
  "AI Matching",
  "Proposed Allies",
  "Contact Request",
  "Messenger",
  "Engagement",
  "Result"
] as const;

export function App() {
  const [directions, setDirections] = useState<readonly DirectionDefinition[]>([]);
  const [catalogState, setCatalogState] = useState<LoadState>("idle");
  const [session, setSession] = useState<AuthSessionResponse | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState(pilotScenarios[1]?.id ?? "");
  const [match, setMatch] = useState<DemoMatchResponse | null>(null);
  const [acceptedContactRequest, setAcceptedContactRequest] = useState<ContactRequest | null>(null);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [email, setEmail] = useState(() => `client-${Date.now()}@cifedra.local`);
  const [displayName, setDisplayName] = useState("Игорь");
  const [password, setPassword] = useState("Password123!");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScenario = useMemo(
    () => pilotScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? pilotScenarios[0],
    [selectedScenarioId]
  );
  const selectedCandidate = useMemo(
    () => match?.matches.find((candidate) => candidate.profile.id === selectedProfileId)
      ?? match?.matches[0]
      ?? null,
    [match, selectedProfileId]
  );

  useEffect(() => {
    let ignore = false;

    setCatalogState("loading");
    getDirections()
      .then((items) => {
        if (ignore) {
          return;
        }

        setDirections(items);
        setCatalogState("ready");
      })
      .catch((caught: unknown) => {
        if (ignore) {
          return;
        }

        setCatalogState("error");
        setError(toErrorMessage(caught));
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleRegister() {
    setIsBusy(true);
    setError(null);

    try {
      const nextSession = await register({
        email,
        displayName,
        password
      });
      setSession(nextSession);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogin() {
    setIsBusy(true);
    setError(null);

    try {
      const nextSession = await login({
        email,
        password
      });
      setSession(nextSession);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRunMatch() {
    if (!selectedScenario) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const activeSession = session ?? await register({
        email,
        displayName,
        password
      });
      setSession(activeSession);

      const nextMatch = await createDemoMatch(activeSession.token, selectedScenario.input);
      setMatch(nextMatch);
      setAcceptedContactRequest(null);
      setEngagement(null);
      setSelectedProfileId(nextMatch.matches[0]?.profile.id ?? null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSimulateEngagement() {
    if (!session || !match?.firstContactRequest) {
      setError("Сначала запустите матчинг и получите ContactRequest.");
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const result = await simulateEngagement(session.token, {
        need: match.need,
        contactRequest: match.firstContactRequest,
        conversation: match.firstConversationDraft,
        brief: match.firstBrief
      });

      setAcceptedContactRequest(result.acceptedContactRequest);
      setEngagement(result.engagement);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleTransitionEngagement(action: "start" | "complete" | "cancel") {
    if (!session || !engagement) {
      setError("Сначала создайте Engagement.");
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const result = await transitionEngagement(session.token, {
        engagement,
        action,
        summary:
          action === "complete"
            ? "MVP-сценарий выполнен локально, результат зафиксирован в Markdown."
            : undefined,
        nextStep:
          action === "complete"
            ? "Проверить качество результата и решить, нужен ли follow-up."
            : undefined,
        reason: action === "cancel" ? "Cancelled in local MVP test." : undefined
      });

      setEngagement(result.engagement);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">C</span>
          <span>
            <strong>CIFEDRA Connect MVP</strong>
            <small>Life / Work / Skills local testing</small>
          </span>
        </a>
        <nav aria-label="MVP navigation">
          <a href="http://localhost:4177/web/landing/">Landing</a>
          <a href="http://localhost:4177/web/app/matching.html">Static Kanban</a>
          <a href={apiBaseUrl}>API</a>
        </nav>
      </header>

      <section className="hero" aria-labelledby="mvp-title">
        <div>
          <p className="eyebrow">Local MVP</p>
          <h1 id="mvp-title">Проверяем путь клиента от потребности до первого чата.</h1>
          <p>
            Это уже рабочий MVP-экран поверх локального API: авторизация, пилотные
            сценарии, matching, ContactRequest и preview встроенного мессенджера.
          </p>
        </div>
        <aside className="status-card" aria-label="Runtime status">
          <Metric label="API" value={apiBaseUrl.replace("http://", "")} />
          <Metric label="Catalog" value={catalogState === "ready" ? "online" : catalogState} />
          <Metric label="Session" value={session ? session.user.displayName : "guest"} />
        </aside>
      </section>

      {error ? <div className="error-banner" role="alert">{error}</div> : null}

      <section className="workspace">
        <aside className="panel control-panel" aria-label="MVP controls">
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRegister();
            }}
          >
            <div>
              <p className="eyebrow compact">1. Auth</p>
              <h2>Demo client</h2>
            </div>
            <label>
              <span>Имя</span>
              <input
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                autoComplete="username"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <div className="button-row">
              <button type="submit" disabled={isBusy}>
                Зарегистрировать
              </button>
              <button className="secondary" type="button" onClick={handleLogin} disabled={isBusy}>
                Войти
              </button>
            </div>
          </form>

          <div className="divider" />

          <div>
            <p className="eyebrow compact">2. Scenario</p>
            <h2>Пилот</h2>
          </div>
          <div className="scenario-list">
            {pilotScenarios.map((scenario) => (
              <button
                className={scenario.id === selectedScenarioId ? "scenario active" : "scenario"}
                key={scenario.id}
                type="button"
                onClick={() => setSelectedScenarioId(scenario.id)}
              >
                <span>{scenario.label}</span>
                <strong>{scenario.title}</strong>
              </button>
            ))}
          </div>
          <button className="run-button" type="button" onClick={handleRunMatch} disabled={isBusy}>
            {isBusy ? "Выполняю..." : "Запустить MVP матчинг"}
          </button>

          <div className="catalog-box">
            <p className="eyebrow compact">Catalog</p>
            <strong>{directions.length || "-"} directions</strong>
            <span>Life, Work, Skills подтягиваются из API.</span>
          </div>
        </aside>

        <section className="board-area" aria-label="Matching workflow">
          <Board
            acceptedContactRequest={acceptedContactRequest}
            engagement={engagement}
            isBusy={isBusy}
            match={match}
            scenario={selectedScenario}
            selectedCandidate={selectedCandidate}
            onCompleteEngagement={() => void handleTransitionEngagement("complete")}
            onSimulateEngagement={() => void handleSimulateEngagement()}
            onSelectCandidate={(candidate) => setSelectedProfileId(candidate.profile.id)}
            onStartEngagement={() => void handleTransitionEngagement("start")}
          />
          <MessengerPreview
            match={match}
            session={session}
            selectedCandidate={selectedCandidate}
            scenario={selectedScenario}
          />
        </section>
      </section>
    </main>
  );
}

function Board({
  acceptedContactRequest,
  engagement,
  isBusy,
  match,
  scenario,
  selectedCandidate,
  onCompleteEngagement,
  onSimulateEngagement,
  onSelectCandidate,
  onStartEngagement
}: {
  readonly acceptedContactRequest: ContactRequest | null;
  readonly engagement: Engagement | null;
  readonly isBusy: boolean;
  readonly match: DemoMatchResponse | null;
  readonly scenario: PilotScenario | undefined;
  readonly selectedCandidate: MatchCandidate | null;
  readonly onCompleteEngagement: () => void;
  readonly onSimulateEngagement: () => void;
  readonly onSelectCandidate: (candidate: MatchCandidate) => void;
  readonly onStartEngagement: () => void;
}) {
  return (
    <section className="kanban" aria-label="MVP kanban board">
      {columnLabels.map((column) => (
        <article className="column" key={column}>
          <header>
            <span>{column}</span>
            <strong>{columnCount(column, match, engagement)}</strong>
          </header>
          {renderColumnContent({
            acceptedContactRequest,
            column,
            engagement,
            isBusy,
            match,
            onCompleteEngagement,
            onSimulateEngagement,
            onSelectCandidate,
            onStartEngagement,
            scenario,
            selectedCandidate
          })}
        </article>
      ))}
    </section>
  );
}

function renderColumnContent({
  acceptedContactRequest,
  column,
  engagement,
  isBusy,
  match,
  onCompleteEngagement,
  onSimulateEngagement,
  onSelectCandidate,
  onStartEngagement,
  scenario,
  selectedCandidate
}: {
  readonly acceptedContactRequest: ContactRequest | null;
  readonly column: (typeof columnLabels)[number];
  readonly engagement: Engagement | null;
  readonly isBusy: boolean;
  readonly match: DemoMatchResponse | null;
  readonly onCompleteEngagement: () => void;
  readonly onSimulateEngagement: () => void;
  readonly onSelectCandidate: (candidate: MatchCandidate) => void;
  readonly onStartEngagement: () => void;
  readonly scenario: PilotScenario | undefined;
  readonly selectedCandidate: MatchCandidate | null;
}) {
  if (column === "Ally Request") {
    const need = match?.need ?? scenario?.input;

    return (
      <Card title={need?.title ?? "Выберите сценарий"} meta={need?.direction ?? "draft"}>
        <p>{need?.description ?? "Запрос появится после запуска MVP матчинга."}</p>
        <TagRow tags={need?.tags ?? []} />
      </Card>
    );
  }

  if (column === "AI Matching") {
    return match ? (
      <div className="stack">
        {match.matches.map((candidate) => (
          <button
            className={
              selectedCandidate?.profile.id === candidate.profile.id
                ? "candidate-card active"
                : "candidate-card"
            }
            key={candidate.profile.id}
            type="button"
            onClick={() => onSelectCandidate(candidate)}
          >
            <span>{candidate.recommendedAction}</span>
            <strong>{candidate.profile.displayName}</strong>
            <small>{candidate.score}% · {candidate.profile.role}</small>
          </button>
        ))}
      </div>
    ) : (
      <Empty text="Запустите сценарий, чтобы получить shortlist." />
    );
  }

  if (column === "Proposed Allies") {
    return selectedCandidate ? (
      <Card title={selectedCandidate.profile.displayName} meta={selectedCandidate.profile.role}>
        <p>{selectedCandidate.profile.summary}</p>
        <ScoreBreakdown candidate={selectedCandidate} />
      </Card>
    ) : (
      <Empty text="Кандидат появится после матчинга." />
    );
  }

  if (column === "Contact Request") {
    const request = acceptedContactRequest ?? match?.firstContactRequest;

    return request ? (
      <Card title={request.status} meta={`version ${request.aggregateVersion}`}>
        <p>Запрос контакта создан. Таймаут ответа исполнителя: 48 часов.</p>
        <dl className="mini-list">
          <div>
            <dt>Expires</dt>
            <dd>{request.expiresAt ? formatDate(request.expiresAt) : "not set"}</dd>
          </div>
          <div>
            <dt>Hidden</dt>
            <dd>{request.disclosureSnapshot.hiddenFields.length} sensitive fields</dd>
          </div>
        </dl>
        <button
          className="card-button"
          type="button"
          onClick={onSimulateEngagement}
          disabled={isBusy || request.status === "accepted"}
        >
          {request.status === "accepted" ? "Contact accepted" : "Accept -> Engagement"}
        </button>
      </Card>
    ) : (
      <Empty text="ContactRequest появится после requested_contact decision." />
    );
  }

  if (column === "Messenger") {
    return match?.firstBrief ? (
      <Card title="Direct product chat" meta="target channel">
        <p>{match.firstBrief.goal}</p>
        <TagRow tags={["client name", "request description", "no direct contacts"]} />
      </Card>
    ) : (
      <Empty text="Чат подготовится после ContactRequest." />
    );
  }

  if (column === "Engagement") {
    if (!engagement) {
      return <Empty text="Engagement создается после принятого ContactRequest." />;
    }

    return (
      <Card title={engagement.status} meta={`version ${engagement.aggregateVersion}`}>
        <p>{engagement.executionBrief.nextStep}</p>
        <dl className="mini-list">
          <div>
            <dt>Planned</dt>
            <dd>{formatDate(engagement.plannedAt)}</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>{engagement.resultArtifactFormat}</dd>
          </div>
        </dl>
        <div className="card-actions">
          <button
            className="card-button"
            type="button"
            onClick={onStartEngagement}
            disabled={isBusy || engagement.status !== "planned"}
          >
            Start
          </button>
          <button
            className="card-button secondary"
            type="button"
            onClick={onCompleteEngagement}
            disabled={isBusy || engagement.status !== "in_progress"}
          >
            Complete MD
          </button>
        </div>
      </Card>
    );
  }

  if (column === "Result" && engagement?.status === "completed") {
    return (
      <Card title="Markdown result" meta="completed">
        <p>{engagement.resultArtifact?.title ?? engagement.title}</p>
        <pre className="artifact-preview">{engagement.resultArtifact?.content}</pre>
      </Card>
    );
  }

  return (
    <Card title="Markdown result" meta="Work MVP baseline">
      <p>
        После контакта результат фиксируется как Markdown: summary, risks,
        recommendations, next step и quality score.
      </p>
    </Card>
  );
}

function MessengerPreview({
  match,
  session,
  selectedCandidate,
  scenario
}: {
  readonly match: DemoMatchResponse | null;
  readonly session: AuthSessionResponse | null;
  readonly selectedCandidate: MatchCandidate | null;
  readonly scenario: PilotScenario | undefined;
}) {
  const requestDescription = match?.need.description ?? scenario?.input.description ?? "";
  const displayName = session?.user.displayName ?? "Client";

  return (
    <section className="messenger" aria-labelledby="messenger-title">
      <div>
        <p className="eyebrow compact">3. Built-in messenger</p>
        <h2 id="messenger-title">Первый контакт без раскрытия контактов</h2>
        <p>
          Целевой канал MVP: `direct_product_chat`. До mutual match показываем
          имя клиента и описание работы, но не телефон, email и точный адрес.
        </p>
      </div>
      <div className="chat-window">
        <div className="message system">
          <strong>CIFEDRA</strong>
          <p>
            Подготовлен безопасный intro между {displayName} и{" "}
            {selectedCandidate?.profile.displayName ?? "подходящим союзником"}.
          </p>
        </div>
        <div className="message">
          <strong>{displayName}</strong>
          <p>{requestDescription || "Описание работы появится после выбора сценария."}</p>
        </div>
        <div className="message ally">
          <strong>{selectedCandidate?.profile.displayName ?? "Ally"}</strong>
          <p>{match?.firstConversationDraft?.firstMessage ?? "Готов обсудить задачу после принятия ContactRequest."}</p>
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  meta,
  children
}: {
  readonly title: string;
  readonly meta: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="card">
      <span>{meta}</span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }: { readonly text: string }) {
  return <div className="empty">{text}</div>;
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TagRow({ tags }: { readonly tags: readonly string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="tags">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}

function ScoreBreakdown({ candidate }: { readonly candidate: MatchCandidate }) {
  const items = Object.entries(candidate.explanation.scoreBreakdown)
    .filter(([key]) => key !== "total")
    .slice(0, 4);

  return (
    <dl className="score-grid">
      {items.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function columnCount(
  column: (typeof columnLabels)[number],
  match: DemoMatchResponse | null,
  engagement: Engagement | null
) {
  if (!match) {
    return "0";
  }

  switch (column) {
    case "Ally Request":
      return "1";
    case "AI Matching":
      return String(match.matches.length);
    case "Proposed Allies":
      return String(match.shortlist.items.length);
    case "Contact Request":
      return match.firstContactRequest ? "1" : "0";
    case "Messenger":
      return match.firstConversationDraft ? "1" : "0";
    case "Engagement":
      return engagement ? "1" : "0";
    case "Result":
      return engagement?.status === "completed" ? "MD" : "0";
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

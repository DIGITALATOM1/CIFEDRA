import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  apiBaseUrl,
  createDemoMatch,
  getDirections,
  login,
  register,
  type AuthSessionResponse,
  type DemoMatchResponse,
  type DirectionDefinition,
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
  "Result"
] as const;

export function App() {
  const [directions, setDirections] = useState<readonly DirectionDefinition[]>([]);
  const [catalogState, setCatalogState] = useState<LoadState>("idle");
  const [session, setSession] = useState<AuthSessionResponse | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState(pilotScenarios[1]?.id ?? "");
  const [match, setMatch] = useState<DemoMatchResponse | null>(null);
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
      setSelectedProfileId(nextMatch.matches[0]?.profile.id ?? null);
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
          <div>
            <p className="eyebrow compact">1. Auth</p>
            <h2>Demo client</h2>
          </div>
          <label>
            <span>Имя</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="button" onClick={handleRegister} disabled={isBusy}>
              Зарегистрировать
            </button>
            <button className="secondary" type="button" onClick={handleLogin} disabled={isBusy}>
              Войти
            </button>
          </div>

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
            match={match}
            scenario={selectedScenario}
            selectedCandidate={selectedCandidate}
            onSelectCandidate={(candidate) => setSelectedProfileId(candidate.profile.id)}
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
  match,
  scenario,
  selectedCandidate,
  onSelectCandidate
}: {
  readonly match: DemoMatchResponse | null;
  readonly scenario: PilotScenario | undefined;
  readonly selectedCandidate: MatchCandidate | null;
  readonly onSelectCandidate: (candidate: MatchCandidate) => void;
}) {
  return (
    <section className="kanban" aria-label="MVP kanban board">
      {columnLabels.map((column) => (
        <article className="column" key={column}>
          <header>
            <span>{column}</span>
            <strong>{columnCount(column, match)}</strong>
          </header>
          {renderColumnContent(column, match, scenario, selectedCandidate, onSelectCandidate)}
        </article>
      ))}
    </section>
  );
}

function renderColumnContent(
  column: (typeof columnLabels)[number],
  match: DemoMatchResponse | null,
  scenario: PilotScenario | undefined,
  selectedCandidate: MatchCandidate | null,
  onSelectCandidate: (candidate: MatchCandidate) => void
) {
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
    const request = match?.firstContactRequest;

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

function columnCount(column: (typeof columnLabels)[number], match: DemoMatchResponse | null) {
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
    case "Result":
      return "MD";
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

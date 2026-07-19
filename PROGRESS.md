# TaskFlow — Learning Journal & Progress Tracker

> **Read this first when you come back.** It's the "where am I, why am I doing this,
> and what's next" file. `README.md` is the how-to-use-the-repo doc; *this* is the
> learning narrative. We update the **Current status** + **Session log** after every phase.

---

## 🎯 Why this project exists

I'm a strong React/frontend dev getting genuinely good at **backend C# / .NET full-stack**.
My work codebase (Marineaid) is large and hard to learn architecture from, so this is a
small, deliberately *clean* greenfield project where I implement — not just read about —
the things in the *Clean Architecture* book:

- **SOLID** principles (each one pinned to a real spot in the code, not in the abstract)
- **Dependency Injection / Inversion of Control** ("DI / inverse DI")
- **Interfaces** in C# and why they're the backbone of clean design
- **Design patterns**: Repository, Unit of Work, Factory, (later) Strategy/Decorator, CQRS
- Clean Architecture layering + the **dependency rule**

The app (a task/project manager) is intentionally trivial. **The architecture is the point.**

## 🧭 How we work (the agreement)

- Claude builds **one layer at a time** and writes a short "why this, why here" note for each,
  naming the pattern/SOLID principle it demonstrates.
- I read, ask questions, tweak.
- **We don't advance to the next phase until the current one builds and I'm comfortable with the *why*.**

## 🛠️ Stack & key decisions

| Choice | Decision | Note |
|---|---|---|
| Runtime | **.NET 10.0.301 (LTS)** | Installed to `~/.dotnet` via `dotnet-install.sh` (no sudo). PATH set in `~/.bashrc` + `~/.profile`. |
| API | ASP.NET Core Web API, **controllers** (not Minimal API) | Layering stays explicit. |
| Architecture | **Clean Architecture** — Domain / Application / Infrastructure / Api | The dependency rule is compiler-enforced. |
| ORM / DB | **EF Core 10 + Npgsql + PostgreSQL 17** (Docker) | Docker Engine 29.6.0 installed. Start DB with `sg docker -c "docker compose -f /home/wolffo/Dev/TaskFlow/docker-compose.yml up -d postgres"` (the `sg docker` prefix borrows the docker group without a re-login). |
| Validation | FluentValidation | Phase 2. |
| Logging | Serilog | Phase 4. |
| API docs | `Microsoft.AspNetCore.OpenApi` (+ Swagger UI later) | .NET 10 dropped Swashbuckle from the template. |
| Tests | xUnit + NSubstitute + FluentAssertions | Phase 5. |
| Frontend | React 19 + Vite + TypeScript + TanStack Router/Query + XState (pnpm) | Feature-first Hexagonal Architecture; ASP.NET remains the single backend. |
| Authentication | Generic OIDC + ASP.NET `HttpOnly` cookie BFF; Keycloak locally | Provider details remain in the API adapter/configuration; TaskFlow uses its own internal user ID. |
| Solution file | **`.slnx`** (new XML format) | .NET 10 default. |

**Deferred on purpose** (introduced later as "upgrades" so I feel the problem they solve):
MediatR / CQRS, AutoMapper, Result pattern, Testcontainers, .NET Aspire.

## 📍 Current status

- **Done:** Phase 0 ✅, Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 ✅, Phase 5 ✅
- **In progress:** Phase 6 — provider-neutral authentication and user/project integration complete;
  tasks and full-stack application containers next.
- **Last updated:** 2026-07-19

## 🗺️ Roadmap & checklist

- [x] **Phase 0 — Toolchain + solution skeleton.** Install SDK, 6 projects wired with the
      dependency rule, docker-compose, gitignore, README, git init. *(Concepts: solution vs
      project, the dependency rule, the composition root.)*
- [x] **Phase 1 — Domain layer.** Rich `User`/`Project`/`TaskItem` entities (behavior +
      guarded invariants), a value object (`Email`), domain exceptions, repository **interfaces**.
      *(SRP, encapsulation, rich-vs-anemic models, interfaces as contracts, half of DIP.)*
- [x] **Phase 2 — Application layer.** Use-case services, DTOs (records) + manual mapping,
      FluentValidation, `IUnitOfWork`, application exceptions, `AddApplication()` DI extension.
      *(OCP, ISP, depend-on-abstractions, DI consumer side. Factory pattern discussed but
      deferred via YAGNI — static `Create` methods cover us until a real need appears.)*
- [x] **Phase 3 — Infrastructure layer.** EF Core `DbContext` (also implements `IUnitOfWork`),
      one `IEntityTypeConfiguration<T>` per entity, repository **implementations** (adapters),
      design-time factory, `AddInfrastructure()`, `InitialCreate` migration applied to live Postgres.
      *(Repository + Unit of Work, the payoff of DIP, entity→schema translation, value-object/enum
      persistence via converters. Kept Domain untouched — EF constructor binding instead of adding
      parameterless ctors.)*
- [x] **Phase 4 — Api layer.** Thin controllers, DI composition root (`AddApplication()` /
      `AddInfrastructure()`, service lifetimes), exception middleware → ProblemDetails, Serilog,
      Options pattern, Swagger UI. *(DI end-to-end, middleware, options.)*
- [x] **Phase 5 — Tests.** Pure domain tests; application tests with mocked repositories.
      *(Why DI makes code testable; LSP.)*
- [ ] **Phase 6 — React client + full-stack docker compose.**
- [ ] *Optional upgrades:* MediatR/CQRS, Result pattern, Decorator (caching/logging), Testcontainers.

## ⏯️ How to resume after a break

1. Read **Current status** above.
2. `cd /home/wolffo/Dev/TaskFlow && dotnet build backend/TaskFlow.slnx` — confirm it still compiles.
3. Skim the **Session log** entry for the last phase to recall the "why".
4. Tell Claude "continue with Phase N" (or `/loop`-style: "pick up where PROGRESS.md says").

## 📓 Session log

### 2026-07-19 — Phase 6c 🚧 Provider-neutral OIDC authentication
- Replaced the browser-selected development identity with a real OIDC authorization-code + PKCE
  flow owned by ASP.NET. React calls stable TaskFlow login/me/logout endpoints and never sees a
  provider SDK, access token, client secret, issuer, or subject.
- Added the frontend `AuthenticationGateway` port and HTTP adapter. The composition root now selects
  that adapter; the session service and XState machine model restore/sign-in/sign-out without caring
  which provider implements OIDC.
- Clarified the frontend object model: stateful antiforgery/authentication/project adapters and the
  session application service are constructor-injected classes implementing narrow contracts;
  `createAppRuntime()` remains the functional manual composition root, while React, mappings, and
  Query/XState configuration remain functional. Focused contexts expose dependencies, not a generic
  API service or service locator.
- Added `ExternalIdentity` plus a unique `(issuer, subject)` mapping to an internal TaskFlow `User`.
  First login provisions a user; later logins retain the TaskFlow ID and refresh profile data. Email
  remains profile data and is not the authentication key. A verified provider email may safely link
  a persisted pre-authentication user; an unverified duplicate is rejected.
- Added the Application-owned `ICurrentUser` port and ASP.NET claims adapter. Project requests no
  longer accept `ownerId`; project creation/listing derive it from the authenticated cookie.
- Protected project/task controllers and scoped project/task reads and mutations to the current
  owner, closing the authenticated cross-user IDOR path while returning 404 for concealed resources.
- Added centralized antiforgery token validation for every cookie-authenticated API write. Unauthorized
  API fetches return 401; only the explicit login endpoint challenges the OIDC provider.
- Added a local Keycloak Compose service and imported realm as a replaceable development adapter.
  Generic `Authentication:Oidc` settings can target another compliant provider.
- Logout uses an antiforgery-protected browser POST, clears the TaskFlow cookie, and completes the
  provider's OIDC end-session flow. Authenticated Query data and cached antiforgery tokens are cleared
  when the frontend crosses back to anonymous state.
- End-to-end smoke: login as the imported Ada account, auto-provision the internal user, create/list
  a server-owned project through Vite, reject a tokenless write with 400, then complete local and
  provider logout (`/api/auth/me`: 200 → 401; the next login requires credentials again).
- Verification: strict backend build passed with 48/48 tests; frontend lint, dependency rules,
  production build, and 10/10 tests passed; NuGet and pnpm reported no known vulnerabilities.
- Supersedes Phase 6b's temporary `UsersGateway`/`CurrentUserStorage` development identity. The
  original entry remains below as the learning history that motivated the authentication boundary.
- **Next:** integrate task Query/view models, fix string-enum representation in generated OpenAPI,
  then add API/frontend containers and the production reverse proxy.

### 2026-07-19 — Phase 6b 🚧 Frontend hexagon + first live vertical slice
- Documented the frontend dependency rule and state-ownership matrix in `frontend/ARCHITECTURE.md`.
  Features own domain/application/adapters/presentation layers; the `app` folder is the composition root.
- Generated TypeScript transport contracts from the live ASP.NET OpenAPI document and contained
  `openapi-fetch` plus Problem Details mapping inside HTTP adapters. Components never import wire DTOs.
- Added narrow `UsersGateway`, `ProjectsGateway`, and `CurrentUserStorage` ports with HTTP/localStorage
  adapters. The pure session service coordinates restore/create/clear and is tested with fake ports.
- Added an XState session workflow: restore stored user → anonymous/ready, create user → ready, stale
  IDs clear automatically, restore failures retry explicitly, and changing user clears local identity.
- Added TanStack Query only for project server state. `useProjectsPageModel` hides Query details and
  returns a feature-owned discriminated union consumed by the project page.
- Added Dependency Cruiser rules for inward layer dependencies and cycles; `pnpm architecture` now
  fails when frontend code violates the documented hexagonal boundaries.
- Connected the first real flow: create/restore a development user, list their projects, and create a
  project. Vite proxies `/api` to ASP.NET, avoiding a development CORS policy.
- Added seven Vitest tests for session orchestration, success/failure XState transitions, resilient
  sign-out behavior, and Problem Details mapping.
- Live smoke test created a user and project through `http://localhost:5173/api`, proving the Vite proxy,
  generated contract assumptions, API, Application layer, EF Core, and PostgreSQL work end to end.
- **Next:** expose the missing task transitions/contracts as needed, integrate task Query/view models,
  fix string-enum representation in generated OpenAPI before consuming task DTOs, then add containers.

### 2026-07-19 — Phase 6a 🚧 Repository split + frontend scaffold
- Reorganized the single repository into explicit `backend/` and `frontend/` application boundaries;
  moved the solution, `src/`, and `tests/` together so all internal .NET project references stay valid.
- Scaffolded the client with pnpm, React 19, TypeScript, and Vite. Added TanStack Router's file-based
  Vite plugin, a root layout, and one minimal index route; no API, Query, forms, or UI library yet.
- Chose TanStack Router without TanStack Start: TaskFlow already has an ASP.NET backend and does not
  currently need a second server runtime, SSR, server functions, or React API routes.
- Kept Docker Compose focused on PostgreSQL for this increment. API/frontend containers and the Vite
  `/api` development proxy belong to the next vertical slice.
- Verification: strict backend build produced **0 warnings/errors**, all **43 tests passed**, frontend
  lint and production build passed, and `docker compose config` validated the root Compose file.

### 2026-07-18 — Phase 5 ✅ Domain + Application unit tests
- Added xUnit tests with Apache-licensed FluentAssertions 7.2.2; Application tests use NSubstitute 6.0
  to replace repository and `IUnitOfWork` ports. No API, EF Core, PostgreSQL, or Docker is involved.
- **27 Domain tests:** email validation/canonicalization/value equality; user/project invariants and
  atomic failed mutations; deterministic project creation; task defaults, assignment, and the full
  Todo/InProgress/Done state machine including idempotent completion and reopening.
- **16 Application tests:** create/get/list/complete/assign orchestration, DTO mapping, owner/project/
  assignee existence checks, validation short-circuiting, and negative assertions such as “never save
  after a conflict or missing dependency.”
- Replaced hidden `DateTimeOffset.UtcNow` reads with explicit .NET `TimeProvider` dependencies.
  Production DI registers `TimeProvider.System`; tests supply a tiny fixed provider and assert exact
  timestamps without sleeping or using flaky time ranges.
- This demonstrates the practical payoff of DIP and LSP: NSubstitute implementations stand in for the
  real EF adapters because they obey the same interfaces, while services remain unchanged.
- Coverage run: Domain suite ~90% line / ~74% branch; Application suite ~75% line / 50% branch (the
  latter includes untested validators/mappings and transitive code, so coverage remains a guide, not a goal).
- Rebuilt and smoke-tested the live API after the clock refactor; DI resolved `TimeProvider` and existing
  project/task reads still succeeded against PostgreSQL.
- `dotnet build --warnaserror` → **0 warnings, 0 errors**; `dotnet test` → **43/43 passed**; NuGet audit
  → no known vulnerable packages.
- **Learned:** arrange/act/assert; fact vs theory; state-based vs interaction-based testing; substitutes
  at architectural boundaries; testing failure paths and absence of side effects; deterministic clocks;
  tests as executable documentation rather than implementation-detail snapshots.

### 2026-07-18 — Phase 4 ✅ Api layer (controllers + composition root)
- Added thin `UsersController`, `ProjectsController`, and `TasksController`; the ten routes mirror
  existing Application service methods and never call repositories or Domain entities directly.
- `Program.cs` is now the real composition root: `AddApplication()` binds service interfaces,
  `AddInfrastructure()` binds repositories/`IUnitOfWork`, and ASP.NET constructor-injects the graph.
- Runtime connection string comes from `ConnectionStrings:TaskFlow` in development configuration and
  fails fast if absent. EF design-time commands continue to use Infrastructure's design-time factory.
- Added one `IExceptionHandler`: FluentValidation/Domain → 400, not found → 404, conflict → 409,
  unknown → safe 500; all use RFC ProblemDetails with a trace id. Controllers need no `try/catch`.
- Added Serilog console + request logging, first-party OpenAPI generation, development-only Swagger UI,
  and string enum JSON (`"High"`, `"Todo"`) for a readable frontend contract.
- Used the built-in `ConnectionStrings` configuration convention instead of inventing an unused typed
  Options class; strongly typed `IOptions<T>` is deferred until Phase 6 introduces a real setting such
  as allowed frontend origins.
- Live PostgreSQL verification: created user → project → task, completed task (`Todo` → `Done`), listed
  projects, and exercised 400/404/409 responses. Swagger and `/openapi/v1.json` both served successfully.
- Verified EF translates the `Email` value-object lookup to SQL. Found and fixed a real mismatch:
  Domain equality was case-insensitive while PostgreSQL text uniqueness was case-sensitive; `Email.Create`
  now stores one lowercase canonical form, aligning equality, queries, and the unique index.
- Strict build exposed and fixed package issues: patched vulnerable `Microsoft.OpenApi` to 2.7.5 and made
  EF Core/Relational 10.0.9 direct Infrastructure dependencies to prevent transitive version drift.
- **Learned:** controller = HTTP adapter; `Program.cs` = composition root; DI resolves the complete object
  graph per request; middleware handles cross-cutting concerns once; ProblemDetails is the error DTO;
  OpenAPI describes the HTTP contract; logging observes the request without entering business code.
- `dotnet build --warnaserror` → **0 warnings, 0 errors.** Test projects build but remain empty by design
  until Phase 5.

### 2026-06-24 — Phase 3 ✅ Infrastructure layer (EF Core + Postgres)
- Installed Docker Engine 29.6.0; Postgres 17 running as `taskflow-postgres` (healthy on 5432).
  Driven from the agent shell via `sg docker -c "..."` (borrows docker group without a re-login).
- Packages: Npgsql.EntityFrameworkCore.PostgreSQL 10.0.2, Microsoft.EntityFrameworkCore.Design 10.0.9
  (PrivateAssets=all — build-time tool only), EFCore.NamingConventions 10.0.1.
- `TaskFlowDbContext : DbContext, IUnitOfWork` — EF's built-in `SaveChangesAsync` satisfies the
  `IUnitOfWork` port with zero extra code. DbSets: Users / Projects / Tasks.
- One `IEntityTypeConfiguration<T>` per entity (SRP for mapping): `Email` value object → single
  string column via `HasConversion`; enums → text via `HasConversion<string>`; unique index on
  `email`; indexes on `owner_id` / `project_id` / `assignee_id`. snake_case via the convention.
- Repository **implementations** = the ADAPTERS that plug into the Domain ports; they inject the
  concrete `TaskFlowDbContext`. `GetById*` tracked (load→mutate→save); `List*` `AsNoTracking` (read-only→DTO).
- `TaskFlowDbContextFactory : IDesignTimeDbContextFactory` so `dotnet ef` works before the Api exists.
- `AddInfrastructure(connectionString)`: `AddDbContext` (Scoped); `IUnitOfWork` → the SAME DbContext
  instance (shared change-tracker); 3 repos. Composition root proper is the Api in Phase 4.
- Generated `InitialCreate` **without touching the Domain** — EF constructor binding rebuilt entities
  through their private ctors (incl. value-converted `Email` + enums). Applied to live Postgres,
  verified tables/columns/indexes + `__EFMigrationsHistory` row in `psql`.
- **Learned:** entity→schema is a real translation done HERE (the migration is the proof, not the
  entity); Repository + Unit of Work are the payoff of DIP (adapters fulfil inner-layer ports);
  migrations are versioned + reversible (`Up`/`Down`); value-object & enum persistence via converters;
  tracked vs `AsNoTracking`; the design-time factory.
- **Decisions:** enums as text (inspectable, reorder-safe); no cross-aggregate FK constraints, only
  indexes (integrity enforced in app/domain at the aggregate boundary); Domain left untouched.
- **Verified in Phase 4:** `u.Email == email` translates through the value converter to a parameterized
  PostgreSQL predicate; live testing also led to lowercase canonicalization for consistent uniqueness.

### 2026-06-21 — Phase 2 ✅ Application layer
- Added packages: FluentValidation 12.1.1 (+ DI extensions), Microsoft.Extensions.DependencyInjection.Abstractions 10.0.9.
- Per-feature folders `Users/`, `Projects/`, `Tasks/` + `Common/` (`IUnitOfWork`, `NotFoundException`, `ConflictException`).
- DTOs as `record`s (immutable, value-equality), kept separate from entities; manual `ToDto()` mappings (no AutoMapper).
- FluentValidation validators in their own classes (OCP); services inject `IValidator<T>` and call `ValidateAndThrowAsync`.
- Use-case services `UserService`/`ProjectService`/`TaskService` (+ interfaces): constructor-inject
  ONLY interfaces (repos from Domain, `IUnitOfWork`, validators). Pattern: validate → enforce
  app rules (uniqueness, cross-aggregate existence) → call domain `Create`/behavior → repo.Add +
  `uow.SaveChanges` → return DTO. Domain rules stay in entities (`task.Complete()`); services orchestrate.
- `DependencyInjection.AddApplication()` registers services (Scoped) + validators by assembly scan.
- `dotnet build -warnaserror` → **0 warnings, 0 errors.**
- **Learned:** rules-in-Domain vs orchestration-in-Application made concrete; DTOs & why they're
  separate from entities; FluentValidation = OCP; per-aggregate services/repos = ISP; the
  *consumer* side of DI (ctor takes interfaces, never `new`s a concrete); layered exceptions
  (NotFound→404, Conflict→409, mapped in Phase 4); per-layer DI registration extension.
- **Decisions:** repository interfaces kept in Domain, `IUnitOfWork` in Application (orchestration
  concern). Exposed domain enums in DTOs (simple coupling, noted). Used exceptions over a Result
  pattern for now (Result is a deferred upgrade). Skipped a standalone Factory class (YAGNI).

### 2026-06-20 — Phase 1 ✅ Domain layer
- Built `TaskFlow.Domain` (zero dependencies). Folders: `Common/`, `Entities/`, `ValueObjects/`,
  `Enums/`, `Exceptions/`, `Repositories/`.
- `Entity` base (identity equality) + `ValueObject` base (value equality) — the DDD distinction.
- `Email` value object: private ctor + static `Create` factory that validates → can't hold an invalid email.
- Rich entities `User`, `Project`, `TaskItem`: private setters, static `Create` factories,
  behavior methods. `TaskItem` enforces a Todo→InProgress→Done state machine via `Start/Complete/Reopen`.
- `DomainException` for invariant violations (no HTTP/DB knowledge in the core).
- Repository **interfaces** (`IUserRepository`, `IProjectRepository`, `ITaskItemRepository`) = ports;
  implementations come in Phase 3.
- `dotnet build -warnaserror` → **0 warnings, 0 errors.**
- **Learned:** encapsulation & rich-vs-anemic models; "make illegal states unrepresentable" via
  factory + private ctor; entity (identity) vs value-object (value) equality; SRP (one focused
  type each); ISP (small per-aggregate repos); the *first half* of DIP — the core declares the
  interface it needs, an outer layer will implement it.
- **Resolved in Phase 5:** `DateTimeOffset.UtcNow` was replaced by explicit `TimeProvider` arguments;
  production uses the system provider and tests use deterministic fixed time.

### 2026-06-20 — Phase 0 ✅ Toolchain + skeleton
- Installed **.NET 10.0.301** SDK + `dotnet-ef` 10.0.9 (no sudo, into `~/.dotnet`).
- Created solution `TaskFlow.slnx` with 6 projects under `src/` and `tests/`.
- Wired references to enforce the dependency rule (Domain ← Application ← Infrastructure ← Api).
- Added `docker-compose.yml` (Postgres 17), `.gitignore`, `README.md`; `git init`.
- `dotnet build` → **0 warnings, 0 errors.**
- **Learned:** solution vs project; the dependency rule is *compiler-enforced* (Domain can't
  reference outward, so business rules can't get tangled in EF/HTTP); the Api is the
  *composition root* — the one place interfaces meet implementations (= Dependency Inversion made physical).

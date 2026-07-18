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
| Frontend | React + Vite + TypeScript | Phase 6 (my strength — light touch). |
| Solution file | **`.slnx`** (new XML format) | .NET 10 default. |

**Deferred on purpose** (introduced later as "upgrades" so I feel the problem they solve):
MediatR / CQRS, AutoMapper, Result pattern, Testcontainers, .NET Aspire.

## 📍 Current status

- **Done:** Phase 0 ✅, Phase 1 ✅, Phase 2 ✅, Phase 3 ✅
- **Next up:** Phase 4 — Api layer (thin controllers, composition root, exception middleware, Serilog, Swagger). **First fully runnable API.**
- **Last updated:** 2026-06-24

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
- [ ] **Phase 4 — Api layer.** Thin controllers, DI composition root (`AddApplication()` /
      `AddInfrastructure()`, service lifetimes), exception middleware → ProblemDetails, Serilog,
      Options pattern, Swagger UI. *(DI end-to-end, middleware, options.)*
- [ ] **Phase 5 — Tests.** Pure domain tests; application tests with mocked repositories.
      *(Why DI makes code testable; LSP.)*
- [ ] **Phase 6 — React client + full-stack docker compose.**
- [ ] *Optional upgrades:* MediatR/CQRS, Result pattern, Decorator (caching/logging), Testcontainers.

## ⏯️ How to resume after a break

1. Read **Current status** above.
2. `cd /home/wolffo/Dev/TaskFlow && dotnet build` — confirm it still compiles.
3. Skim the **Session log** entry for the last phase to recall the "why".
4. Tell Claude "continue with Phase N" (or `/loop`-style: "pick up where PROGRESS.md says").

## 📓 Session log

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
- **To verify in Phase 4 (live API):** the `u.Email == email` LINQ translation through the value
  converter in `GetByEmailAsync` — couldn't exercise it without a running query.

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
- **Open question for later:** `DateTimeOffset.UtcNow` inside entities is a hidden clock
  dependency → revisit with `TimeProvider` in Phase 5.

### 2026-06-20 — Phase 0 ✅ Toolchain + skeleton
- Installed **.NET 10.0.301** SDK + `dotnet-ef` 10.0.9 (no sudo, into `~/.dotnet`).
- Created solution `TaskFlow.slnx` with 6 projects under `src/` and `tests/`.
- Wired references to enforce the dependency rule (Domain ← Application ← Infrastructure ← Api).
- Added `docker-compose.yml` (Postgres 17), `.gitignore`, `README.md`; `git init`.
- `dotnet build` → **0 warnings, 0 errors.**
- **Learned:** solution vs project; the dependency rule is *compiler-enforced* (Domain can't
  reference outward, so business rules can't get tangled in EF/HTTP); the Api is the
  *composition root* — the one place interfaces meet implementations (= Dependency Inversion made physical).

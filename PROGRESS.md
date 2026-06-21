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
| ORM / DB | **EF Core + Npgsql + PostgreSQL** (Docker) | `docker compose up -d postgres`. **Docker not installed yet — do this in Phase 3.** |
| Validation | FluentValidation | Phase 2. |
| Logging | Serilog | Phase 4. |
| API docs | `Microsoft.AspNetCore.OpenApi` (+ Swagger UI later) | .NET 10 dropped Swashbuckle from the template. |
| Tests | xUnit + NSubstitute + FluentAssertions | Phase 5. |
| Frontend | React + Vite + TypeScript | Phase 6 (my strength — light touch). |
| Solution file | **`.slnx`** (new XML format) | .NET 10 default. |

**Deferred on purpose** (introduced later as "upgrades" so I feel the problem they solve):
MediatR / CQRS, AutoMapper, Result pattern, Testcontainers, .NET Aspire.

## 📍 Current status

- **Done:** Phase 0 ✅, Phase 1 ✅
- **Next up:** Phase 2 — Application layer
- **Last updated:** 2026-06-20

## 🗺️ Roadmap & checklist

- [x] **Phase 0 — Toolchain + solution skeleton.** Install SDK, 6 projects wired with the
      dependency rule, docker-compose, gitignore, README, git init. *(Concepts: solution vs
      project, the dependency rule, the composition root.)*
- [x] **Phase 1 — Domain layer.** Rich `User`/`Project`/`TaskItem` entities (behavior +
      guarded invariants), a value object (`Email`), domain exceptions, repository **interfaces**.
      *(SRP, encapsulation, rich-vs-anemic models, interfaces as contracts, half of DIP.)*
- [ ] **Phase 2 — Application layer.** Use-case services, DTOs + manual mapping,
      FluentValidation, `IUnitOfWork`, a Factory. *(OCP, ISP, Factory, depend-on-abstractions.)*
- [ ] **Phase 3 — Infrastructure layer.** EF Core `DbContext`, entity configs, repository
      **implementations**, `UnitOfWork`, first migration, Postgres in Docker. *(Repository +
      Unit of Work, the payoff of DIP.)*
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

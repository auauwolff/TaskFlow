# TaskFlow

A small task/project manager built **from scratch** as a hands-on way to learn
backend C# / .NET the _clean_ way: Clean Architecture, SOLID, dependency
injection, interfaces, and the common design patterns — each one introduced
where it actually earns its keep, not in the abstract.

The app itself is deliberately simple (`User` → `Project` → `TaskItem`). The
point is the _architecture_, not the features.

## Stack

- **.NET 10** (LTS) + **ASP.NET Core Web API** (controllers)
- **EF Core** + **Npgsql** + **PostgreSQL** (in Docker)
- **FluentValidation**, **Serilog**, **OpenAPI/Swagger**
- **xUnit** + **NSubstitute** + **FluentAssertions**
- **React 19** + **Vite** + **TypeScript** + **TanStack Router/Query** + **XState** (pnpm)

## Architecture — the dependency rule

Dependencies only ever point **inward**. The inner layers know nothing about the
outer ones.

```
        ┌─────────────────────────────────────────┐
        │  Api  (controllers, DI composition root) │   ← references everything
        │   ┌─────────────────────────────────┐    │
        │   │ Infrastructure (EF Core, repos) │    │   ← implements Application/Domain interfaces
        │   │   ┌─────────────────────────┐   │    │
        │   │   │ Application (use cases) │   │    │   ← orchestrates the domain
        │   │   │   ┌─────────────────┐   │   │    │
        │   │   │   │ Domain (core)   │   │   │    │   ← entities + rules, ZERO dependencies
        │   │   │   └─────────────────┘   │   │    │
        │   │   └─────────────────────────┘   │    │
        │   └─────────────────────────────────┘    │
        └─────────────────────────────────────────┘
```

| Project                   | Depends on                  | Responsibility                                                      |
| ------------------------- | --------------------------- | ------------------------------------------------------------------- |
| `TaskFlow.Domain`         | _(nothing)_                 | Entities, value objects, domain rules, repository **interfaces**.   |
| `TaskFlow.Application`    | Domain                      | Use-case services, DTOs, validators, infrastructure **interfaces**. |
| `TaskFlow.Infrastructure` | Application, Domain         | EF Core `DbContext`, repository **implementations**, migrations.    |
| `TaskFlow.Api`            | Application, Infrastructure | Controllers, DI wiring (composition root), middleware.              |

The references are enforced by the compiler: if `Domain` ever tried to reference
`Infrastructure`, the build would fail. The constraint _is_ the lesson.

## Getting started

```bash
# 1. Build the backend
dotnet build backend/TaskFlow.slnx

# 2. Start Postgres
docker compose up -d postgres

# 3. Apply migrations
dotnet ef database update --project backend/src/TaskFlow.Infrastructure --startup-project backend/src/TaskFlow.Infrastructure

# 4. Run the API
dotnet run --project backend/src/TaskFlow.Api

# 5. Run the backend tests
dotnet test backend/TaskFlow.slnx

# 6. Install and run the frontend (in another terminal)
pnpm --dir frontend install
pnpm --dir frontend dev
```

## Repository layout

```text
TaskFlow/
├── backend/     # .NET solution, production projects, and tests
├── frontend/    # React/Vite client
└── docker-compose.yml
```

The frontend applies feature-first Hexagonal Architecture. See
[`frontend/ARCHITECTURE.md`](frontend/ARCHITECTURE.md) for its dependency rule, state ownership,
transport boundary, and replaceability decisions.

## Learning roadmap

- **Phase 0** ✅ Toolchain + solution skeleton (the dependency rule).
- **Phase 1** Domain layer — rich entities, value objects, repository interfaces.
- **Phase 2** Application layer — use-case services, DTOs, validation, factory.
- **Phase 3** Infrastructure — EF Core + Postgres, repositories, migrations.
- **Phase 4** ✅ Api — thin controllers, DI composition root, ProblemDetails, Serilog, Swagger.
- **Phase 5** ✅ Tests — pure Domain tests and Application tests with substituted ports.
- **Phase 6** 🚧 React + TypeScript client, full-stack `docker compose`.

opencode -s ses_08c0511e5ffee3HP24O2WSWcck

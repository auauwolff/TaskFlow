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
- React + Vite + TypeScript client (added later)

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
# 1. Build everything
dotnet build

# 2. Start Postgres (Phase 3+)
docker compose up -d postgres

# 3. Apply migrations (Phase 3+)
dotnet ef database update --project src/TaskFlow.Infrastructure --startup-project src/TaskFlow.Infrastructure

# 4. Run the API (Phase 4+)
dotnet run --project src/TaskFlow.Api

# 5. Run the tests
dotnet test
```

## Learning roadmap

- **Phase 0** ✅ Toolchain + solution skeleton (the dependency rule).
- **Phase 1** Domain layer — rich entities, value objects, repository interfaces.
- **Phase 2** Application layer — use-case services, DTOs, validation, factory.
- **Phase 3** Infrastructure — EF Core + Postgres, repositories, migrations.
- **Phase 4** ✅ Api — thin controllers, DI composition root, ProblemDetails, Serilog, Swagger.
- **Phase 5** ✅ Tests — pure Domain tests and Application tests with substituted ports.
- **Phase 6** React + TypeScript client, full-stack `docker compose`.

cld --resume 4e7be066-adaa-4849-a79d-9c6384c22142

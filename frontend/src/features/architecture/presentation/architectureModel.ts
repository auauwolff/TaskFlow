import {
  edge,
  file,
  node,
  type ExplorerGraph,
  type ExplorerNodeData,
  type ExplorerView,
} from './explorer/explorerGraph'

/**
 * TaskFlow's architecture graph — the only file you rewrite when copying `explorer/` into another
 * repository. Everything here is content: which views exist, what is on them, and why each node
 * earns its place. The explorer itself knows none of it.
 */

export type ArchitectureViewId =
  | 'overview'
  | 'frontend'
  | 'frontend-nutshell'
  | 'frontend-composition'
  | 'frontend-session'
  | 'frontend-projects'
  | 'frontend-tasks'
  | 'backend'
  | 'backend-api'
  | 'backend-application'
  | 'backend-domain'
  | 'backend-infrastructure'
  | 'sign-in'
  | 'di-inversion'
  | 'di-inversion-without'

type ArchitectureView = ExplorerView<ArchitectureViewId>

const browser: ExplorerNodeData = {
  label: 'Frontend application',
  kind: 'Frontend',
  level: 'Project',
  description: 'React application containing routing, feature slices, state ownership, transport adapters, and its composition root.',
  technology: 'React 19 / TypeScript / Vite',
  responsibility: 'Depends on the API contract, never on backend implementation details.',
  sourcePath: 'frontend/src',
  drilldown: 'frontend',
}

const api: ExplorerNodeData = {
  label: 'Backend solution',
  kind: 'Backend',
  level: 'Project',
  description: 'Four .NET projects implementing API delivery, application use cases, domain rules, and persistence adapters.',
  technology: 'ASP.NET Core / .NET 10',
  responsibility: 'Dependencies point from outer projects toward the domain core.',
  sourcePath: 'backend',
  drilldown: 'backend',
}

const primaryViewOrder: ArchitectureViewId[] = ['overview', 'frontend', 'backend', 'sign-in', 'di-inversion']

const architectureViews: Record<ArchitectureViewId, ArchitectureView> = {
  overview: {
    id: 'overview', label: 'Full stack', eyebrow: 'Repository map / 01', title: 'The codebase at a glance.',
    description: 'Start with deployable parts and their dependencies. Open the frontend or backend to navigate all the way down to layers, modules, and files.',
    nodes: [
      node('frontend', 0, 170, browser),
      node('backend', 390, 170, api),
      node('database', 790, 170, {
        label: 'PostgreSQL', kind: 'Data', level: 'System', technology: 'PostgreSQL 17',
        description: 'Durable storage for internal users, identity links, projects, and tasks.',
        responsibility: 'Only Infrastructure reaches the database; the core sees repository interfaces.',
        sourcePath: 'backend/src/TaskFlow.Infrastructure/Persistence', drilldown: 'backend-infrastructure',
      }),
      node('oidc', 390, -100, {
        label: 'OIDC provider', kind: 'External', level: 'System', technology: 'OpenID Connect / Keycloak locally',
        description: 'Replaceable external identity system used by the API through the OIDC standard.',
        responsibility: 'Provider details and tokens stop at the backend.', sourcePath: 'infra/keycloak',
      }),
    ],
    edges: [
      edge('frontend-backend', 'frontend', 'backend', 'typed same-origin /api'),
      edge('backend-database', 'backend', 'database', 'Infrastructure / EF Core'),
      edge('backend-oidc', 'backend', 'oidc', 'OIDC code + PKCE'),
    ],
  },

  frontend: {
    id: 'frontend', parent: 'overview', label: 'Frontend', eyebrow: 'Frontend / projects and slices', title: 'Feature-first ports and adapters.',
    description: 'Open composition to inspect DI, or open a feature to follow its domain, application port, adapter, presentation, and concrete files.',
    nodes: [
      node('composition', 0, 70, {
        label: 'Runtime composition', kind: 'Composition', level: 'Module', technology: 'src/app + main.tsx',
        description: 'Builds the typed service graph from shared and feature-owned registrations, then boots the generated route tree.',
        responsibility: 'Assemble infrastructure and feature composition modules before React renders.', sourcePath: 'frontend/src/app', drilldown: 'frontend-composition',
      }),
      node('routes', 330, 70, {
        label: 'Routes', kind: 'Presentation', level: 'Module', technology: 'TanStack Router',
        description: 'Public and authenticated route modules compose feature presentation.',
        responsibility: 'Own shareable URL state and route-level composition.', sourcePath: 'frontend/src/routes',
      }),
      node('session', 680, -100, {
        label: 'Session feature', kind: 'Application', level: 'Module', technology: 'domain / application / adapters / presentation',
        description: 'Provider-neutral session restoration, sign-in, sign-out, and authenticated cache cleanup.',
        responsibility: 'Own authentication use cases, and publish exactly one importable surface: index.ts.', sourcePath: 'frontend/src/features/session', drilldown: 'frontend-session',
      }),
      node('projects', 680, 170, {
        label: 'Projects feature', kind: 'Application', level: 'Module', technology: 'domain / application / adapters / presentation',
        description: 'Project list, detail, creation, and the HTTP gateway.',
        responsibility: 'Own the project capability. Its identity vocabulary is borrowed from the kernel, not declared here.', sourcePath: 'frontend/src/features/projects', drilldown: 'frontend-projects',
      }),
      node('tasks', 680, 440, {
        label: 'Tasks feature', kind: 'Application', level: 'Module', technology: 'domain / application / adapters / presentation',
        description: 'Task list, creation, assignment, completion, and transport mapping.',
        responsibility: 'Name projects and users through the kernel; reach session only through its front door.', sourcePath: 'frontend/src/features/tasks', drilldown: 'frontend-tasks',
      }),
      node('shared', 1050, 170, {
        label: 'Shared infrastructure', kind: 'Adapter', level: 'Module', technology: 'OpenAPI / GraphQL / cache policy',
        description: 'Typed REST and GraphQL transports, antiforgery policy, generated schema, and shared error normalization.',
        responsibility: 'May not import app or feature code.', sourcePath: 'frontend/src/shared',
      }),
      // The feature axis made visible. Without this node the graph implies features borrow
      // vocabulary from each other, which is exactly the coupling the kernel was extracted to end.
      node('kernel', 1050, 440, {
        label: 'Shared identity kernel', kind: 'Domain', level: 'Module', technology: 'shared/domain',
        description: 'UserId and ProjectId: the words more than one feature must agree on so they can describe the same thing, owned by none of them.',
        responsibility: 'Holds vocabulary, never behaviour. It may not import a transport, a cache, or the container.',
        sourcePath: 'frontend/src/shared/domain',
      }),
    ],
    edges: [
      // Booting the router and handing it the built resolver is instance flow at startup —
      // nothing is registered along this edge, so it is runtime (green), not registration (pink).
      edge('composition-routes', 'composition', 'routes', 'boots + provides services', 'runtime'),
      edge('composition-session', 'composition', 'session', 'adds module', 'registers'),
      edge('composition-projects', 'composition', 'projects', 'adds module', 'registers'),
      edge('composition-tasks', 'composition', 'tasks', 'adds module', 'registers'),
      // Tasks registers twice: its singleton gateway at the root (edge above, like every feature)
      // plus a per-project scoped view store added by the $projectId route's ServiceScopeProvider.
      edge('routes-tasks-scope', 'routes', 'tasks', 'adds workspace scope', 'registers', { intoBelow: true }),
      edge('routes-session', 'routes', 'session', 'renders / reads'),
      edge('routes-projects', 'routes', 'projects', 'renders'),
      edge('routes-tasks', 'routes', 'tasks', 'renders'),
      edge('session-shared', 'session', 'shared', 'HTTP + Query'),
      edge('projects-shared', 'projects', 'shared', 'HTTP + Query'),
      edge('tasks-shared', 'tasks', 'shared', 'GraphQL + Query'),
      // There is no tasks -> projects edge. Tasks name a ProjectId constantly, but they take that
      // word from the kernel, so the two features never touch. The single surviving feature-to-
      // feature dependency in the codebase is the one below, and it goes through index.ts.
      edge('tasks-session', 'tasks', 'session', 'useCurrentUser, via index.ts'),
      edge('session-kernel', 'session', 'kernel', 'UserId'),
      edge('projects-kernel', 'projects', 'kernel', 'ProjectId + UserId'),
      edge('tasks-kernel', 'tasks', 'kernel', 'ProjectId + UserId'),
    ],
  },

  'frontend-nutshell': {
    id: 'frontend-nutshell', parent: 'frontend', label: 'In a nutshell', eyebrow: 'Frontend / the pattern', title: 'Every feature is this shape.',
    description: 'The frontend with the features removed: one anonymous slice and the machinery that serves it. Session, projects, and tasks are each a copy of this shape — only the names, the transport, and an optional route scope differ.',
    nodes: [
      node('screen', 0, 60, {
        label: 'A screen', kind: 'Presentation', level: 'Module', technology: 'React component',
        description: 'Renders the view model and translates user gestures into feature intent. Owns no server state, no transport, and no domain rules.',
        responsibility: 'The only place that knows about pixels.',
      }),
      node('hook', 460, 60, {
        label: 'A view-model hook', kind: 'State', level: 'Module', technology: 'TanStack Query / MobX',
        description: 'The slice orchestrator: resolves the gateway instance through the token, runs the query or mutation, and maps domain objects into a render-ready view model.',
        responsibility: 'The one line of DI a consumer ever pays: useService(token).',
      }),
      node('port', 960, 60, {
        label: 'The port', kind: 'Application', level: 'Module', technology: 'TypeScript interface',
        description: 'A contract stating what the slice needs, in its own vocabulary — list, get, create — with no mention of HTTP or GraphQL. Both static arrow systems converge here.',
        responsibility: 'The line dependency inversion is drawn across.',
      }),
      node('domain', 1420, 60, {
        label: 'The domain model', kind: 'Domain', level: 'Module', technology: 'Branded types + validation',
        description: 'The slice vocabulary: branded IDs, validated values, real dates. Wire data is converted once at the adapter; everything inward trusts these types.',
        responsibility: 'No React, no transport, no framework.',
      }),
      node('adapter', 960, -280, {
        label: 'The adapter', kind: 'Adapter', level: 'Module', technology: 'REST or GraphQL gateway',
        description: 'Implements the port using a shared transport and converts wire data into domain models at the trust boundary. Swapping it is invisible to every consumer.',
        responsibility: 'The only file where slice intent becomes a protocol.',
      }),
      node('transport', 1420, -280, {
        label: 'Shared transports', kind: 'Adapter', level: 'Module', technology: 'openapi-fetch / GraphQL client',
        description: 'Typed REST and GraphQL clients with CSRF and 401 policy baked in. Registered once as root singletons; they move bytes and know nothing about any feature.',
        responsibility: 'Generic transport written once, reused by every adapter.', sourcePath: 'frontend/src/shared',
      }),
      node('token', 460, 340, {
        label: 'The token', kind: 'Token', level: 'Module', technology: 'unique symbol',
        description: 'The runtime name of the port, needed because interfaces are erased at compile time. Registration stores a factory under it; the hook resolves an instance by it.',
        responsibility: 'Where the static and runtime arrow systems meet.',
      }),
      node('app-composition', 640, 640, {
        label: 'composition.ts', kind: 'Composition', level: 'File', technology: 'src/app/composition.ts',
        description: 'The app root: registers the shared singletons, invokes each feature module, and builds the container before React renders.',
        responsibility: 'Knows that slices participate, never what they register.', sourcePath: 'frontend/src/app/composition.ts',
      }),
      node('feature-module', 1080, 640, {
        label: 'A feature module', kind: 'Composition', level: 'Module', technology: 'addXModule(services)',
        description: 'One function deciding which adapter satisfies the slice port — the only file that names both. A slice needing per-route state adds a second, scoped registration mounted by a ServiceScopeProvider.',
        responsibility: 'Each slice owns its object graph.',
      }),
      node('container', 1520, 640, {
        label: 'The container', kind: 'Composition', level: 'Module', technology: 'shared/ioc',
        description: 'Runs every factory eagerly, caches instances by token, enforces lifetimes, and reaches React through one context provider — so render-time resolution is a pure cache read.',
        responsibility: 'Holds instances; knows no feature.', sourcePath: 'frontend/src/shared/ioc/core.ts',
      }),
    ],
    edges: [
      // The static system: everything converges inward on the port and the domain vocabulary.
      edge('screen-hook', 'screen', 'hook', 'reads the view model'),
      edge('hook-port', 'hook', 'port', 'calls the contract'),
      edge('hook-domain', 'hook', 'domain', 'maps into view state', 'imports', { intoBelow: true }),
      edge('port-domain', 'port', 'domain', 'speaks the vocabulary'),
      edge('adapter-port', 'adapter', 'port', 'implements', 'implements'),
      edge('adapter-domain', 'adapter', 'domain', 'wire data in, domain out'),
      edge('adapter-transport', 'adapter', 'transport', 'moves bytes'),
      // The wiring: factories recorded under tokens, no instances yet.
      edge('app-feature', 'app-composition', 'feature-module', 'adds the module', 'registers'),
      edge('feature-container', 'feature-module', 'container', 'records the factory', 'registers'),
      // The runtime system: the instance flows outward, opposite to the static arrows.
      edge('container-token', 'container', 'token', 'build() caches the instance', 'runtime', { fromBelow: true, intoBelow: true }),
      edge('token-hook', 'token', 'hook', 'useService(token) at render', 'runtime', { fromBelow: true, intoBelow: true }),
    ],
  },

  'frontend-composition': {
    id: 'frontend-composition', parent: 'frontend', label: 'Frontend DI', eyebrow: 'Frontend / composition root', title: 'Concrete dependencies are assembled once.',
    description: 'The app root assembles feature modules into a framework-neutral typed container. React publishes one immutable resolver.',
    nodes: [
      file('main', 0, 150, 'main.tsx', 'Composition', 'frontend/src/main.tsx', 'Creates the router and runtime, then mounts providers around RouterProvider.', 'Keep startup mechanics outside features.'),
      file('composition', 300, 0, 'composition.ts', 'Composition', 'frontend/src/app/composition.ts', 'Registers shared API infrastructure, invokes feature modules, and builds the service graph.', 'Know modules, not every feature adapter.', 'addSessionModule(registrations)'),
      file('providers', 300, 300, 'AppProviders.tsx', 'Composition', 'frontend/src/app/AppProviders.tsx', 'Publishes the IoC and Query providers and coordinates authenticated cache cleanup.', 'Framework providers remain explicit and stable.'),
      file('ioc-core', 630, -130, 'ioc/core.ts', 'Composition', 'frontend/src/shared/ioc/core.ts', 'Implements typed tokens, lifetimes, scopes, eager singleton validation, and dependency errors.', 'Remain framework-neutral and package-ready.'),
      file('ioc-react', 630, 130, 'ioc/react.tsx', 'Composition', 'frontend/src/shared/ioc/react.tsx', 'Bridges the immutable resolver through React 19 Context, useService, and inherited subtree scopes.', 'Root singletons flow globally; route or module providers isolate scoped services.'),
      file('route-tree', 630, 390, 'routeTree.gen.ts', 'Presentation', 'frontend/src/routeTree.gen.ts', 'Generated route registry consumed by main.tsx.', 'Generated output; route source files remain the editable contracts.'),
      file('api-client', 960, -280, 'client.ts', 'Adapter', 'frontend/src/shared/api/client.ts', 'Creates the typed OpenAPI client and centralizes the 401 callback.', 'Transport primitive shared by the REST gateways.'),
      file('graphql-client', 630, -380, 'graphql/client.ts', 'Adapter', 'frontend/src/shared/graphql/client.ts', 'Fetch-based GraphQL transport with the CSRF header and 401 policy baked into every request. Resolver errors are translated through the same code-to-AppError table the REST client uses, so a conflict is a conflict whichever transport reported it.', 'Transport primitive shared by the GraphQL gateways.', 'const failure = graphqlError(payload.errors)'),
      file('antiforgery', 1290, -300, 'antiforgery.ts', 'Adapter', 'frontend/src/shared/api/antiforgery.ts', 'Fetches and memoizes one CSRF token through the REST client.', 'One token fetch serves every mutating transport.'),
      file('project-route', 630, 620, 'projects.$projectId.tsx', 'Presentation', 'frontend/src/routes/_authenticated.projects.$projectId.tsx', 'Wraps the project workspace in a ServiceScopeProvider keyed by the selected project.', 'Scoped services live exactly as long as the workspace they serve.', 'ServiceScopeProvider scopeKey={selectedProjectId}'),
      file('session-module', 960, -80, 'session/composition.ts', 'Composition', 'frontend/src/features/session/composition.ts', 'Registers authentication adapter and SessionService.', 'Own the session feature object graph.'),
      file('projects-module', 960, 120, 'projects/composition.ts', 'Composition', 'frontend/src/features/projects/composition.ts', 'Registers the HTTP ProjectsGateway implementation.', 'Own the projects feature object graph.', 'services.singleton(projectsGatewayToken'),
      file('tasks-module', 960, 320, 'tasks/composition.ts', 'Composition', 'frontend/src/features/tasks/composition.ts', 'Registers the GraphQL TasksGateway and the project-scoped MobX workspace store.', 'Own the tasks feature object and scope graph.'),
      file('session-adapter', 1290, -80, 'httpAuthenticationGateway.ts', 'Adapter', 'frontend/src/features/session/adapters/httpAuthenticationGateway.ts', 'Implements AuthenticationGateway with BFF endpoints.', 'Translate HTTP/session details into application vocabulary.'),
      file('projects-adapter', 1290, 120, 'httpProjectsGateway.ts', 'Adapter', 'frontend/src/features/projects/adapters/httpProjectsGateway.ts', 'Implements ProjectsGateway and maps DTOs to domain models.', 'Contain project transport mapping.'),
      file('tasks-adapter', 1290, 320, 'graphqlTasksGateway.ts', 'Adapter', 'frontend/src/features/tasks/adapters/graphqlTasksGateway.ts', 'Implements TasksGateway with typed GraphQL documents and maps wire values into task domain models.', 'Contain task transport mapping.'),
      file('projects-token', 1290, 540, 'projectsGatewayToken', 'Token', 'frontend/src/features/projects/presentation/projectsGatewayService.ts', 'The runtime name of the ProjectsGateway port: a unique symbol carrying the port type, because interfaces are erased at compile time. The registration stores a factory under it; useProjectsGateway resolves an instance by it.', 'The only thing consumer, adapter, and container all share — see the DI inversion lens.', 'createServiceToken<ProjectsGateway>'),
    ],
    edges: [
      edge('main-composition', 'main', 'composition', 'createAppRuntime()', 'registers'),
      edge('main-providers', 'main', 'providers', 'renders'),
      edge('main-routes', 'main', 'route-tree', 'creates router'),
      edge('composition-core', 'composition', 'ioc-core', 'builds graph', 'registers'),
      edge('providers-react', 'providers', 'ioc-react', 'provides resolver', 'runtime'),
      edge('react-core', 'ioc-react', 'ioc-core', 'reads services'),
      // composition.ts registers three shared singletons before any feature module runs.
      edge('composition-api', 'composition', 'api-client', 'registers', 'registers'),
      edge('composition-graphql', 'composition', 'graphql-client', 'registers', 'registers'),
      edge('composition-antiforgery', 'composition', 'antiforgery', 'registers', 'registers'),
      edge('composition-session', 'composition', 'session-module', 'addSessionModule', 'registers'),
      edge('composition-projects', 'composition', 'projects-module', 'addProjectsModule', 'registers'),
      edge('composition-tasks', 'composition', 'tasks-module', 'addTasksModule', 'registers'),
      // The scoped registration comes from the editable route file, not the generated registry.
      edge('routes-project-route', 'route-tree', 'project-route', 'route module'),
      edge('project-route-scope', 'project-route', 'tasks-module', 'adds project scope', 'registers'),
      edge('session-adapter-edge', 'session-module', 'session-adapter', 'registers', 'registers'),
      edge('projects-adapter-edge', 'projects-module', 'projects-adapter', 'registers', 'registers'),
      edge('tasks-adapter-edge', 'tasks-module', 'tasks-adapter', 'registers', 'registers'),
      edge('projects-module-token', 'projects-module', 'projects-token', 'singleton(token, factory)', 'registers'),
    ],
  },

  'frontend-session': {
    id: 'frontend-session', parent: 'frontend', label: 'Session files', eyebrow: 'Frontend / session feature', title: 'Authentication behind an application port.',
    description: 'Follow the static dependency direction from presentation and adapter toward application and domain files. Everything here is internal except index.ts, the one module another feature may name.',
    nodes: [
      file('consumer', -400, 20, 'TaskList.tsx', 'Presentation', 'frontend/src/features/tasks/presentation/task-list/TaskList.tsx', 'A file in another feature — the only cross-feature importer in the codebase. It needs to know who is signed in so it can offer "assign to me".', 'Reaches session through the published surface, never past it.', "from '@/features/session'"),
      file('door', -60, 20, 'index.ts', 'Application', 'frontend/src/features/session/index.ts', 'The front door: the feature\'s public API. Six named exports, and everything else stays private, so the folder layout below can be rearranged without touching a consumer. SignInPage is deliberately absent — it is a page, mounted by the route layer, and re-exporting it here would drag it into the chunk of every feature that only wanted a hook.', 'Turn a folder into a module with a contract.', 'export { useCurrentUser'),
      file('domain', 980, 140, 'user.ts', 'Domain', 'frontend/src/features/session/domain/user.ts', 'Defines the transport-independent User model. UserId is no longer declared here: projects and tasks both need that word, so it moved to the shared kernel rather than making them depend on session to say it.', 'No React, HTTP, or application dependencies.'),
      file('port', 650, 20, 'ports.ts', 'Application', 'frontend/src/features/session/application/ports.ts', 'Defines AuthenticationGateway.', 'The inner layer owns the contract implemented by HTTP.'),
      file('service', 650, 260, 'sessionService.ts', 'Application', 'frontend/src/features/session/application/sessionService.ts', 'Exposes session use cases and delegates to the authentication port.', 'Presentation depends on use cases, not the adapter.'),
      file('adapter', 300, 20, 'httpAuthenticationGateway.ts', 'Adapter', 'frontend/src/features/session/adapters/httpAuthenticationGateway.ts', 'Implements current, sign-in, and sign-out through BFF endpoints.', 'Provider protocol remains outside the domain.'),
      file('session-hook', 300, 260, 'useSession.ts', 'Presentation', 'frontend/src/features/session/presentation/current-session/useSession.ts', 'Maps Query state into loading, anonymous, failed, or ready session states.', 'Presentation owns rendering state, Query owns server state.'),
      file('screen', 0, 260, 'SignInPage.tsx', 'Presentation', 'frontend/src/features/session/presentation/sign-in/SignInPage.tsx', 'Renders anonymous-session UI and triggers sign-in.', 'Translate a gesture into a session use case.'),
      file('cache', 300, 500, 'sessionCache.ts', 'State', 'frontend/src/features/session/presentation/current-session/sessionCache.ts', 'Evicts authenticated data and writes anonymous session state after logout or 401.', 'Centralize session-expiry cache behavior.'),
    ],
    edges: [
      edge('consumer-door', 'consumer', 'door', 'imports useCurrentUser'),
      edge('door-hook', 'door', 'session-hook', 're-exports'),
      edge('adapter-port', 'adapter', 'port', 'implements', 'implements'), edge('adapter-domain', 'adapter', 'domain', 'maps User'),
      edge('service-port', 'service', 'port', 'depends on'), edge('service-domain', 'service', 'domain', 'returns User'),
      edge('hook-service', 'session-hook', 'service', 'invokes'), edge('screen-hook', 'screen', 'session-hook', 'reads / mutates'),
      edge('hook-cache', 'session-hook', 'cache', 'Query state'),
    ],
  },

  'frontend-projects': {
    id: 'frontend-projects', parent: 'frontend', label: 'Project files', eyebrow: 'Frontend / projects feature', title: 'A vertical slice from screen to transport.',
    description: 'The project capability is split by reason to change while retaining one feature boundary.',
    nodes: [
      file('domain', 980, 180, 'project.ts', 'Domain', 'frontend/src/features/projects/domain/project.ts', 'Defines the Project model. It declares neither of the two IDs it uses: ProjectId and the owner\'s UserId both come from the kernel.', 'Transport-independent project vocabulary.', "from '@/shared/domain/identity'"),
      file('kernel', 1320, 180, 'identity.ts', 'Domain', 'frontend/src/shared/domain/identity.ts', 'The shared kernel. ProjectId lives here rather than in this feature because tasks must name a project too, and a task naming a project should not make tasks depend on the projects feature.', 'Vocabulary two features must agree on, owned by neither.', 'export type ProjectId'),
      file('port', 650, 120, 'ports.ts', 'Application', 'frontend/src/features/projects/application/ports.ts', 'Defines list, get, and create operations plus CreateProjectInput.', 'Own the gateway contract inward of HTTP.'),
      file('adapter', 320, 30, 'httpProjectsGateway.ts', 'Adapter', 'frontend/src/features/projects/adapters/httpProjectsGateway.ts', 'Implements project operations with typed API requests and DTO mapping.', 'HTTP and antiforgery stay at the edge.'),
      file('page', 0, 180, 'ProjectsPage.tsx', 'Presentation', 'frontend/src/features/projects/presentation/ProjectsPage.tsx', 'Composes list and creation capabilities.', 'Feature-level UI composition.'),
      file('list', 320, 300, 'ProjectList.tsx', 'Presentation', 'frontend/src/features/projects/presentation/project-list/ProjectList.tsx', 'Renders projects and links selection into the URL.', 'Router owns selected project state.'),
      file('hook', 650, 440, 'useProjects.ts', 'State', 'frontend/src/features/projects/presentation/project-list/useProjects.ts', 'Resolves the gateway by token, runs the list query, and maps domain Projects into render-ready view models.', 'The consumer starred in the DI inversion lens.', 'useProjectsGateway()'),
      file('create', 320, 560, 'CreateProjectForm.tsx', 'Presentation', 'frontend/src/features/projects/presentation/create-project/CreateProjectForm.tsx', 'Owns an unsubmitted project draft with React Hook Form.', 'Form state remains local; mutation state belongs to Query.'),
      file('queries', 650, 760, 'projectKeys.ts', 'State', 'frontend/src/features/projects/presentation/projectKeys.ts', 'Defines stable list and per-project cache identities.', 'Isolate server state by resource identity.'),
    ],
    edges: [
      edge('adapter-port', 'adapter', 'port', 'implements', 'implements'), edge('adapter-domain', 'adapter', 'domain', 'maps DTO'),
      edge('page-list', 'page', 'list', 'renders'), edge('page-create', 'page', 'create', 'renders'),
      edge('list-hook', 'list', 'hook', 'reads view model'),
      edge('hook-port', 'hook', 'port', 'list() via service token'), edge('hook-domain', 'hook', 'domain', 'maps Project'),
      edge('create-port', 'create', 'port', 'create() via useCreateProject'), edge('hook-queries', 'hook', 'queries', 'cache identity'),
      edge('create-queries', 'create', 'queries', 'invalidates'),
      edge('domain-kernel', 'domain', 'kernel', 'ProjectId + UserId'), edge('port-kernel', 'port', 'kernel', 'ProjectId'),
    ],
  },

  'frontend-tasks': {
    id: 'frontend-tasks', parent: 'frontend', label: 'Task files', eyebrow: 'Frontend / tasks feature', title: 'Cross-feature vocabulary, inward dependencies.',
    description: 'Tasks reach the server through a GraphQL gateway port and TanStack Query, with a scoped MobX view store for interaction state — the same seam as projects over a different transport. This is also where the feature axis shows: a task names a project and a user constantly, yet this feature imports neither of theirs.',
    nodes: [
      file('domain', 1080, 300, 'task.ts', 'Domain', 'frontend/src/features/tasks/domain/task.ts', 'Defines TaskId, Task, TaskStatus, and TaskPriority. TaskId is declared here and stays here — no other feature needs to name a task, so it remains this feature\'s own opinion.', 'Borrow ProjectId and UserId from the kernel; own TaskId.', "from '@/shared/domain/identity'"),
      file('kernel', 1420, 300, 'identity.ts', 'Domain', 'frontend/src/shared/domain/identity.ts', 'The shared kernel. The asymmetry with TaskId is the rule made visible: a word goes here when two features must agree on it, and stays home when only one uses it.', 'Vocabulary only. Never a transport, a cache, or the container.', 'export type UserId'),
      file('door', 380, -100, 'session/index.ts', 'Application', 'frontend/src/features/session/index.ts', 'Another feature\'s front door. TaskList genuinely needs the signed-in user to offer "assign to me", so this dependency is real — it is routed through a published surface instead of reaching into session\'s folders.', 'The one legal feature-to-feature edge in the codebase.', 'export { useCurrentUser'),
      file('port', 740, 300, 'ports.ts', 'Application', 'frontend/src/features/tasks/application/ports.ts', 'Defines the TasksGateway contract: list, create, complete, and assign.', 'Own the gateway contract inward of GraphQL.'),
      file('adapter', 740, 60, 'graphqlTasksGateway.ts', 'Adapter', 'frontend/src/features/tasks/adapters/graphqlTasksGateway.ts', 'Implements TasksGateway with typed GraphQL documents and maps enums, IDs, and dates.', 'Reject malformed wire values before they reach the domain model.'),
      file('store', 740, 540, 'tasksWorkspaceViewStore.ts', 'State', 'frontend/src/features/tasks/presentation/tasksWorkspaceViewStore.ts', 'Owns the project-scoped task visibility filter with MobX.', 'Hold interaction state only; never cache task entities.'),
      file('page', 0, 300, 'TasksPage.tsx', 'Presentation', 'frontend/src/features/tasks/presentation/TasksPage.tsx', 'Composes task creation and project-scoped task list.', 'Receive project selection from the route.'),
      file('list', 380, 140, 'TaskList.tsx', 'Presentation', 'frontend/src/features/tasks/presentation/task-list/TaskList.tsx', 'Renders tasks and exposes complete and assign-to-me gestures.', 'Use current user through session presentation, never its adapter.'),
      file('create', 380, 340, 'CreateTaskForm.tsx', 'Presentation', 'frontend/src/features/tasks/presentation/create-task/CreateTaskForm.tsx', 'Owns task draft and starts the create mutation.', 'Keep draft state local to the form.'),
      file('mutations', 380, 540, 'useCompleteTask.ts', 'State', 'frontend/src/features/tasks/presentation/complete-task/useCompleteTask.ts', 'Completes a task through the gateway and invalidates the exact project task list. Per-row pending state is read back out of the mutation cache by key rather than stored in a "which id is in flight" variable, so completing two tasks at once keeps both spinners honest.', 'Query owns mutation lifecycle, refresh, and in-flight identity.', 'useMutationState({'),
      file('keys', 380, 720, 'taskKeys.ts', 'State', 'frontend/src/features/tasks/presentation/taskKeys.ts', 'Defines the per-project task list cache identity.', 'Isolate server state by resource identity.'),
    ],
    edges: [
      edge('page-list', 'page', 'list', 'renders'), edge('page-create', 'page', 'create', 'renders'),
      edge('list-port', 'list', 'port', 'list() via service token'), edge('list-domain', 'list', 'domain', 'renders Task'),
      edge('list-store', 'list', 'store', 'observes filter'), edge('create-port', 'create', 'port', 'create() via service token'),
      edge('list-mutations', 'list', 'mutations', 'triggers'), edge('mutations-port', 'mutations', 'port', 'complete() via service token'),
      edge('list-keys', 'list', 'keys', 'cache key'), edge('mutations-keys', 'mutations', 'keys', 'invalidates'),
      edge('adapter-port', 'adapter', 'port', 'implements', 'implements'), edge('adapter-domain', 'adapter', 'domain', 'maps wire'),
      edge('port-domain', 'port', 'domain', 'returns Task'),
      edge('domain-kernel', 'domain', 'kernel', 'ProjectId + UserId'), edge('port-kernel', 'port', 'kernel', 'ProjectId + UserId'),
      edge('list-door', 'list', 'door', 'useCurrentUser'),
    ],
  },

  backend: {
    id: 'backend', parent: 'overview', label: 'Backend', eyebrow: 'Backend / project graph', title: 'Four projects, dependencies inward.',
    description: 'Open any project to inspect its modules, concrete files, DI registrations, and implementation edges.',
    nodes: [
      node('api', 0, 160, {
        label: 'TaskFlow.Api', kind: 'Presentation', level: 'Layer', technology: 'ASP.NET Core project',
        description: 'Composition root, HTTP controllers, OIDC/cookie adapter, middleware, and error translation.',
        responsibility: 'May reference Application and Infrastructure; contains no business rules.', sourcePath: 'backend/src/TaskFlow.Api', drilldown: 'backend-api',
      }),
      node('infrastructure', 360, 390, {
        label: 'TaskFlow.Infrastructure', kind: 'Adapter', level: 'Layer', technology: 'EF Core / Npgsql project',
        description: 'Repository adapters, DbContext/unit of work, relational mappings, and migrations.',
        responsibility: 'Implements core-owned ports and references Domain/Application.', sourcePath: 'backend/src/TaskFlow.Infrastructure', drilldown: 'backend-infrastructure',
      }),
      node('application', 720, 160, {
        label: 'TaskFlow.Application', kind: 'Application', level: 'Layer', technology: 'Use-case project',
        description: 'User, project, and task orchestration, validators, DTOs, and application ports.',
        responsibility: 'References Domain only; never API or Infrastructure.', sourcePath: 'backend/src/TaskFlow.Application', drilldown: 'backend-application',
      }),
      node('domain', 1080, 160, {
        label: 'TaskFlow.Domain', kind: 'Domain', level: 'Layer', technology: 'Framework-free project',
        description: 'Entities, value objects, state transitions, enums, exceptions, and repository contracts.',
        responsibility: 'References no other TaskFlow project.', sourcePath: 'backend/src/TaskFlow.Domain', drilldown: 'backend-domain',
      }),
      node('tests', 720, -130, {
        label: 'Test projects', kind: 'State', level: 'Project', technology: 'xUnit / NSubstitute / FluentAssertions',
        description: 'Domain behavior tests and application orchestration tests using substituted ports.',
        responsibility: 'Exercise inner layers without booting HTTP or PostgreSQL.', sourcePath: 'backend/tests',
      }),
    ],
    edges: [
      edge('api-application', 'api', 'application', 'project reference'),
      edge('api-infrastructure', 'api', 'infrastructure', 'composition reference'),
      edge('infrastructure-application', 'infrastructure', 'application', 'implements ports', 'implements'),
      edge('infrastructure-domain', 'infrastructure', 'domain', 'maps aggregates'),
      edge('application-domain', 'application', 'domain', 'project reference'),
      edge('tests-application', 'tests', 'application', 'tests'), edge('tests-domain', 'tests', 'domain', 'tests'),
    ],
  },

  'backend-api': {
    id: 'backend-api', parent: 'backend', label: 'API files', eyebrow: 'Backend / API project', title: 'REST/GraphQL delivery and the composition root.',
    description: 'Program.cs connects outer adapters to inner interfaces. Controllers and GraphQL resolvers stay thin; authentication adapts claims to ICurrentUser.',
    nodes: [
      file('program', 0, 160, 'Program.cs', 'Composition', 'backend/src/TaskFlow.Api/Program.cs', 'Registers framework services, application services, infrastructure adapters, authentication, and the middleware pipeline.', 'The backend composition root; concrete-to-interface wiring belongs here.'),
      file('auth-controller', 360, -100, 'AuthController.cs', 'Presentation', 'backend/src/TaskFlow.Api/Controllers/AuthController.cs', 'Exposes login, current-user, antiforgery, and logout endpoints.', 'Translate auth HTTP semantics to framework/application calls.'),
      file('projects-controller', 360, 130, 'ProjectsController.cs', 'Presentation', 'backend/src/TaskFlow.Api/Controllers/ProjectsController.cs', 'Maps project endpoints directly to IProjectService.', 'No ownership or persistence logic in controllers.'),
      file('tasks-controller', 360, 360, 'TaskMutations.cs', 'Presentation', 'backend/src/TaskFlow.Api/GraphQL/TaskMutations.cs', 'Maps GraphQL task mutations to ITaskService.', 'No task lifecycle rules in either delivery adapter.'),
      file('task-queries', 360, 590, 'TaskQueries.cs', 'Presentation', 'backend/src/TaskFlow.Api/GraphQL/TaskQueries.cs', 'Exposes task and per-project task list queries over GraphQL.', 'The read path the frontend tasks feature actually uses.'),
      file('rest-tasks', 0, 480, 'TasksController.cs', 'Presentation', 'backend/src/TaskFlow.Api/Controllers/TasksController.cs', 'REST task endpoints over the same ITaskService.', 'Parallel delivery of the task use cases; the frontend now reaches tasks through GraphQL.'),
      file('oidc-events', 720, -100, 'OidcEvents.cs', 'Adapter', 'backend/src/TaskFlow.Api/Authentication/OidcEvents.cs', 'Provisions or links the external identity and adds the internal user ID claim.', 'Provider claims are translated at the trusted edge.'),
      file('current-user', 720, 150, 'HttpCurrentUser.cs', 'Adapter', 'backend/src/TaskFlow.Api/Authentication/HttpCurrentUser.cs', 'Implements ICurrentUser from the authenticated ClaimsPrincipal.', 'Application code sees an internal UserId, not HTTP claims.'),
      file('errors', 720, 400, 'GlobalExceptionHandler.cs', 'Adapter', 'backend/src/TaskFlow.Api/ErrorHandling/GlobalExceptionHandler.cs', 'Maps domain, validation, unauthenticated, conflict, not-found, and antiforgery exceptions to Problem Details. Its GraphQL twin, TaskFlowGraphQLErrorFilter, maps the same exception set to the same vocabulary, so a failure means the same thing on both transports.', 'Exception-to-HTTP translation stays at the delivery boundary — and stays identical across delivery boundaries.', 'UnauthenticatedException => CreateProblem('),
    ],
    edges: [
      edge('program-auth-controller', 'program', 'auth-controller', 'registers', 'registers'), edge('program-projects-controller', 'program', 'projects-controller', 'registers', 'registers'),
      edge('program-tasks-controller', 'program', 'tasks-controller', 'AddMutationType', 'registers'), edge('program-task-queries', 'program', 'task-queries', 'AddQueryType', 'registers'),
      edge('program-rest-tasks', 'program', 'rest-tasks', 'registers', 'registers'), edge('program-oidc', 'program', 'oidc-events', 'scoped + configures', 'registers'),
      edge('program-current', 'program', 'current-user', 'ICurrentUser ->', 'registers'), edge('program-errors', 'program', 'errors', 'registers', 'registers'),
      edge('auth-oidc', 'auth-controller', 'oidc-events', 'OIDC challenge flow', 'runtime'),
    ],
  },

  'backend-application': {
    id: 'backend-application', parent: 'backend', label: 'Application files', eyebrow: 'Backend / Application project', title: 'Use cases coordinate inward-owned ports.',
    description: 'Select a service to reveal its direct collaborators. The arrows are constructor/runtime dependencies, not merely folder relationships.',
    nodes: [
      file('di', 0, -100, 'DependencyInjection.cs', 'Composition', 'backend/src/TaskFlow.Application/DependencyInjection.cs', 'Registers services, validators, and TimeProvider.', 'Expose one AddApplication entry point to the API composition root.'),
      file('users', 0, 120, 'UserService.cs', 'Application', 'backend/src/TaskFlow.Application/Users/UserService.cs', 'Provisions provider-neutral users and external identity links.', 'Coordinate identity repositories and commit once.'),
      file('projects', 0, 350, 'ProjectService.cs', 'Application', 'backend/src/TaskFlow.Application/Projects/ProjectService.cs', 'Creates, lists, and loads only projects owned by the current user.', 'Enforce ownership and orchestration outside HTTP.'),
      file('tasks', 0, 580, 'TaskService.cs', 'Application', 'backend/src/TaskFlow.Application/Tasks/TaskService.cs', 'Creates, lists, assigns, and completes tasks after project ownership checks.', 'Delegate state transitions to domain entities and commit through IUnitOfWork.'),
      file('current-user', 410, 120, 'ICurrentUser.cs', 'Application', 'backend/src/TaskFlow.Application/Common/Interfaces/ICurrentUser.cs', 'Port exposing the authenticated internal user ID.', 'Owned by Application; implemented by the API adapter.'),
      file('unit-of-work', 410, 350, 'IUnitOfWork.cs', 'Application', 'backend/src/TaskFlow.Application/Common/Interfaces/IUnitOfWork.cs', 'Defines the transaction commit boundary.', 'Owned inward; implemented by TaskFlowDbContext.'),
      node('repositories', 760, 240, {
        label: 'Repository ports', kind: 'Domain', level: 'Module', technology: 'IUserRepository / IProjectRepository / ITaskItemRepository',
        description: 'Aggregate persistence contracts declared in Domain and consumed by application services.',
        responsibility: 'Infrastructure implements contracts owned by the core.', sourcePath: 'backend/src/TaskFlow.Domain/Repositories', drilldown: 'backend-domain',
      }),
      node('entities', 1120, 240, {
        label: 'Domain entities', kind: 'Domain', level: 'Module', technology: 'User / Project / TaskItem',
        description: 'Factories and behavior called by application services.',
        responsibility: 'Own invariants and valid state transitions.', sourcePath: 'backend/src/TaskFlow.Domain/Entities', drilldown: 'backend-domain',
      }),
    ],
    edges: [
      edge('di-users', 'di', 'users', 'IUserService ->', 'registers'), edge('di-projects', 'di', 'projects', 'IProjectService ->', 'registers'), edge('di-tasks', 'di', 'tasks', 'ITaskService ->', 'registers'),
      edge('users-uow', 'users', 'unit-of-work', 'commit'), edge('users-repos', 'users', 'repositories', 'user + identity repos'), edge('users-entities', 'users', 'entities', 'creates / updates'),
      edge('projects-current', 'projects', 'current-user', 'UserId'), edge('projects-uow', 'projects', 'unit-of-work', 'commit'), edge('projects-repos', 'projects', 'repositories', 'project repo'), edge('projects-entities', 'projects', 'entities', 'creates Project'),
      edge('tasks-current', 'tasks', 'current-user', 'UserId'), edge('tasks-uow', 'tasks', 'unit-of-work', 'commit'), edge('tasks-repos', 'tasks', 'repositories', 'task/project/user repos'), edge('tasks-entities', 'tasks', 'entities', 'calls behavior'),
    ],
  },

  'backend-domain': {
    id: 'backend-domain', parent: 'backend', label: 'Domain files', eyebrow: 'Backend / Domain project', title: 'Framework-free business vocabulary.',
    description: 'Concrete domain files and their relationships. There are no references from this project to Application, Infrastructure, or API.',
    nodes: [
      file('entity-base', 0, -80, 'Entity.cs', 'Domain', 'backend/src/TaskFlow.Domain/Common/Entity.cs', 'Provides Guid identity and identity-based equality.', 'Shared entity semantics without framework base classes.'),
      file('vo-base', 0, 170, 'ValueObject.cs', 'Domain', 'backend/src/TaskFlow.Domain/Common/ValueObject.cs', 'Provides structural equality for immutable value objects.', 'Shared value semantics.'),
      file('user', 350, -180, 'User.cs', 'Domain', 'backend/src/TaskFlow.Domain/Entities/User.cs', 'Internal user entity with create, rename, and email-change behavior.', 'Protect valid user state.'),
      file('identity', 350, 40, 'ExternalIdentity.cs', 'Domain', 'backend/src/TaskFlow.Domain/Entities/ExternalIdentity.cs', 'Links an OIDC issuer/subject pair to an internal UserId.', 'Keep external identity separate from the internal user.'),
      file('project', 350, 260, 'Project.cs', 'Domain', 'backend/src/TaskFlow.Domain/Entities/Project.cs', 'Project aggregate carrying ownership and rename/description behavior.', 'Own project invariants.'),
      file('task', 350, 480, 'TaskItem.cs', 'Domain', 'backend/src/TaskFlow.Domain/Entities/TaskItem.cs', 'Task aggregate with assign, start, complete, reopen, and priority behavior.', 'Own task lifecycle transitions.'),
      file('email', 720, -180, 'Email.cs', 'Domain', 'backend/src/TaskFlow.Domain/ValueObjects/Email.cs', 'Validates, trims, and canonicalizes email values.', 'Invalid email cannot enter a User.'),
      file('task-status', 720, 160, 'TaskItemStatus.cs', 'Domain', 'backend/src/TaskFlow.Domain/Enums/TaskItemStatus.cs', 'Defines Todo, InProgress, and Done states.', 'Closed domain vocabulary for task state.'),
      file('task-priority', 720, 370, 'TaskPriority.cs', 'Domain', 'backend/src/TaskFlow.Domain/Enums/TaskPriority.cs', 'Defines Low, Medium, and High priority.', 'Closed domain vocabulary for task priority.'),
      node('repos', 1080, 120, {
        label: 'Repository interfaces', kind: 'Domain', level: 'Module', technology: '4 interface files',
        description: 'Persistence contracts for User, ExternalIdentity, Project, and TaskItem.',
        responsibility: 'Core ownership makes Infrastructure point inward.', sourcePath: 'backend/src/TaskFlow.Domain/Repositories',
      }),
      file('exception', 1080, 390, 'DomainException.cs', 'Domain', 'backend/src/TaskFlow.Domain/Exceptions/DomainException.cs', 'Signals invariant violations without HTTP knowledge.', 'Delivery decides how domain failures are represented externally.'),
    ],
    edges: [
      edge('user-base', 'user', 'entity-base', 'inherits'), edge('identity-base', 'identity', 'entity-base', 'inherits'),
      edge('project-base', 'project', 'entity-base', 'inherits'), edge('task-base', 'task', 'entity-base', 'inherits'),
      edge('email-vo', 'email', 'vo-base', 'inherits'), edge('user-email', 'user', 'email', 'owns'),
      edge('task-status-edge', 'task', 'task-status', 'state'), edge('task-priority-edge', 'task', 'task-priority', 'priority'),
      edge('task-exception', 'task', 'exception', 'invalid transition'),
      edge('repos-entities', 'repos', 'user', 'persists'), edge('repos-project', 'repos', 'project', 'persists'), edge('repos-task', 'repos', 'task', 'persists'),
    ],
  },

  'backend-infrastructure': {
    id: 'backend-infrastructure', parent: 'backend', label: 'Infrastructure files', eyebrow: 'Backend / Infrastructure project', title: 'Adapters implement core-owned contracts.',
    description: 'DI binds repository interfaces to EF implementations sharing one scoped DbContext and unit of work.',
    nodes: [
      file('di', 0, 100, 'DependencyInjection.cs', 'Composition', 'backend/src/TaskFlow.Infrastructure/DependencyInjection.cs', 'Registers DbContext, shared IUnitOfWork, and four repository implementations.', 'One scoped DbContext backs repositories and transaction commit.'),
      file('dbcontext', 370, 100, 'TaskFlowDbContext.cs', 'Adapter', 'backend/src/TaskFlow.Infrastructure/Persistence/TaskFlowDbContext.cs', 'EF DbContext, DbSets, configuration scanning, and concrete IUnitOfWork. Translates optimistic-concurrency losses into the Application-owned ConflictException.', 'Track aggregate changes and commit the same scoped graph; EF exceptions never leave Infrastructure.'),
      node('repositories', 740, -80, {
        label: 'Repository implementations', kind: 'Adapter', level: 'Module', technology: '4 C# files',
        description: 'User, identity, project, and task EF repositories.',
        responsibility: 'Implement Domain repository ports; tracked reads support mutation.', sourcePath: 'backend/src/TaskFlow.Infrastructure/Persistence/Repositories',
      }),
      node('configurations', 740, 210, {
        label: 'Entity configurations', kind: 'Adapter', level: 'Module', technology: '4 C# files',
        description: 'Tables, indexes, conversions, keys, constraints, and xmin optimistic-concurrency tokens.',
        responsibility: 'Relational mapping remains outside domain entities.', sourcePath: 'backend/src/TaskFlow.Infrastructure/Persistence/Configurations',
      }),
      node('migrations', 740, 500, {
        label: 'Migrations', kind: 'Data', level: 'Module', technology: 'EF Core migrations',
        description: 'Versioned initial schema and external identity evolution.',
        responsibility: 'Keep database schema evolution reproducible.', sourcePath: 'backend/src/TaskFlow.Infrastructure/Persistence/Migrations',
      }),
      node('ports', 1110, -80, {
        label: 'Repository ports', kind: 'Domain', level: 'Module', technology: 'TaskFlow.Domain interfaces',
        description: 'Contracts implemented by the repository classes.',
        responsibility: 'Dependency inversion: implementation imports its contract.', sourcePath: 'backend/src/TaskFlow.Domain/Repositories', drilldown: 'backend-domain',
      }),
      file('uow', 1110, 210, 'IUnitOfWork.cs', 'Application', 'backend/src/TaskFlow.Application/Common/Interfaces/IUnitOfWork.cs', 'Application-owned transaction contract implemented by TaskFlowDbContext.', 'The use case chooses when to commit.'),
      node('database', 1110, 500, {
        label: 'PostgreSQL', kind: 'Data', level: 'System', technology: 'Npgsql / PostgreSQL 17',
        description: 'Runtime relational store reached through TaskFlowDbContext.',
        responsibility: 'No inner project depends directly on the database.', sourcePath: 'infra',
      }),
    ],
    edges: [
      edge('di-db', 'di', 'dbcontext', 'AddDbContext + IUnitOfWork', 'registers'), edge('di-repos', 'di', 'repositories', 'interface -> implementation', 'registers'),
      edge('db-repos', 'repositories', 'dbcontext', 'queries / tracks'), edge('repos-ports', 'repositories', 'ports', 'implements', 'implements'),
      edge('db-config', 'dbcontext', 'configurations', 'applies'), edge('db-uow', 'dbcontext', 'uow', 'implements', 'implements'),
      edge('config-migrations', 'configurations', 'migrations', 'schema model'), edge('db-database', 'dbcontext', 'database', 'Npgsql'),
    ],
  },

  'sign-in': {
    id: 'sign-in', label: 'Sign-in flow', eyebrow: 'Runtime lens / A', title: 'Tokens stop at the server.',
    description: 'Runtime sequence for sign-in and internal user provisioning. Double-click codebase nodes to return to their structural views.',
    nodes: [
      node('frontend', 0, 170, { ...browser, label: 'Sign-in presentation' }),
      node('api', 360, 170, { ...api, label: 'Auth controller + OIDC events', drilldown: 'backend-api' }),
      node('oidc', 740, 0, { label: 'OIDC provider', kind: 'External', level: 'System', technology: 'OIDC code + PKCE', description: 'Authenticates and returns validated claims.', responsibility: 'External identity proof.', sourcePath: 'infra/keycloak' }),
      node('database', 740, 340, { label: 'Identity persistence', kind: 'Data', level: 'System', technology: 'PostgreSQL', description: 'Stores internal users and external identity links.', responsibility: 'Persist provider-neutral identity.', sourcePath: 'backend/src/TaskFlow.Infrastructure/Persistence', drilldown: 'backend-infrastructure' }),
    ],
    edges: [
      edge('s1', 'frontend', 'api', '1. GET /auth/login', 'runtime'), edge('s2', 'api', 'oidc', '2. authorize + PKCE', 'runtime'),
      edge('s3', 'oidc', 'api', '3. callback claims', 'runtime'), edge('s4', 'api', 'database', '4. find or provision', 'runtime'),
      edge('s5', 'api', 'frontend', '5. HttpOnly cookie', 'runtime'),
    ],
  },

  'di-inversion': {
    id: 'di-inversion', label: 'DI inversion', eyebrow: 'Runtime lens / B', title: 'Two arrow systems, opposite directions.',
    description: 'Followed through one port: solid compile-time arrows converge inward on ProjectsGateway — the consumer and the adapter never learn about each other. The animated instance flows the other way, from composition through the container to the component. The token is the only thing both worlds share. Toggle the counterfactual to see what the port prevents.',
    nodes: [
      file('consumer', 0, 60, 'useProjects.ts', 'Presentation', 'frontend/src/features/projects/presentation/project-list/useProjects.ts', 'Consumer: fetches projects through the gateway. It names the ProjectsGateway type and the hook — it has no idea HTTP exists.', 'Knows the contract, never the adapter.', 'const gateway = useProjectsGateway()'),
      file('adapter', 480, -200, 'httpProjectsGateway.ts', 'Adapter', 'frontend/src/features/projects/adapters/httpProjectsGateway.ts', 'Adapter: implements the port with openapi-fetch and DTO mapping. It also never learns who consumes it.', 'The inverted arrow: an outer edge fulfilling an inner contract.', 'implements ProjectsGateway'),
      file('port', 960, 60, 'ports.ts', 'Application', 'frontend/src/features/projects/application/ports.ts', 'The port: a contract owned by the application layer. Both static arrows point at it; it points at nothing but the domain.', 'The line dependency inversion is drawn across.', 'export interface ProjectsGateway'),
      file('token', 480, 300, 'projectsGatewayToken', 'Token', 'frontend/src/features/projects/presentation/projectsGatewayService.ts', 'The runtime name of the port — a unique symbol carrying the port type, needed because interfaces are erased at compile time. Where the two arrow systems meet.', 'The only thing consumer, registration, and container all share.', 'createServiceToken<ProjectsGateway>'),
      file('app-composition', 640, 640, 'app/composition.ts', 'Composition', 'frontend/src/app/composition.ts', 'The menu: one line opts the projects feature into this app. It never sees the adapter.', 'Know that a feature participates, never what it registers.', 'addProjectsModule(registrations)'),
      file('feature-composition', 1080, 640, 'projects/composition.ts', 'Composition', 'frontend/src/features/projects/composition.ts', 'The recipe: stores a factory under the token. Still no instance — just the decision that HTTP satisfies this port.', 'The only file that names both the token and the adapter.', 'services.singleton(projectsGatewayToken'),
      file('container', 1520, 640, 'ioc/core.ts', 'Composition', 'frontend/src/shared/ioc/core.ts', 'The container: build() runs every factory eagerly and caches each instance under its token, so render-time resolution is a pure cache read.', 'Hold instances; enforce lifetimes; know nothing about projects.', 'initializeStableServices(): void {'),
    ],
    edges: [
      edge('consumer-token', 'consumer', 'token', 'useProjectsGateway()'),
      edge('consumer-port', 'consumer', 'port', 'depends on the contract'),
      edge('adapter-port', 'adapter', 'port', 'implements', 'implements'),
      edge('token-port', 'token', 'port', 'runtime name of'),
      edge('r1', 'app-composition', 'feature-composition', '1. addProjectsModule(registrations)', 'runtime'),
      edge('r2', 'feature-composition', 'container', '2. singleton(token, () => new HttpProjectsGateway(...))', 'runtime'),
      edge('r3', 'container', 'token', '3. build() runs the factory, caches the instance under the token', 'runtime', { fromBelow: true, intoBelow: true }),
      edge('r4', 'token', 'consumer', '4. useService(token) hands the instance to the component', 'runtime', { fromBelow: true, intoBelow: true }),
    ],
  },

  'di-inversion-without': {
    id: 'di-inversion-without', parent: 'di-inversion', label: 'Without the port', eyebrow: 'Runtime lens / B — counterfactual', title: 'What the port prevents.',
    description: 'Delete the port and the token, and one red arrow replaces the whole machinery: the component imports the adapter directly. Cheaper today — and it costs the test stub (tests now need a real HTTP layer), the transport swap (the GraphQL migration would have edited every consumer), and the boundary (openapi-fetch types now leak into presentation).',
    nodes: [
      file('consumer', 0, 100, 'useProjects.ts', 'Presentation', 'frontend/src/features/projects/presentation/project-list/useProjects.ts', 'Now constructs or imports the concrete gateway itself, so it must also know about the API client, antiforgery, and 401 policy.', 'Coupled to a transport it never needed to know existed.'),
      file('adapter', 560, 100, 'httpProjectsGateway.ts', 'Adapter', 'frontend/src/features/projects/adapters/httpProjectsGateway.ts', 'Unchanged code — but every consumer now depends on this exact class, so replacing it means editing all of them.', 'De facto public API of the feature.'),
      file('port', 1120, 320, 'ports.ts', 'Application', 'frontend/src/features/projects/application/ports.ts', 'Orphaned: nothing implements it, nothing depends on it. The contract still exists on disk — it just no longer protects anything.', 'A boundary nobody crosses is not a boundary.'),
    ],
    edges: [
      edge('direct', 'consumer', 'adapter', 'direct import — transport leaks into presentation', 'forbidden'),
    ],
  },
}

/**
 * The child views offered as tabs under a top-level view. This lives beside the views rather than
 * in the component because it is the second half of the navigation graph: a view carries a `parent`
 * so it can render a back button, and appears here so it can be reached in the first place. Listing
 * a view in one and not the other produces a view with no way in, or a tab to nowhere — so the
 * model test asserts the two agree.
 */
const viewChildren: Partial<Record<ArchitectureViewId, { id: ArchitectureViewId; label: string }[]>> = {
  frontend: [
    { id: 'frontend-nutshell', label: 'In a nutshell' },
    { id: 'frontend-composition', label: 'Composition / DI' },
    { id: 'frontend-session', label: 'Session feature' },
    { id: 'frontend-projects', label: 'Projects feature' },
    { id: 'frontend-tasks', label: 'Tasks feature' },
  ],
  backend: [
    { id: 'backend-api', label: 'API project' },
    { id: 'backend-application', label: 'Application project' },
    { id: 'backend-domain', label: 'Domain project' },
    { id: 'backend-infrastructure', label: 'Infrastructure project' },
  ],
}

/**
 * The counterfactual toggle: a view paired with the version of itself that deletes the thing it
 * teaches. The pairing is symmetric and each side carries its own button label, so the whole
 * mechanism is one fact in one place instead of two hardcoded branches in the canvas.
 */
const viewCounterfactual: Partial<Record<ArchitectureViewId, { id: ArchitectureViewId; label: string }>> = {
  'di-inversion': { id: 'di-inversion-without', label: 'Delete the port' },
  'di-inversion-without': { id: 'di-inversion', label: 'Restore the port' },
}

/**
 * Where each view sits in the Clean Architecture lens when no node is selected, so the compass
 * still orients you the moment a view opens. Views not listed here span rings rather than sitting
 * in one, and the compass simply shows no active ring.
 */
const viewLensKinds: Partial<Record<ArchitectureViewId, string>> = {
  'frontend-nutshell': 'Application',
  'frontend-composition': 'Composition',
  'frontend-session': 'Application',
  'frontend-projects': 'Application',
  'frontend-tasks': 'Application',
  'backend-api': 'Presentation',
  'backend-application': 'Application',
  'backend-domain': 'Domain',
  'backend-infrastructure': 'Adapter',
  'di-inversion': 'Composition',
  'di-inversion-without': 'Presentation',
}

export const taskflowGraph: ExplorerGraph<ArchitectureViewId> = {
  root: 'overview',
  primary: primaryViewOrder,
  children: viewChildren,
  counterfactual: viewCounterfactual,
  views: Object.fromEntries(
    Object.entries<ArchitectureView>(architectureViews).map(([id, view]) => [
      id,
      { ...view, lensKind: viewLensKinds[id as ArchitectureViewId] },
    ]),
  ) as Record<ArchitectureViewId, ArchitectureView>,
}

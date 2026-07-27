/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-depends-inward',
      severity: 'error',
      from: { path: '^src/features/[^/]+/domain/' },
      to: {
        path: '^src/(app/|features/[^/]+/(application|adapters|presentation)/)',
      },
    },
    {
      name: 'application-depends-inward',
      severity: 'error',
      from: { path: '^src/features/[^/]+/application/' },
      to: { path: '^src/(app/|features/[^/]+/(adapters|presentation)/)' },
    },
    {
      name: 'adapters-do-not-depend-on-presentation',
      severity: 'error',
      from: { path: '^src/features/[^/]+/adapters/' },
      to: { path: '^src/(app/|features/[^/]+/presentation/)' },
    },
    {
      name: 'presentation-does-not-depend-on-adapters',
      severity: 'error',
      from: { path: '^src/features/[^/]+/presentation/' },
      to: { path: '^src/features/[^/]+/adapters/' },
    },
    {
      name: 'shared-does-not-depend-on-features',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/(app|features)/' },
    },

    // ---------------------------------------------------------------------------------------
    // Feature axis. The rules above govern the *layer* axis (domain/application/adapters/
    // presentation) inside a feature. These two govern the *feature* axis between them, which
    // is the boundary that actually decays as a codebase grows.
    // ---------------------------------------------------------------------------------------
    {
      name: 'cross-feature-imports-use-the-front-door',
      comment:
        'A feature may import another feature only through its index.ts. Deep imports couple a '
        + "consumer to the other feature's internal folder layout, so moving a file becomes a "
        + 'cross-feature change. `src/app` (composition root) and `src/routes` (page layer) are '
        + 'deliberately exempt: wiring features together and mounting pages is their job.',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: {
        path: '^src/features/',
        pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'shared-kernel-holds-vocabulary-not-logic',
      comment:
        'src/shared/domain is the shared kernel: identity types and pure predicates that several '
        + 'features must agree on. The moment it can reach a transport, a cache, or the container, '
        + 'it stops being vocabulary and becomes the junk drawer every shared kernel dies of.',
      severity: 'error',
      from: { path: '^src/shared/domain/' },
      to: { path: '^src/shared/(api|graphql|query|ioc)/' },
    },
    {
      name: 'presentation-resolves-services-through-feature-hooks',
      comment:
        "Only a feature's presentation *Service.ts hook may touch the IoC container/bridge. "
        + 'Components and view-model hooks consume the narrow useXGateway()/useXService() hook, so no '
        + 'module can turn the resolver into a service locator or reach across features through it.',
      severity: 'error',
      from: {
        path: '^src/features/[^/]+/presentation/',
        pathNot: 'Service\\.ts$',
      },
      to: { path: '^src/shared/ioc/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: '(^|/)node_modules/',
    tsConfig: { fileName: 'tsconfig.app.json' },
    // Without this, dependency-cruiser only sees imports that survive to runtime. `import type` is
    // erased by the compiler but is still an architectural dependency: a domain layer that imports
    // a type from another feature is coupled to it whether or not the bundler can tell. Off, this
    // config cruised 164 of 234 edges — it was measuring the bundle, not the design.
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      conditionNames: ['types', 'import', 'default'],
      exportsFields: ['exports'],
    },
  },
}

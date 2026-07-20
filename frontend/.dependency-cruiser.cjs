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
    enhancedResolveOptions: {
      conditionNames: ['types', 'import', 'default'],
      exportsFields: ['exports'],
    },
  },
}

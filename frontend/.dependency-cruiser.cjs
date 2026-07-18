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

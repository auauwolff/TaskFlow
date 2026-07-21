const frontendSources = import.meta.glob<string>([
  '../../../**/*.{ts,tsx}',
  '!../../../**/*.test.{ts,tsx}',
  '!../../../features/architecture/**/*.{ts,tsx}',
], {
  eager: true,
  import: 'default',
  query: '?raw',
})

const backendSources = import.meta.glob<string>([
  '../../../../../backend/src/**/*.cs',
  '!../../../../../backend/src/**/Migrations/**/*.cs',
], {
  eager: true,
  import: 'default',
  query: '?raw',
})

const sources = new Map<string, string>()

for (const [path, source] of Object.entries(frontendSources)) {
  const sourcePath = path.startsWith('../../../')
    ? `frontend/src/${path.slice('../../../'.length)}`
    : `frontend/src/features/${path.slice('../../'.length)}`

  sources.set(sourcePath, source)
}

for (const [path, source] of Object.entries(backendSources)) {
  sources.set(path.replace('../../../../../', ''), source)
}

export function getSourceCode(sourcePath: string | undefined) {
  return sourcePath === undefined ? undefined : sources.get(sourcePath)
}

import { gitHubSourceUrl, type SourceProvider } from './explorer/sourceProvider'

/**
 * TaskFlow's implementation of the explorer's {@link SourceProvider}: this repository's own files,
 * reached through Vite.
 *
 * The glob is lazy on purpose. Eager `?raw` imports inline every matched file into the entry chunk,
 * which is linear in repository size and puts the whole codebase in front of a visitor who never
 * opens a node. Lazy imports let Vite split each file out and fetch it only when asked for.
 *
 * Tests and the explorer's own source are excluded: nothing in the graph points at them, and the
 * explorer describing itself is noise.
 */
const frontendSources = import.meta.glob<string>([
  '../../../**/*.{ts,tsx}',
  '!../../../**/*.test.{ts,tsx}',
  '!../../../features/architecture/**/*.{ts,tsx}',
], { import: 'default', query: '?raw' })

const backendSources = import.meta.glob<string>([
  '../../../../../backend/src/**/*.cs',
  '!../../../../../backend/src/**/Migrations/**/*.cs',
], { import: 'default', query: '?raw' })

/**
 * Maps a Vite glob key to a repository-relative path. Vite emits the *shortest* relative path, so a
 * sibling feature arrives as `../../session/index.ts` rather than `../../../features/session/...`,
 * which is why there are three cases rather than two.
 */
function repositoryPath(globKey: string) {
  if (globKey.startsWith('../../../../../')) return globKey.slice('../../../../../'.length)
  if (globKey.startsWith('../../../')) return `frontend/src/${globKey.slice('../../../'.length)}`
  return `frontend/src/features/${globKey.slice('../../'.length)}`
}

const loaders = new Map<string, () => Promise<string>>()

for (const [globKey, load] of Object.entries({ ...frontendSources, ...backendSources })) {
  loaders.set(repositoryPath(globKey), load)
}

/** Every repository path the explorer can display. Exported so the model test can check coverage. */
export const readableSourcePaths: ReadonlySet<string> = new Set(loaders.keys())

export const taskflowSource: SourceProvider = {
  read: async (sourcePath) => await loaders.get(sourcePath)?.(),
  urlFor: gitHubSourceUrl('https://github.com/auauwolff/TaskFlow'),
}

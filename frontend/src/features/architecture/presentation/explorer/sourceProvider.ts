import { namesASourceFile } from './explorerGraph'

/**
 * How the explorer reaches source code. The host owns this, because how a repository's files are
 * discovered is a property of the repository and its build, not of the viewer.
 *
 * `read` is async on purpose. The obvious implementation — an eager Vite glob with `?raw` — inlines
 * every matched file into the bundle, which is linear in repository size and puts private source
 * into a public artifact by default. An async contract lets a host load on demand instead: a lazy
 * glob, a generated manifest, a dev-server endpoint, or a source-control API.
 */
export interface SourceProvider {
  /** Resolves to the file's text, or undefined when the path is not readable (or is a directory). */
  read(sourcePath: string): Promise<string | undefined>
  /** An external link for the path — typically a repository browser. */
  urlFor(sourcePath: string): string | undefined
}

/**
 * Links a repository-relative path to GitHub, choosing `blob` or `tree` by whether the path names
 * a file. Hosts on other forges can supply their own `urlFor`.
 */
export function gitHubSourceUrl(repositoryUrl: string, branch = 'main') {
  const base = repositoryUrl.replace(/\/+$/, '')

  return (sourcePath: string) =>
    `${base}/${namesASourceFile(sourcePath) ? 'blob' : 'tree'}/${branch}/${sourcePath}`
}

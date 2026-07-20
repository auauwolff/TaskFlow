import type { Disposable } from '@/shared/ioc/core'

/**
 * The lifetime of an open project. It exposes a cancellation signal that project-scoped reads pass
 * to the transport, so leaving the project — which unmounts the workspace scope and disposes it —
 * aborts any request still in flight for the project you navigated away from.
 */
export interface ProjectWorkspace {
  readonly signal: AbortSignal
}

/**
 * Scoped implementation. The constructor is side-effect-free (a bare `AbortController`) so it is
 * safe under React Strict Mode's repeated evaluation; the meaningful teardown happens in
 * `dispose()`, which the container calls when the workspace scope unmounts.
 */
export class ProjectWorkspaceScope implements ProjectWorkspace, Disposable {
  readonly #controller = new AbortController()

  get signal(): AbortSignal {
    return this.#controller.signal
  }

  dispose(): void {
    this.#controller.abort()
  }
}

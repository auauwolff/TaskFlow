import { makeAutoObservable } from 'mobx'
import type { TaskStatus } from '../domain/task'

export type TaskFilter = 'all' | 'open' | 'completed'

/**
 * Project-scoped interaction state for the task workspace, and the repository's one deliberate
 * deviation from its own state-ownership rules.
 *
 * The filter is shareable, bookmarkable state that survives a reload, which makes it router
 * search-param state by those rules. It lives here instead because this store is what demonstrates
 * the scoped-service lifetime — a weak reason for it to own state the rules assign elsewhere, and
 * the cost is real: a deep link to a project loses the active filter.
 *
 * The intended resolution is to move `filter` into the route's `validateSearch` and delete this
 * store. Recorded here rather than quietly tolerated, because a rule with an unmarked exception
 * stops being a rule.
 */
export class TasksWorkspaceViewStore {
  filter: TaskFilter = 'all'

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  setFilter(filter: TaskFilter): void {
    this.filter = filter
  }

  shows(status: TaskStatus): boolean {
    if (this.filter === 'open') return status !== 'done'
    if (this.filter === 'completed') return status === 'done'
    return true
  }
}

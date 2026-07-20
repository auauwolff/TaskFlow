import { makeAutoObservable } from 'mobx'
import type { TaskStatus } from '../domain/task'

export type TaskFilter = 'all' | 'open' | 'completed'

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

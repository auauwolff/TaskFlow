import type { CurrentUserStorage } from '../application/ports'
import { userId } from '../domain/user'

const storageKey = 'taskflow.current-user-id'

export function createLocalCurrentUserStorage(storage: Storage): CurrentUserStorage {
  return {
    read: () => {
      const value = storage.getItem(storageKey)
      return value === null ? null : userId(value)
    },
    write: (id) => storage.setItem(storageKey, id),
    clear: () => storage.removeItem(storageKey),
  }
}

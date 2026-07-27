import type { UserId } from '@/shared/domain/identity'

export interface User {
  id: UserId
  name: string
  email: string
}

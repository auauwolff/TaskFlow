import { guidIdentifier } from '@/shared/domain/identifier'

declare const userIdBrand: unique symbol

export type UserId = string & { readonly [userIdBrand]: true }

export interface User {
  id: UserId
  name: string
  email: string
}

export const userId = guidIdentifier<UserId>('user ID')

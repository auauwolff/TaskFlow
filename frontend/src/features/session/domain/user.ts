declare const userIdBrand: unique symbol

export type UserId = string & { readonly [userIdBrand]: true }

export interface User {
  id: UserId
  name: string
  email: string
}

export function userId(value: string): UserId {
  return value as UserId
}

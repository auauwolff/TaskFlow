import type { AntiforgeryClient } from './antiforgery'
import type { ApiClient } from './client'
import { createServiceToken } from '../ioc/core'

export const apiClientToken = createServiceToken<ApiClient>('ApiClient')
export const antiforgeryClientToken =
  createServiceToken<AntiforgeryClient>('AntiforgeryClient')

import { createServiceToken } from '../ioc/core'
import type { GraphqlClient } from './client'

export const graphqlClientToken = createServiceToken<GraphqlClient>('GraphqlClient')

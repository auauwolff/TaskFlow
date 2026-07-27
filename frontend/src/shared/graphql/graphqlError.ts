import { AppError, type AppErrorKind } from '@/shared/errors/appError'

export interface GraphqlErrorLike {
  readonly message: string
  readonly extensions?: { readonly code?: unknown }
}

/**
 * The GraphQL twin of `shared/api/apiError.ts`. That module maps an HTTP status to an
 * `AppErrorKind`; this one maps a GraphQL error code to the same set, so a feature sees the same
 * error vocabulary whichever transport its gateway happens to use.
 *
 * The codes come from `TaskFlowGraphQLErrorFilter` on the backend. Before this existed, the client
 * discarded `extensions` entirely and labelled every GraphQL failure `'unexpected'` — so a task
 * mutation that lost an optimistic-concurrency race arrived as a generic error over GraphQL and as
 * `kind: 'conflict'` over REST. There is no codegen for these four strings; the two tables are kept
 * in one place per side and cross-referenced instead, because an enum in the schema is real
 * ceremony for four values.
 */
const kindByCode: Readonly<Record<string, AppErrorKind>> = {
  VALIDATION: 'validation',
  UNAUTHENTICATED: 'unauthorized',
  NOT_FOUND: 'not-found',
  CONFLICT: 'conflict',
  // GlobalExceptionHandler renders DomainException as 400, which apiError() reads as 'validation'.
  // Matching that keeps "a broken business rule" one kind, not two.
  BUSINESS_RULE: 'validation',
}

export function graphqlError(errors: readonly GraphqlErrorLike[]): AppError {
  const first = errors[0]
  const code = typeof first.extensions?.code === 'string' ? first.extensions.code : undefined

  return new AppError(first.message, (code === undefined ? undefined : kindByCode[code]) ?? 'unexpected')
}

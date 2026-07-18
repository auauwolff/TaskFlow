export type AppErrorKind =
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'network'
  | 'unexpected'

export class AppError extends Error {
  readonly kind: AppErrorKind
  readonly status?: number
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>

  constructor(
    message: string,
    kind: AppErrorKind,
    status?: number,
    fieldErrors: Readonly<Record<string, readonly string[]>> = {},
  ) {
    super(message)
    this.name = 'AppError'
    this.kind = kind
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

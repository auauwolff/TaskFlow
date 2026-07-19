import { AppError, type AppErrorKind } from '@/shared/errors/appError'

interface ProblemDetailsLike {
  title?: unknown
  detail?: unknown
  errors?: unknown
}

export function apiError(response: Response, body: unknown): AppError {
  const problem = isObject(body) ? (body as ProblemDetailsLike) : undefined
  const kind = errorKind(response.status)
  const message =
    stringValue(problem?.detail) ??
    stringValue(problem?.title) ??
    `The request failed with status ${response.status}.`

  return new AppError(message, kind, response.status, fieldErrors(problem?.errors))
}

export function networkError(error: unknown): Error {
  if (error instanceof DOMException && error.name === 'AbortError') return error
  if (error instanceof AppError) return error

  return new AppError(
    'TaskFlow could not reach the API. Check that the backend is running.',
    'network',
  )
}

function errorKind(status: number): AppErrorKind {
  if (status === 400) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  return 'unexpected'
}

function fieldErrors(value: unknown): Readonly<Record<string, readonly string[]>> {
  if (!isObject(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) && entry[1].every((item) => typeof item === 'string'),
    ),
  )
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

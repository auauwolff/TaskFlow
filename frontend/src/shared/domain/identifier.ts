import { AppError } from '@/shared/errors/appError'

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Builds a branded-identifier constructor that validates the GUID format the API emits.
 * Every entity ID is a `Guid` (`format: uuid`) on the wire, so validation belongs in one
 * place: this keeps "make illegal states unrepresentable" consistent across every feature
 * instead of each domain independently deciding whether to check the shape.
 *
 * `label` is woven into the error so a bad route param or DTO fails with a domain message.
 *
 * It throws `AppError`, not a bare `Error`, and the distinction is load-bearing: gateways call
 * these constructors inside the `try` block that ends in `networkError()`, which relabels any
 * unrecognised error as `kind: 'network'`. A bare `Error` therefore turned a permanently malformed
 * payload into "TaskFlow could not reach the API" — and, because the query client retries the
 * network kind, into three identical failing requests.
 */
export function guidIdentifier<TId extends string>(label: string): (value: string) => TId {
  return (value: string): TId => {
    if (!guidPattern.test(value))
      throw new AppError(`A valid ${label} is required.`, 'unexpected')

    return value as TId
  }
}

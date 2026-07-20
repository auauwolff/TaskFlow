const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Builds a branded-identifier constructor that validates the GUID format the API emits.
 * Every entity ID is a `Guid` (`format: uuid`) on the wire, so validation belongs in one
 * place: this keeps "make illegal states unrepresentable" consistent across every feature
 * instead of each domain independently deciding whether to check the shape.
 *
 * `label` is woven into the error so a bad route param or DTO fails with a domain message.
 */
export function guidIdentifier<TId extends string>(label: string): (value: string) => TId {
  return (value: string): TId => {
    if (!guidPattern.test(value)) throw new Error(`A valid ${label} is required.`)

    return value as TId
  }
}

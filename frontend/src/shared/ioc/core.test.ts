import { describe, expect, it, vi } from 'vitest'
import { createServiceToken, ServiceCollection } from './core'

describe('ServiceCollection', () => {
  it('resolves typed values', () => {
    const message = createServiceToken<string>('Message')
    const services = new ServiceCollection().value(message, 'hello').build()

    expect(services.get(message)).toBe('hello')
  })

  it('creates singletons eagerly and only once', () => {
    const service = createServiceToken<object>('Singleton')
    const create = vi.fn(() => ({}))
    const services = new ServiceCollection().singleton(service, create).build()

    expect(create).toHaveBeenCalledOnce()
    expect(services.get(service)).toBe(services.get(service))
  })

  it('creates a new transient for every resolution', () => {
    const service = createServiceToken<object>('Transient')
    const services = new ServiceCollection().transient(service, () => ({})).build()

    expect(services.get(service)).not.toBe(services.get(service))
  })

  it('shares one scoped instance within a scope', () => {
    const service = createServiceToken<object>('Scoped')
    const root = new ServiceCollection().scoped(service, () => ({})).build()
    const firstScope = root.createScope()
    const secondScope = root.createScope()

    expect(firstScope.get(service)).toBe(firstScope.get(service))
    expect(firstScope.get(service)).not.toBe(secondScope.get(service))
  })

  it('supports child overrides without changing the parent', () => {
    const message = createServiceToken<string>('Message')
    const root = new ServiceCollection().value(message, 'production').build()
    const testScope = root.createScope(services => services.value(message, 'test'))

    expect(root.get(message)).toBe('production')
    expect(testScope.get(message)).toBe('test')
  })

  it('resolves child overrides from inherited scoped factories', () => {
    const dependency = createServiceToken<string>('Dependency')
    const scoped = createServiceToken<string>('Scoped')
    const root = new ServiceCollection()
      .value(dependency, 'production')
      .scoped(scoped, services => services.get(dependency))
      .build()
    const child = root.createScope(services => services.value(dependency, 'test'))

    expect(root.get(scoped)).toBe('production')
    expect(child.get(scoped)).toBe('test')
  })

  it('keeps parent singletons independent from child overrides', () => {
    const dependency = createServiceToken<string>('Dependency')
    const singleton = createServiceToken<string>('Singleton')
    const root = new ServiceCollection()
      .value(dependency, 'production')
      .singleton(singleton, services => services.get(dependency))
      .build()
    const child = root.createScope(services => services.value(dependency, 'test'))

    expect(child.get(singleton)).toBe('production')
  })

  it('rejects missing and duplicate registrations', () => {
    const service = createServiceToken<string>('RequiredService')
    const registrations = new ServiceCollection().value(service, 'first')

    expect(() => registrations.value(service, 'second'))
      .toThrow("Service 'RequiredService' is already registered.")
    expect(() => new ServiceCollection().build().get(service))
      .toThrow("Service 'RequiredService' is not registered.")
  })

  it('reports circular dependency paths', () => {
    const first = createServiceToken<object>('First')
    const second = createServiceToken<object>('Second')
    const registrations = new ServiceCollection()
      .singleton(first, services => services.get(second))
      .singleton(second, services => services.get(first))

    expect(() => registrations.build())
      .toThrow('Circular service dependency: First -> Second -> First.')
  })

  it('prevents singletons from capturing scoped services', () => {
    const scoped = createServiceToken<object>('Scoped')
    const singleton = createServiceToken<object>('Singleton')
    const registrations = new ServiceCollection()
      .scoped(scoped, () => ({}))
      .singleton(singleton, services => services.get(scoped))

    expect(() => registrations.build())
      .toThrow("Singleton service 'Singleton' cannot depend on scoped service 'Scoped'.")
  })

  it('detects scoped capture through a transient dependency', () => {
    const scoped = createServiceToken<object>('Scoped')
    const transient = createServiceToken<object>('Transient')
    const singleton = createServiceToken<object>('Singleton')
    const registrations = new ServiceCollection()
      .scoped(scoped, () => ({}))
      .transient(transient, services => services.get(scoped))
      .singleton(singleton, services => services.get(transient))

    expect(() => registrations.build())
      .toThrow("Singleton service 'Singleton' cannot depend on scoped service 'Scoped'.")
  })
})

describe('ServiceContainer disposal', () => {
  it('disposes scoped instances created within the scope', () => {
    const token = createServiceToken<{ disposed: boolean; dispose(): void }>('Resource')
    const root = new ServiceCollection()
      .scoped(token, () => ({ disposed: false, dispose() { this.disposed = true } }))
      .build()
    const scope = root.createScope()
    const resource = scope.get(token)

    scope.dispose()

    expect(resource.disposed).toBe(true)
    expect(scope.isDisposed()).toBe(true)
  })

  it('does not dispose parent singletons when a child scope is disposed', () => {
    const token = createServiceToken<{ dispose: () => void }>('Singleton')
    const dispose = vi.fn()
    const root = new ServiceCollection().singleton(token, () => ({ dispose })).build()
    const scope = root.createScope()
    scope.get(token)

    scope.dispose()

    expect(dispose).not.toHaveBeenCalled()
  })

  it('disposes in reverse creation order so consumers release before dependencies', () => {
    const order: string[] = []
    const dependency = createServiceToken<{ dispose(): void }>('Dependency')
    const consumer = createServiceToken<{ dispose(): void }>('Consumer')
    const root = new ServiceCollection()
      .scoped(dependency, () => ({ dispose: () => order.push('dependency') }))
      .scoped(consumer, services => {
        services.get(dependency)
        return { dispose: () => order.push('consumer') }
      })
      .build()
    const scope = root.createScope()
    scope.get(consumer)

    scope.dispose()

    expect(order).toEqual(['consumer', 'dependency'])
  })

  it('is idempotent', () => {
    const token = createServiceToken<{ dispose: () => void }>('Resource')
    const dispose = vi.fn()
    const scope = new ServiceCollection().scoped(token, () => ({ dispose })).build().createScope()
    scope.get(token)

    scope.dispose()
    scope.dispose()

    expect(dispose).toHaveBeenCalledOnce()
  })

  it('rejects resolution after disposal', () => {
    const token = createServiceToken<string>('Message')
    const scope = new ServiceCollection().value(token, 'hi').build().createScope()
    scope.dispose()

    expect(() => scope.get(token)).toThrow('This service scope has been disposed.')
  })

  it('never retains or disposes transient instances', () => {
    const token = createServiceToken<{ dispose: () => void }>('Transient')
    const dispose = vi.fn()
    const scope = new ServiceCollection().transient(token, () => ({ dispose })).build().createScope()
    scope.get(token)

    scope.dispose()

    expect(dispose).not.toHaveBeenCalled()
  })
})

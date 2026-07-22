const serviceType = Symbol('serviceType')

export interface ServiceToken<T> {
  readonly key: symbol
  readonly name: string
  readonly [serviceType]: (value: T) => T
}

export interface ServiceResolver {
  get<T>(token: ServiceToken<T>): T
}

export interface StableServiceResolver extends ServiceResolver {
  getStable<T>(token: ServiceToken<T>): T
}

/**
 * A service that owns a resource (subscription, AbortController, timer) which must be released
 * when its container is torn down. Container-owned singleton and scoped instances implementing
 * this are disposed automatically when their owning container is disposed. Values and transient
 * instances are caller-owned and are not retained or disposed by the container.
 */
export interface Disposable {
  dispose(): void
}

export class ServiceRegistrationError extends Error {
  readonly tokenName: string

  constructor(
    message: string,
    tokenName: string,
  ) {
    super(message)
    this.name = 'ServiceRegistrationError'
    this.tokenName = tokenName
  }
}

export class ServiceResolutionError extends Error {
  readonly tokenName: string | undefined
  readonly resolutionPath: readonly string[]

  constructor(
    message: string,
    tokenName?: string,
    resolutionPath: readonly string[] = [],
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'ServiceResolutionError'
    this.tokenName = tokenName
    this.resolutionPath = resolutionPath
  }
}

export class ServiceScopeUnavailableError extends Error {
  constructor() {
    super('This service scope or one of its ancestors has been disposed.')
    this.name = 'ServiceScopeUnavailableError'
  }
}

export type ConfigureServices = (services: ServiceCollection) => void

export interface ServiceScopeResolver extends StableServiceResolver {
  createScope(configure?: ConfigureServices): ServiceScopeResolver
  dispose(): void
  isDisposed(): boolean
  isUsable(): boolean
}

export type ServiceFactory<T> = (services: ServiceResolver) => T

type ServiceLifetime = 'singleton' | 'scoped' | 'transient'

interface Registration {
  readonly create: ServiceFactory<unknown>
  readonly lifetime: ServiceLifetime
  readonly owned: boolean
  readonly token: ServiceToken<unknown>
}

interface RegistrationMatch {
  readonly owner: ServiceContainer
  readonly registration: Registration
}

interface ResolutionFrame {
  readonly lifetime: ServiceLifetime
  readonly token: ServiceToken<unknown>
}

export function createServiceToken<T>(name: string): ServiceToken<T> {
  const normalizedName = name.trim()
  if (normalizedName.length === 0) throw new Error('A service token name is required.')

  return Object.freeze({
    key: Symbol(normalizedName),
    name: normalizedName,
    [serviceType]: (value: T) => value,
  })
}

function isDisposable(value: unknown): value is Disposable {
  return (
    typeof value === 'object'
    && value !== null
    && 'dispose' in value
    && typeof (value as { dispose: unknown }).dispose === 'function'
  )
}

export class ServiceCollection {
  readonly #registrations = new Map<symbol, Registration>()

  /** Registers a caller-owned value. Disposing the container never disposes the supplied value. */
  value<T>(token: ServiceToken<T>, value: T): this {
    return this.add(token, 'singleton', false, () => value)
  }

  singleton<T>(token: ServiceToken<T>, create: ServiceFactory<T>): this {
    return this.add(token, 'singleton', true, create)
  }

  scoped<T>(token: ServiceToken<T>, create: ServiceFactory<T>): this {
    return this.add(token, 'scoped', true, create)
  }

  transient<T>(token: ServiceToken<T>, create: ServiceFactory<T>): this {
    return this.add(token, 'transient', false, create)
  }

  build(): ServiceContainer {
    return this.buildWithParent(null)
  }

  buildWithParent(parent: ServiceContainer | null): ServiceContainer {
    const container = new ServiceContainer(new Map(this.#registrations), parent)
    try {
      container.initializeStableServices()
      return container
    } catch (initializationError) {
      try {
        container.dispose()
      } catch (disposalError) {
        throw new AggregateError(
          [initializationError, disposalError],
          'Service initialization failed and one or more created services failed to dispose.',
        )
      }

      throw initializationError
    }
  }

  private add<T>(
    token: ServiceToken<T>,
    lifetime: ServiceLifetime,
    owned: boolean,
    create: ServiceFactory<T>,
  ): this {
    if (this.#registrations.has(token.key))
      throw new ServiceRegistrationError(`Service '${token.name}' is already registered.`, token.name)

    this.#registrations.set(token.key, {
      create: create as ServiceFactory<unknown>,
      lifetime,
      owned,
      token: token as ServiceToken<unknown>,
    })
    return this
  }
}

export class ServiceContainer implements ServiceScopeResolver {
  readonly #parent: ServiceContainer | null
  readonly #registrations: ReadonlyMap<symbol, Registration>
  readonly #scopedInstances = new Map<symbol, unknown>()
  readonly #singletonInstances = new Map<symbol, unknown>()
  readonly #disposables: Disposable[] = []
  readonly #trackedDisposables = new Set<Disposable>()
  #disposed = false

  constructor(
    registrations: ReadonlyMap<symbol, Registration>,
    parent: ServiceContainer | null,
  ) {
    this.#registrations = registrations
    this.#parent = parent
  }

  get<T>(token: ServiceToken<T>): T {
    this.throwIfDisposed()
    return this.resolve(token, [])
  }

  getStable<T>(token: ServiceToken<T>): T {
    this.throwIfDisposed()
    const match = this.findRegistration(token)
    if (match === null)
      throw new ServiceResolutionError(`Service '${token.name}' is not registered.`, token.name)
    if (match.registration.lifetime === 'transient')
      throw new ServiceResolutionError(
        `Transient service '${token.name}' cannot be resolved during React render.`,
        token.name,
      )

    const instances = match.registration.lifetime === 'singleton'
      ? match.owner.#singletonInstances
      : this.#scopedInstances
    if (!instances.has(token.key))
      throw new ServiceResolutionError(
        `Stable service '${token.name}' was not initialized before React render.`,
        token.name,
      )

    return instances.get(token.key) as T
  }

  createScope(configure?: ConfigureServices): ServiceContainer {
    this.throwIfDisposed()
    const services = new ServiceCollection()
    configure?.(services)
    return services.buildWithParent(this)
  }

  /**
   * Releases every disposable instance this container created, in reverse creation order so a
   * consumer is torn down before the dependency it was built from. A container only disposes its
   * own instances: disposing a scope never touches the parent's singletons, and disposing a parent
   * invalidates but does not dispose its caller-owned child scopes. Idempotent — a second call is a
   * no-op, which keeps React Strict Mode's setup/cleanup/setup cycle safe.
   */
  dispose(): void {
    if (this.#disposed) return
    this.#disposed = true

    const errors: unknown[] = []
    for (let index = this.#disposables.length - 1; index >= 0; index--) {
      try {
        this.#disposables[index].dispose()
      } catch (error) {
        errors.push(error)
      }
    }

    this.#disposables.length = 0
    this.#trackedDisposables.clear()
    this.#scopedInstances.clear()
    this.#singletonInstances.clear()

    if (errors.length > 0)
      throw new AggregateError(errors, 'One or more services failed to dispose.')
  }

  /**
   * True once THIS container has been disposed and its retained instances released. A child whose
   * ancestor was disposed still reports false here: it is unusable (see isUsable) but holds its
   * resources until its owner calls dispose(). Guarding dispose() behind !isDisposed() is therefore
   * always safe; guarding it behind !isUsable() would leak an invalidated child's resources.
   */
  isDisposed(): boolean {
    return this.#disposed
  }

  /** False once this container or any ancestor has been disposed; resolution then throws. */
  isUsable(): boolean {
    if (this.#disposed) return false
    return this.#parent === null || this.#parent.isUsable()
  }

  private throwIfDisposed(): void {
    if (!this.isUsable()) throw new ServiceScopeUnavailableError()
  }

  /**
   * Eagerly instantiates every singleton registered here and every scoped registration visible
   * through the parent chain. This is the trade that makes getStable() legal during React render:
   * all instantiation (a side effect) happens at container creation, so render-time resolution is
   * a pure cache read. The cost is deliberate and worth knowing: each new scope also instantiates
   * ancestor-scoped registrations its subtree may never touch, so scoped constructors must stay
   * cheap and resource-free (see ServiceScope in react.tsx for the companion rule).
   */
  initializeStableServices(): void {
    for (const registration of this.#registrations.values()) {
      if (registration.lifetime === 'singleton') this.get(registration.token)
    }

    for (const registration of this.getEffectiveRegistrations().values()) {
      if (registration.lifetime === 'scoped') this.get(registration.token)
    }
  }

  private resolve<T>(token: ServiceToken<T>, stack: ResolutionFrame[]): T {
    const match = this.findRegistration(token)
    if (match === null) {
      const path = [...stack.map(frame => frame.token.name), token.name]
      throw new ServiceResolutionError(
        `Service '${token.name}' is not registered.`,
        token.name,
        path,
      )
    }

    const cycleIndex = stack.findIndex(frame => frame.token.key === token.key)
    if (cycleIndex >= 0) {
      const path = [...stack.slice(cycleIndex).map(frame => frame.token.name), token.name]
      throw new ServiceResolutionError(
        `Circular service dependency: ${path.join(' -> ')}.`,
        token.name,
        path,
      )
    }

    if (
      match.registration.lifetime === 'scoped'
      && stack.some(frame => frame.lifetime === 'singleton')
    ) {
      const singleton = stack.find(frame => frame.lifetime === 'singleton')!
      const path = [...stack.map(frame => frame.token.name), token.name]
      throw new ServiceResolutionError(
        `Singleton service '${singleton.token.name}' cannot depend on scoped service '${token.name}'.`,
        token.name,
        path,
      )
    }

    if (match.registration.lifetime === 'singleton') {
      match.owner.throwIfDisposed()
      return match.owner.resolveCached(token, match.registration, stack, match.owner.#singletonInstances)
    }

    if (match.registration.lifetime === 'scoped')
      return this.resolveCached(token, match.registration, stack, this.#scopedInstances)

    return this.create<T>(match.registration, stack)
  }

  private resolveCached<T>(
    token: ServiceToken<T>,
    registration: Registration,
    stack: ResolutionFrame[],
    instances: Map<symbol, unknown>,
  ): T {
    if (instances.has(token.key)) return instances.get(token.key) as T

    const instance = this.create<T>(registration, stack)
    instances.set(token.key, instance)
    // Retained singleton and scoped instances are disposed with this container. Transients skip
    // resolveCached, so the container never holds them and never disposes them.
    if (
      registration.owned
      && isDisposable(instance)
      && !this.#trackedDisposables.has(instance)
    ) {
      this.#trackedDisposables.add(instance)
      this.#disposables.push(instance)
    }
    return instance
  }

  private create<T>(
    registration: Registration,
    stack: ResolutionFrame[],
  ): T {
    const nextStack = [...stack, { lifetime: registration.lifetime, token: registration.token }]
    const resolver: ServiceResolver = {
      get: <TDependency>(dependency: ServiceToken<TDependency>) =>
        this.resolve(dependency, nextStack),
    }
    try {
      return registration.create(resolver) as T
    } catch (error) {
      if (error instanceof ServiceResolutionError || error instanceof ServiceScopeUnavailableError)
        throw error

      const path = nextStack.map(frame => frame.token.name)
      throw new ServiceResolutionError(
        `Failed to construct service '${registration.token.name}'.`,
        registration.token.name,
        path,
        { cause: error },
      )
    }
  }

  private findRegistration<T>(token: ServiceToken<T>): RegistrationMatch | null {
    const registration = this.#registrations.get(token.key)
    if (registration !== undefined) return { owner: this, registration }

    return this.#parent?.findRegistration(token) ?? null
  }

  private getEffectiveRegistrations(): Map<symbol, Registration> {
    const registrations = this.#parent?.getEffectiveRegistrations() ?? new Map<symbol, Registration>()
    for (const [key, registration] of this.#registrations) registrations.set(key, registration)
    return registrations
  }
}

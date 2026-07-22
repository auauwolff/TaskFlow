/* oxlint-disable react/only-export-components -- Package entry exports its provider and consumer hook. */
import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type Key,
  type PropsWithChildren,
} from 'react'
import type { ConfigureServices, ServiceScopeResolver, ServiceToken } from './core'

const ServiceContext = createContext<ServiceScopeResolver | null>(null)
const ManagedScopeContext = createContext(false)

interface ServiceProviderProps extends PropsWithChildren {
  services: ServiceScopeResolver
}

interface ServiceScopeProviderProps extends PropsWithChildren {
  configure?: ConfigureServices
  scopeKey?: Key
}

export function ServiceProvider({ services, children }: ServiceProviderProps) {
  const initialServices = useRef(services)
  if (initialServices.current !== services)
    throw new Error('ServiceProvider services cannot change while mounted. Remount the provider instead.')
  if (!services.isUsable())
    throw new Error('ServiceProvider requires a usable service scope for its complete mounted lifetime.')

  // An externally owned container resets the DI lineage for this subtree. Its caller guarantees
  // stable identity and keeps the supplied scope and its ancestors alive until descendants unmount.
  return (
    <ManagedScopeContext value={false}>
      <ServiceContext value={services}>{children}</ServiceContext>
    </ManagedScopeContext>
  )
}

export function ServiceScopeProvider({
  configure,
  scopeKey = 'default',
  children,
}: ServiceScopeProviderProps) {
  const insideManagedScope = use(ManagedScopeContext)
  if (insideManagedScope)
    throw new Error(
      'Nested ServiceScopeProvider components are not supported. Create the nested scope externally.',
    )

  return (
    <ManagedScopeContext value>
      <ServiceScope key={scopeKey} configure={configure}>
        {children}
      </ServiceScope>
    </ManagedScopeContext>
  )
}

function ServiceScope({ configure, children }: Omit<ServiceScopeProviderProps, 'scopeKey'>) {
  const parent = useRequiredServices()
  const initialInputs = useRef({ configure, parent })
  if (initialInputs.current.configure !== configure || initialInputs.current.parent !== parent)
    throw new Error(
      'ServiceScopeProvider inputs cannot change while mounted. Change scopeKey to remount it.',
    )
  // Known limitation: Strict Mode double-invokes this initializer and discards one result, and
  // the discarded scope is never disposed — there is no React hook for "this render was thrown
  // away". The consequence is a rule, enforced by convention: scoped service constructors must
  // be resource-free (memory only). Anything that opens a subscription, socket, or timer must
  // acquire it lazily on first use and release it in dispose(), so a discarded scope holds
  // nothing worth releasing.
  const [scope, setScope] = useState(() => parent.createScope(configure))
  const scopeRef = useRef(scope)
  scopeRef.current = scope

  // Dispose the scope, and everything it created, when this subtree unmounts. The effect deps are
  // the stable inputs (a changing `scopeKey` remounts the whole component instead), so cleanup runs
  // on real unmount rather than on every render. React Strict Mode runs setup/cleanup/setup on
  // mount: the first cleanup disposes the scope, so the second setup rebuilds it, keeping the live
  // tree rendering against a usable scope.
  useEffect(() => {
    if (scopeRef.current.isDisposed()) {
      const rebuilt = parent.createScope(configure)
      scopeRef.current = rebuilt
      setScope(rebuilt)
    }

    return () => scopeRef.current.dispose()
  }, [parent, configure])

  return <ServiceContext value={scope}>{children}</ServiceContext>
}

export function useService<T>(token: ServiceToken<T>): T {
  return useRequiredServices().getStable(token)
}

function useRequiredServices(): ServiceScopeResolver {
  const services = use(ServiceContext)
  if (services === null) throw new Error('ServiceProvider is not configured.')
  return services
}

/* oxlint-disable react/only-export-components -- Package entry exports its provider and consumer hook. */
import { createContext, use, useState, type Key, type PropsWithChildren } from 'react'
import type { ConfigureServices, ServiceScopeResolver, ServiceToken } from './core'

const ServiceContext = createContext<ServiceScopeResolver | null>(null)

interface ServiceProviderProps extends PropsWithChildren {
  services: ServiceScopeResolver
}

interface ServiceScopeProviderProps extends PropsWithChildren {
  configure?: ConfigureServices
  scopeKey?: Key
}

export function ServiceProvider({ services, children }: ServiceProviderProps) {
  return <ServiceContext value={services}>{children}</ServiceContext>
}

export function ServiceScopeProvider({
  configure,
  scopeKey = 'default',
  children,
}: ServiceScopeProviderProps) {
  return (
    <ServiceScope key={scopeKey} configure={configure}>
      {children}
    </ServiceScope>
  )
}

function ServiceScope({ configure, children }: Omit<ServiceScopeProviderProps, 'scopeKey'>) {
  const parent = useRequiredServices()
  const [services] = useState(() => parent.createScope(configure))

  return <ServiceContext value={services}>{children}</ServiceContext>
}

export function useService<T>(token: ServiceToken<T>): T {
  return useRequiredServices().getStable(token)
}

function useRequiredServices(): ServiceScopeResolver {
  const services = use(ServiceContext)
  if (services === null) throw new Error('ServiceProvider is not configured.')
  return services
}

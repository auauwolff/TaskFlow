// @vitest-environment jsdom
import { StrictMode } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createServiceToken,
  ServiceCollection,
  type ConfigureServices,
  type Disposable,
} from './core'
import { ServiceProvider, ServiceScopeProvider, useService } from './react'

const resourceToken = createServiceToken<Disposable & { id: number }>('Resource')
const nestedResourceToken = createServiceToken<Disposable & { id: number }>('NestedResource')

function Consumer() {
  useService(resourceToken)
  return null
}

function NestedConsumer() {
  useService(resourceToken)
  useService(nestedResourceToken)
  return null
}

afterEach(cleanup)

describe('ServiceScopeProvider lifecycle', () => {
  it('rejects replacing root services without remounting the provider', () => {
    const first = new ServiceCollection().build()
    const second = new ServiceCollection().build()
    const view = render(<ServiceProvider services={first}>content</ServiceProvider>)

    expect(() => view.rerender(
      <ServiceProvider services={second}>content</ServiceProvider>,
    )).toThrow(
      'ServiceProvider services cannot change while mounted. Remount the provider instead.',
    )
  })

  it('rejects an unavailable externally owned scope', () => {
    const root = new ServiceCollection().build()
    const scope = root.createScope()
    root.dispose()

    expect(() => render(
      <ServiceProvider services={scope}>content</ServiceProvider>,
    )).toThrow(
      'ServiceProvider requires a usable service scope for its complete mounted lifetime.',
    )

    scope.dispose()
  })

  it('rejects replacing scope configuration without changing scopeKey', () => {
    const root = new ServiceCollection().build()
    const first: ConfigureServices = () => {}
    const second: ConfigureServices = () => {}
    const view = render(
      <ServiceProvider services={root}>
        <ServiceScopeProvider configure={first}>content</ServiceScopeProvider>
      </ServiceProvider>,
    )

    expect(() => view.rerender(
      <ServiceProvider services={root}>
        <ServiceScopeProvider configure={second}>content</ServiceScopeProvider>
      </ServiceProvider>,
    )).toThrow(
      'ServiceScopeProvider inputs cannot change while mounted. Change scopeKey to remount it.',
    )
  })

  it('disposes scoped services when the scope unmounts', () => {
    const dispose = vi.fn()
    const root = new ServiceCollection().build()
    const configure: ConfigureServices = services =>
      services.scoped(resourceToken, () => ({ id: 1, dispose }))

    const view = render(
      <ServiceProvider services={root}>
        <ServiceScopeProvider configure={configure}>
          <Consumer />
        </ServiceScopeProvider>
      </ServiceProvider>,
    )

    expect(dispose).not.toHaveBeenCalled()

    view.unmount()

    expect(dispose).toHaveBeenCalledOnce()
  })

  it('rebuilds and disposes the previous scope when scopeKey changes', () => {
    const disposed: number[] = []
    let nextId = 0
    const root = new ServiceCollection().build()
    const configure: ConfigureServices = services =>
      services.scoped(resourceToken, () => {
        const id = ++nextId
        return { id, dispose: () => disposed.push(id) }
      })

    const view = render(
      <ServiceProvider services={root}>
        <ServiceScopeProvider scopeKey="first" configure={configure}>
          <Consumer />
        </ServiceScopeProvider>
      </ServiceProvider>,
    )

    view.rerender(
      <ServiceProvider services={root}>
        <ServiceScopeProvider scopeKey="second" configure={configure}>
          <Consumer />
        </ServiceScopeProvider>
      </ServiceProvider>,
    )

    expect(disposed).toContain(1)

    view.unmount()

    expect(disposed).toContain(2)
  })

  it('renders against a live scope under StrictMode re-invocation', () => {
    const root = new ServiceCollection().build()
    const configure: ConfigureServices = services =>
      services.scoped(resourceToken, () => ({ id: 1, dispose: () => {} }))

    // If the Strict Mode setup/cleanup/setup cycle left a disposed scope in place, useService
    // (a stable read) would throw during render. Reaching commit proves the scope self-healed.
    expect(() =>
      render(
        <StrictMode>
          <ServiceProvider services={root}>
            <ServiceScopeProvider configure={configure}>
              <Consumer />
            </ServiceScopeProvider>
          </ServiceProvider>
        </StrictMode>,
      ),
    ).not.toThrow()
  })

  it('allows a managed scope below an externally owned boundary', () => {
    const root = new ServiceCollection().build()
    const disposedExternalInstances: number[] = []
    const inheritedIds: number[] = []
    let nextExternalInstance = 0
    const configureOuter: ConfigureServices = services =>
      services.scoped(resourceToken, () => ({ id: 1, dispose: () => {} }))
    const external = root.createScope(services =>
      services.scoped(resourceToken, () => {
        const instance = ++nextExternalInstance
        return { id: 2, dispose: () => disposedExternalInstances.push(instance) }
      }))
    const configureInner: ConfigureServices = services =>
      services.scoped(nestedResourceToken, resolver => {
        inheritedIds.push(resolver.get(resourceToken).id)
        return { id: 3, dispose: () => {} }
      })

    // JSX placement does not establish scope parentage. The explicit ServiceProvider switches this
    // subtree from the outer managed lineage to the independently created external lineage.
    let view: ReturnType<typeof render> | undefined
    expect(() => {
      view = render(
        <StrictMode>
          <ServiceProvider services={root}>
            <ServiceScopeProvider configure={configureOuter}>
              <ServiceProvider services={external}>
                <ServiceScopeProvider configure={configureInner}>
                  <NestedConsumer />
                </ServiceScopeProvider>
              </ServiceProvider>
            </ServiceScopeProvider>
          </ServiceProvider>
        </StrictMode>,
      )
    }).not.toThrow()

    expect(inheritedIds.length).toBeGreaterThan(0)
    expect(inheritedIds.every(id => id === 2)).toBe(true)
    expect(disposedExternalInstances).not.toContain(1)

    view!.unmount()
    expect(disposedExternalInstances).not.toContain(1)

    external.dispose()
    root.dispose()
    expect(disposedExternalInstances).toContain(1)
  })

  it('rejects nested managed scopes with an actionable error', () => {
    const root = new ServiceCollection().build()
    const configureOuter: ConfigureServices = services =>
      services.scoped(resourceToken, () => ({ id: 1, dispose: () => {} }))
    const configureInner: ConfigureServices = services =>
      services.scoped(nestedResourceToken, () => ({ id: 2, dispose: () => {} }))

    expect(() =>
      render(
        <StrictMode>
          <ServiceProvider services={root}>
            <ServiceScopeProvider configure={configureOuter}>
              <ServiceScopeProvider configure={configureInner}>
                <NestedConsumer />
              </ServiceScopeProvider>
            </ServiceScopeProvider>
          </ServiceProvider>
        </StrictMode>,
      ),
    ).toThrow(
      'Nested ServiceScopeProvider components are not supported. Create the nested scope externally.',
    )
  })
})

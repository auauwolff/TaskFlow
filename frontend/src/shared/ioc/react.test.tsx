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

function Consumer() {
  useService(resourceToken)
  return null
}

afterEach(cleanup)

describe('ServiceScopeProvider lifecycle', () => {
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
})

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createServiceToken, ServiceCollection } from './core'
import { ServiceProvider, ServiceScopeProvider, useService } from './react'

describe('ServiceProvider', () => {
  it('makes typed services available to descendants', () => {
    const message = createServiceToken<string>('Message')
    const services = new ServiceCollection().value(message, 'hello').build()

    function Consumer() {
      return createElement('span', null, useService(message))
    }

    const markup = renderToStaticMarkup(
      createElement(ServiceProvider, { services }, createElement(Consumer)),
    )

    expect(markup).toBe('<span>hello</span>')
  })

  it('fails clearly when the provider is missing', () => {
    const message = createServiceToken<string>('Message')

    function Consumer() {
      return createElement('span', null, useService(message))
    }

    expect(() => renderToStaticMarkup(createElement(Consumer)))
      .toThrow('ServiceProvider is not configured.')
  })

  it('does not construct transient services during render', () => {
    const transient = createServiceToken<object>('Transient')
    const services = new ServiceCollection().transient(transient, () => ({})).build()

    function Consumer() {
      useService(transient)
      return null
    }

    expect(() => renderToStaticMarkup(
      createElement(ServiceProvider, { services }, createElement(Consumer)),
    )).toThrow("Transient service 'Transient' cannot be resolved during React render.")
  })

  it('inherits root services and applies local overrides', () => {
    const inherited = createServiceToken<string>('Inherited')
    const overridable = createServiceToken<string>('Overridable')
    const root = new ServiceCollection()
      .value(inherited, 'root')
      .value(overridable, 'root')
      .build()

    function Consumer() {
      return createElement(
        'span',
        null,
        `${useService(inherited)}:${useService(overridable)}`,
      )
    }

    const markup = renderToStaticMarkup(
      createElement(
        ServiceProvider,
        { services: root },
        createElement(
          ServiceScopeProvider,
          { configure: services => services.value(overridable, 'scope') },
          createElement(Consumer),
        ),
      ),
    )

    expect(markup).toBe('<span>root:scope</span>')
  })

  it('isolates scoped instances between sibling providers', () => {
    const scoped = createServiceToken<number>('Scoped')
    let created = 0
    const root = new ServiceCollection().scoped(scoped, () => ++created).build()

    function Consumer() {
      return createElement('span', null, useService(scoped))
    }

    const markup = renderToStaticMarkup(
      createElement(
        ServiceProvider,
        { services: root },
        createElement(
          'div',
          null,
          createElement(ServiceScopeProvider, null, createElement(Consumer)),
          createElement(ServiceScopeProvider, null, createElement(Consumer)),
        ),
      ),
    )

    expect(markup).toBe('<div><span>2</span><span>3</span></div>')
  })
})

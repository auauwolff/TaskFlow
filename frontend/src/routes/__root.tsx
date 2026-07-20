/* oxlint-disable react/only-export-components -- Route modules export TanStack's route contract. */
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="shell">
      <header className="site-header">
        <Link className="wordmark" to="/">TaskFlow</Link>
        <nav className="site-nav">
          <Link to="/architecture" activeProps={{ className: 'is-active' }}>Architecture</Link>
          <p className="phase">React adapter / ASP.NET core</p>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

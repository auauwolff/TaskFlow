/* oxlint-disable react/only-export-components -- Route modules export TanStack's route contract. */
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="shell">
      <header className="site-header">
        <span className="wordmark">TaskFlow</span>
        <p className="phase">React adapter / ASP.NET core</p>
      </header>
      <Outlet />
    </div>
  )
}

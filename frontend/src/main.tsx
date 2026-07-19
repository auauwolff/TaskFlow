import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { AppProviders } from '@/app/AppProviders'
import { createApplication } from '@/app/composition'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({ routeTree })
const application = createApplication()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders application={application}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)

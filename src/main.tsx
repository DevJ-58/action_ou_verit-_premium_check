import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { listenForInstall } from '@/features/install/installStore'
import '@/design-system/fonts'
import '@/styles/index.css'

listenForInstall()

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { createRoot } from 'react-dom/client'
import Header from '@/components/header'
import { Toaster } from '@/components/ui/sonner'
const root = createRoot(document.body)
root.render(
  <>
    <Toaster richColors position='top-center' />
    <Header />
  </>
)

import { type IpcRenderer } from 'electron'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
declare global {
  interface Window {
    ipc: IpcRenderer
  }
}
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  LoaderIcon,
  MaximizeIcon,
  MinimizeIcon,
  MinusIcon,
  XIcon
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Toolbar from '@/components/toolbar'
import { useBoundStore } from '@/store/use-bound-store'
import { cn } from '@/lib/utils'

export default function Header() {
  const tabs = useBoundStore((state) => state.tabs.items)
  const updateTabs = useBoundStore((state) => state.tabs.update)
  const selectedTab = useBoundStore((state) => state.tabs.selectedTabId)
  const remove = useBoundStore((state) => state.tabs.remove)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoFoward, setCanGoFoward] = useState(false)
  const [windowState, setWindowState] = useState<'minimized' | 'maximized'>('minimized')

  useEffect(() => {
    if (!window.ipc) return null
    window.ipc.on('arrow-navigation', (_, navigation) => {
      const navigationTyped = navigation as { canGoBack: boolean; canGoFoward: boolean }
      setCanGoBack(navigationTyped.canGoBack)
      setCanGoFoward(navigationTyped.canGoFoward)
    })
    window.ipc.on('isMaximized', () => setWindowState('maximized'))
    window.ipc.on('isRestored', () => setWindowState('minimized'))
    window.ipc.on('close-current-tab', () => {
      remove(selectedTab)
    })
    window.ipc.on('update-tab-name', (_, data) => {
      if (!data.name) return
      updateTabs(data)
    })

    return () => {
      window.ipc.removeAllListeners()
    }
  }, [selectedTab, tabs, updateTabs, remove])
  if (!window.ipc) return null
  return (
    <Card className={cn('titleBar py-0 gap-0 z-[999] rounded-b-none')}>
      <CardContent className={cn("relative h-full flex items-center justify-between max-w-screen overflow-hidden", window.isDarwin  && "flex-row-reverse")}>
        <div className={cn("flex items-center justify-start w-fit min-w-fit", window.isDarwin  && "flex-row-reverse")}>
          <img src={'static://assets/icon.ico'} alt="Icon amaranzero" className="w-6 h-6 mr-2" />
          <div className={cn("flex items-center justify-start", window.isDarwin  && "flex-row")}>
            <Button
              className="titlebar-button"
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canGoBack}
              onClick={() => window.ipc.send('backApp')}
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canGoFoward}
              onClick={() => window.ipc.send('forwardApp')}
            >
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
        <Toolbar />
        <div className="flex items-center gap-1 w-fit min-w-fit">
          <Button
            className="titlebar-button mr-3"
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => window.ipc.send('reloadApp')}
          >
            <LoaderIcon className="size-4" />
          </Button>
          {!window.isDarwin && (
            <>
              <Button
                className="titlebar-button"
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => window.ipc.send('minimizeApp')}
              >
                <MinusIcon className="size-4" />
              </Button>
              <Button
                className="titlebar-button"
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => window.ipc.send('maximizeApp')}
              >
                {windowState === 'maximized' ? (
                  <MinimizeIcon className="size-4" />
                ) : (
                  <MaximizeIcon className="size-4" />
                )}
              </Button>
              <Button
                className="titlebar-button"
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => window.ipc.send('closeApp')}
              >
                <XIcon className="size-4" />
              </Button>
            </>
          )}
          
        </div>
      </CardContent>
    </Card>
  )
}

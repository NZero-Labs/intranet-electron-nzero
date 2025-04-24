import { type IpcRenderer } from "electron";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
declare global {
  interface Window {
    ipc: IpcRenderer
  }
}
import { ArrowLeftIcon, ArrowRightIcon, LoaderIcon, MaximizeIcon, MinimizeIcon, MinusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Toolbar from "@/components/toolbar";
import { useBoundStore } from "@/store/use-bound-store";
import { cn } from "@/lib/utils";

export default function Header(){
  const tabs = useBoundStore((state) => state.tabs.items)
  const setTabs = useBoundStore((state) => state.tabs.reorder)
  const selectedTab = useBoundStore((state) => state.tabs.selectedTabId)
  const remove = useBoundStore((state) => state.tabs.remove)
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoFoward, setCanGoFoward] = useState(false);
  const [windowState, setWindowState] = useState<"minimized" | "maximized">("minimized");
  
  useEffect(()=> {
    if(!window.ipc) return null;
    window.ipc.on("arrow-navigation", (_, navigation) => {
      const navigationTyped = navigation as { canGoBack: boolean; canGoFoward: boolean };
      setCanGoBack(navigationTyped.canGoBack);
      setCanGoFoward(navigationTyped.canGoFoward);
    })
    window.ipc.on("isMaximized", () => setWindowState("maximized"));
    window.ipc.on("isRestored", () => setWindowState("minimized"));
    window.ipc.on('close-current-tab', () => {
      remove(selectedTab)
    })
    window.ipc.on('update-tab-title', (_, data) => {
      if(!data.title) return;
      const newTabs = tabs.map((tab) => {
        if(tab.id === selectedTab){
          return {
            ...tab,
            name: data.title
          }
        }
        return tab
      })
      setTabs(newTabs)
    })

    return () => {
      window.ipc.removeAllListeners('arrow-navigation')
      window.ipc.removeAllListeners('isMaximized')
      window.ipc.removeAllListeners('isRestored')
      window.ipc.removeAllListeners('close-current-tab')
      window.ipc.removeAllListeners('update-tab-title')
    }
  }, [selectedTab, tabs, setTabs, remove])
  if(!window.ipc) return null;
  return(
    <Card className={cn("titleBar py-0 gap-0 z-[999] rounded-b-none")}>
      <CardContent className="relative h-full flex items-center justify-between max-w-screen overflow-hidden">
        <div className="flex items-center justify-start w-fit min-w-fit">
          <img src={"static://assets/icon.ico"} alt="Icon amaranzero" className="w-6 h-6 mr-2" />
          <Button 
            className="titlebar-button"
            type="button" 
            variant="ghost" 
            size="icon" 
            disabled={!canGoBack} 
            onClick={() => window.ipc.send("backApp")}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            disabled={!canGoFoward} 
            onClick={() => window.ipc.send("forwardApp")}
          >
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
        <Toolbar />
        <div className="flex items-center gap-1 w-fit min-w-fit">
          <Button 
            className="titlebar-button mr-3" 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => window.ipc.send("reloadApp")}
          >
            <LoaderIcon className="size-4" />
          </Button>
          <Button 
            className="titlebar-button" 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => window.ipc.send("minimizeApp")}
          >
            <MinusIcon className="size-4" />
          </Button>
          <Button 
            className="titlebar-button" 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => window.ipc.send("maximizeApp")}
          >
            {windowState === "maximized" ? <MinimizeIcon className="size-4" /> : <MaximizeIcon className="size-4" />}
          </Button>
          <Button 
            className="titlebar-button" 
            type="button" 
            variant="destructive" 
            size="icon" 
            onClick={() => window.ipc.send("closeApp")}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
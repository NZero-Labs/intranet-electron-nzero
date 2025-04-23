import { type IpcRenderer } from "electron";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
declare global {
  interface Window {
    ipc: IpcRenderer
  }
}
import { ArrowLeftIcon, ArrowRightIcon, LoaderIcon, MaximizeIcon, MinimizeIcon, MinusIcon, XIcon } from "lucide-react";
import { useState } from "react";

export default function Header(){
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoFoward, setCanGoFoward] = useState(false);
  const [windowState, setWindowState] = useState<"minimized" | "maximized">("minimized");
  if(!window.ipc) return null;
  window.ipc.on("arrow-navigation", (_, navigation) => {
    const navigationTyped = navigation as { canGoBack: boolean; canGoFoward: boolean };
    setCanGoBack(navigationTyped.canGoBack);
    setCanGoFoward(navigationTyped.canGoFoward);
  })
  window.ipc.on("isMaximized", () => setWindowState("maximized"));
  window.ipc.on("isRestored", () => setWindowState("minimized"));
  return(
    <Card className="titleBar py-0 gap-0 z-[999] rounded-b-none">
      <CardContent className="relative h-full p-2 flex items-center justify-between">
        <div className="flex items-center justify-start">
          <img src={"static://assets/icon.ico"} alt="Icon amaranzero" className="w-6 h-6 mr-2" />
          <Button type="button" variant="ghost" size="icon" disabled={!canGoBack} onClick={() => window.ipc.send("backApp")}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" disabled={!canGoFoward} onClick={() => window.ipc.send("forwardApp")}>
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
        <div className="draggableContainer w-full h-full"></div>
        <div className="flex items-center gap-1">
          <Button className="mr-3" type="button" variant="ghost" size="icon" onClick={() => window.ipc.send("reloadApp")}>
            <LoaderIcon className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => window.ipc.send("minimizeApp")}>
            <MinusIcon className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => window.ipc.send("maximizeApp")}>
            {windowState === "maximized" ? <MaximizeIcon className="size-4" /> : <MinimizeIcon className="size-4" />}
          </Button>
          <Button type="button" variant="destructive" size="icon" onClick={() => window.ipc.send("closeApp")}>
            <XIcon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
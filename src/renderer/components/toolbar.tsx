import TabBar from "@/components/tab-bar"
import { useToolbarInitialization } from "@/hooks/use-toolbar-initialization"

export default function Toolbar() {
  const isInitialized = useToolbarInitialization()
  if(!isInitialized) return null
  // Add 'titlebar-button' class to prevent window dragging on toolbar.
  return <TabBar />
}
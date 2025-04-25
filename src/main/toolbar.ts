import { shell, WebContentsView } from 'electron'
import { getBaseWindow, getSession } from '~/main/main-window'

const toolbarHeight = 40
let toolbarView: WebContentsView | null = null
declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

/**
 * Creates and initializes the toolbar view for the main window.
 * When toolbar is done initializing, it will show the main window.
 * @returns Promise that resolves to the toolbar WebContentsView or null if creation fails
 */
export function createToolbar(): Promise<WebContentsView | null> {
  return new Promise((resolve) => {
    if (toolbarView !== null) {
      return resolve(toolbarView)
    }
    const baseWindow = getBaseWindow()
    if (baseWindow === null) return resolve(null)
    const ses = getSession()
    if (ses === null) return resolve(null)

    toolbarView = new WebContentsView({
      webPreferences: {
        session: ses,
        devTools: false,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    toolbarView.setBackgroundColor('#292524')

    toolbarView.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    const bounds = baseWindow.getBounds()
    toolbarView.setBounds({
      x: 0,
      y: 0,
      width: bounds.width,
      height: toolbarHeight
    })

    baseWindow.on('resize', () => {
      const newBounds = baseWindow.getBounds()
      if (toolbarView === null) {
        return
      }
      toolbarView.setBounds({
        x: 0,
        y: 0,
        width: newBounds.width,
        height: toolbarHeight
      })
    })

    toolbarView.webContents.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
    toolbarView.webContents.on('did-finish-load', () => {
      return resolve(toolbarView)
    })

    toolbarView.webContents.on('did-fail-load', () => {
      return resolve(null)
    })
    // toolbarView.webContents.openDevTools()
  })
}

/**
 * Returns the fixed height of the toolbar in pixels.
 * @returns number representing toolbar height
 */
export function getToolbarHeight() {
  return toolbarHeight
}

/**
 * Returns the current toolbar view instance.
 * @returns WebContentsView | null - The toolbar view or null if not initialized
 */
export function getToolbar() {
  return toolbarView
}

/**
 * Resizes the toolbar to match the window width while maintaining fixed height.
 * Should be called when the window is resized to ensure toolbar fills the width.
 */
export function resizeToolbar() {
  const baseWindow = getBaseWindow()
  if (!baseWindow) {
    return
  }

  const newBounds = baseWindow.getBounds()
  if (toolbarView === null) {
    return
  }
  toolbarView.setBounds({
    x: 0,
    y: 0,
    width: newBounds.width,
    height: toolbarHeight
  })
}

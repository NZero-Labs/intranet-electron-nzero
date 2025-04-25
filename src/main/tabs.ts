import { clipboard, dialog, shell, WebContentsView } from 'electron'
import contextMenu from 'electron-context-menu'
import path from 'path'
import { getBaseWindow, getSession } from '~/main/main-window'
import { NavigationRoutes } from '~/main/navigation-routes'
import {
  getSelected,
  getTabs,
  NavigationHistoryRestory,
  setSelected,
  setTabs
} from '~/main/tabs-store'
import { getToolbar, getToolbarHeight, resizeToolbar } from '~/main/toolbar'
import { SITE_URL } from '~/main/url-helpers'

// declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string
const tabs: WebContentsView[] = []
let selectedTab: WebContentsView | null = null
let filePath = ''
let rightClickText = ''

/**
 * Creates and loads a new tab with the root URL.
 * @returns The ID of the new tab's web contents, or -1 if creation failed
 */
export async function addNewTab(newPath = '', bringToFront = true): Promise<number> {
  const mainWindow = getBaseWindow()
  if (mainWindow === null) {
    return
  }

  // load new content here
  const newTab = await loadTabContent(newPath || NavigationRoutes.root, { bringToFront })
  if (newTab === null) return -1
  return newTab.webContents.id
}

/**
 * Creates a new tab and loads the specified path asynchronously.
 * @param urlPath The application route path to load
 * @returns Promise resolving to the WebContentView or null if loading failed
 */
export function loadTabContent(
  urlPath: string,
  {
    navigationHistoryRestory = undefined,
    bringToFront = false
  }: {
    navigationHistoryRestory?: NavigationHistoryRestory
    bringToFront?: boolean
  } = {}
): Promise<WebContentsView | null> {
  return new Promise((resolve) => {
    const url = SITE_URL + (urlPath || '')
    const baseWindow = getBaseWindow()
    if (baseWindow === null) return resolve(null)
    const ses = getSession()
    if (ses === null) return resolve(null)
    const view = new WebContentsView({
      webPreferences: {
        session: ses,
        devTools: false,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        nodeIntegration: true,
        contextIsolation: false,
        spellcheck: true
      }
    })
    view.setBackgroundColor('#292524')
    view.webContents.on('did-finish-load', () => {
      if (bringToFront) {
        showContent(view)
        saveTabs()
      }
    })

    view.webContents.on('did-fail-load', () => {
      resolve(null)
    })
    view.webContents.setWindowOpenHandler((details) => {
      if (!details.url?.startsWith(SITE_URL)) {
        shell.openExternal(details.url)
      } else {
        addNewTab(details.url.replace(SITE_URL, ''))
      }
      return { action: 'deny' }
    })

    contextMenu({
      window: view.webContents,
      showCopyImage: true,
      showSaveImage: true,
      prepend: () => [
        {
          label: 'Copiar Texto',
          visible: Boolean(rightClickText),
          click: () => {
            if (rightClickText) {
              clipboard.writeText(rightClickText)
              const abortController = new AbortController()
              dialog
                .showMessageBox(null, {
                  type: 'info',
                  signal: abortController.signal,
                  title: 'Texto Copiado!',
                  message: 'O Texto foi copiado:',
                  detail:
                    rightClickText.length > 20
                      ? `${rightClickText.slice(0, 20)}...`
                      : rightClickText,
                  icon: path.join(__dirname, 'favicon.ico')
                })
                .catch(() => console.error('Error getting text'))
              setTimeout(() => abortController.abort(), 1500)
            }
          }
        }
      ],
      labels: {
        copy: 'Copiar',
        copyImage: 'Copiar imagem',
        copyImageAddress: 'Copiar endereço da imagem',
        copyLink: 'Copiar endereço do link',
        saveImage: 'Salvar imagem',
        saveImageAs: 'Salvar imagem como...',
        selectAll: 'Selecionar tudo'
      }
    })
    tabs.push(view)

    view.webContents.loadURL(url)
    if (navigationHistoryRestory)
      view.webContents.navigationHistory.restore(navigationHistoryRestory)
    view.webContents.session.setSpellCheckerLanguages(['en-US', 'en', 'pt-BR'])
    resolve(view)
    const handleLoading = (isLoading: boolean) => () => {
      const toolBar = getToolbar()
      if (!toolBar) return
      toolBar.webContents.send('arrow-navigation', {
        canGoBack: view?.webContents?.navigationHistory?.canGoBack(),
        canGoForward: view?.webContents?.navigationHistory?.canGoForward()
      })

      toolBar.webContents.send('isLoading', isLoading)
      saveTabs()
    }
    view.webContents.on('did-start-loading', handleLoading(true))
    view.webContents.on('did-stop-loading', handleLoading(false))
    view.webContents.on('will-navigate', handleLoading(true))
    view.webContents.on('did-navigate', handleLoading(false))
    view.webContents.on('page-title-updated', () => {
      const toolBar = getToolbar()
      const name = view.webContents.getTitle()
      const isUrl = name?.startsWith('http') || name?.startsWith('10.10.10.5')
      toolBar.webContents.send('update-tab-name', {
        name: isUrl ? 'Carregando...' : name,
        id: view.webContents.id
      })
    })
    view.webContents.zoomFactor = 1
    view.webContents.setVisualZoomLevelLimits(1, 5).catch(console.error)
    view.webContents.on('zoom-changed', (_, zoomDirection) => {
      const currentZoom = view.webContents.getZoomFactor()

      if (zoomDirection === 'in') {
        view.webContents.zoomFactor = currentZoom + 0.2
      }
      if (zoomDirection === 'out') {
        view.webContents.zoomFactor = currentZoom - 0.2
      }
    })
    view.webContents.on('before-input-event', (event, input) => {
      if ((input.control || input.meta) && !input.shift && input.key.toLowerCase() === 'w') {
        event.preventDefault() // bloqueia o atalho

        const toolBar = getToolbar()
        toolBar.webContents.send('close-current-tab')
      }
    })
    view.webContents.session.on('will-download', (event, item) => {
      if (filePath) item.setSavePath(filePath)
    })
  })
}

/**
 * Displays a WebContentView in the main window and sets it as the active tab.
 * @param webContentsView The WebContentView to display
 */
export function showContent(webContentsView: WebContentsView) {
  const baseWindow = getBaseWindow()
  if (!baseWindow) {
    return
  }

  const setWebContentBounds = () => {
    const newBounds = baseWindow.getBounds()
    webContentsView.setBounds({
      x: 0,
      y: getToolbarHeight(),
      width: newBounds.width,
      height: newBounds.height - getToolbarHeight()
    })
  }

  setWebContentBounds()

  baseWindow.removeAllListeners('resize')

  baseWindow.on('resize', () => {
    setWebContentBounds()
    resizeToolbar()
  })

  selectedTab = webContentsView
  const toolBar = getToolbar()
  toolBar.webContents.send('arrow-navigation', {
    canGoBack: selectedTab?.webContents?.navigationHistory?.canGoBack(),
    canGoForward: selectedTab?.webContents?.navigationHistory?.canGoForward()
  })

  baseWindow.contentView.addChildView(webContentsView)
}

/**
 * Closes a specific tab and removes it from the application.
 * @param id The ID of the tab to close
 */
export function closeTab(id: number) {
  const idx = tabs.findIndex((tab) => tab.webContents.id === id)
  if (idx === -1) {
    return
  }
  const baseWindow = getBaseWindow()
  if (baseWindow) {
    baseWindow.contentView.removeChildView(tabs[idx])
  }
  tabs[idx].webContents.close()
  tabs.splice(idx, 1)
  saveTabs()
}

/**
 * Temporarily hides a tab from view without destroying it.
 * @param id The ID of the tab to hide
 */
export function hideTab(id: number) {
  const tab = tabs.find((tab) => tab.webContents.id === id)
  if (tab == null) {
    return
  }
  const baseWindow = getBaseWindow()
  if (baseWindow === null) {
    return
  }
  baseWindow.contentView.removeChildView(tab)
}

/**
 * Closes all open tabs.
 * @param options Optional configuration object
 * @param options.save Whether to save the tabs state before closing (default: true)
 */
export function closeAllTabs({ save = true }: { save?: boolean } = {}) {
  if (save) {
    saveTabs()
  }

  for (const tab of tabs) {
    tab.webContents.close()
  }

  tabs.splice(0, tabs.length)
  if (!save) {
    saveTabs()
  }
}

/**
 * Retrieves a tab by its ID.
 * @param id The ID of the tab to find
 * @returns The WebContentView if found, undefined otherwise
 */
export function getTab(id: number) {
  return tabs.find((tab) => tab.webContents.id === id)
}

/**
 * Gets all currently open tabs.
 * @returns Array of all WebContentsViews
 */
export function getAllTabs(): WebContentsView[] {
  return tabs
}

/**
 * Gets the IDs of all open tabs.
 * @returns Array of tab IDs
 */
export function getAllTabIds(): number[] {
  if (tabs.length === 0) {
    return []
  }
  const ids = tabs.map((tab) => tab.webContents.id)
  return ids
}

/**
 * Gets the currently selected tab.
 * @returns The active WebContentsView or null if none selected
 */
export function getSelectedTab(): WebContentsView | null {
  return selectedTab
}

/**
 * Changes the selected tab.
 * @param id The ID of the tab to select
 */
export function setSelectedTab(id: number) {
  if (selectedTab) {
    if (id === selectedTab.webContents.id) {
      return
    }
  }
  const idx = tabs.findIndex((tab) => tab.webContents.id === id)
  if (idx === -1) {
    return
  }
  showContent(tabs[idx])
  saveSelectedTab({ tabIndex: idx })
}

/**
 * Saves the currently selected tab index to storage.
 * @param options Optional configuration object
 * @param options.tabIndex Specific tab index to save as selected
 */
function saveSelectedTab({ tabIndex = -1 }: { tabIndex?: number } = {}) {
  if (tabIndex !== -1) {
    setSelected(tabIndex)
    return
  }

  if (selectedTab === null) {
    return
  }
  const idx = tabs.findIndex((tab) => {
    if (selectedTab === null) return false
    return tab.webContents.id === selectedTab?.webContents.id
  })
  if (idx === -1) {
    return
  }
  setSelected(idx)
}

/**
 * Gets the ID of the currently selected tab.
 * @returns The ID of the selected tab, or -1 if none selected
 */
export function getSelectedTabId() {
  if (selectedTab === null) return -1
  return selectedTab.webContents.id
}

/**
 * Reorders tabs based on an array of tab IDs.
 * @param ids Array of tab IDs in the desired order
 */
export function reorderTabs(ids: number[]) {
  const newTabs = ids
    .map((id) => tabs.find((tab) => tab.webContents.id === id))
    .filter((tab): tab is WebContentsView => tab !== undefined)
  if (newTabs.length === 0) return
  tabs.splice(0, tabs.length, ...newTabs)
  saveTabs()
  saveSelectedTab()
}

/**
 * Saves the current tabs state to storage.
 */
export function saveTabs() {
  const mainWindow = getBaseWindow()
  if (mainWindow === null) {
    return
  }
  const tabUrls = tabs.map((tab) => {
    const url = tab.webContents.getURL()
    const idx = url.indexOf('#')
    const correctUrl = idx === -1 ? '/' : url.substring(idx + 1)
    return {
      url: correctUrl,
      title: tab.webContents.getTitle(),
      navigationHistoryRestory: {
        entries: tab.webContents.navigationHistory.getAllEntries(),
        index: tab.webContents.navigationHistory.getActiveIndex()
      }
    }
  })

  setTabs(tabUrls)
}

/**
 * Restores tabs from the previous session.
 * @param options Optional configuration object
 * @param options.restore Whether to restore previous session tabs (default: true)
 * @returns Promise resolving to the selected tab's WebContentsView or null
 */
export async function restoreTabs({
  restore = true
}: {
  restore?: boolean
} = {}): Promise<WebContentsView | null> {
  if (!restore) {
    return loadTabContent(NavigationRoutes.root)
  }

  const lastSessionTabs = getTabs()
  let selectedTabIndex = getSelected()

  if (lastSessionTabs !== null && lastSessionTabs.length > 0) {
    if (selectedTabIndex < 0 || selectedTabIndex >= lastSessionTabs.length) {
      selectedTabIndex = 0
    }

    for (let i = 0; i < lastSessionTabs.length; i++) {
      const lastSessionTab = lastSessionTabs[i]
      if (i === selectedTabIndex) {
        selectedTab = await loadTabContent(lastSessionTab.url, {
          navigationHistoryRestory: lastSessionTab.navigationHistoryRestory
        })
        continue
      }
      loadTabContent(lastSessionTab.url, {
        navigationHistoryRestory: lastSessionTab.navigationHistoryRestory
      })
    }
  }

  if (selectedTab === null) {
    selectedTab = await loadTabContent(NavigationRoutes.root)
  }

  return selectedTab
}

export function setFilePath(newPath: string) {
  filePath = newPath
}
export function setRightClickText(text: string) {
  rightClickText = text
}

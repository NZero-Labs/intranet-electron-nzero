import { NavigationEntry } from 'electron'
import Store from 'electron-store'

export type NavigationHistoryRestory = {
  entries: NavigationEntry[]
  index: number
}
export type TabsStoreType = {
  tabs: Array<{
    navigationHistoryRestory: NavigationHistoryRestory
    url: string
    title: string
  }>
  selectedTabIndex: number
}
export const globalStore = new Store<TabsStoreType>({
  defaults: {
    tabs: [],
    selectedTabIndex: -1
  }
})

/**
 * Updates stored tabs
 * @param tabs Array of tab urls
 */
export function setTabs(tabs: TabsStoreType['tabs']) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalStore.set('tabs', tabs)
}

/**
 * Retrieves stored tabs
 */
export function getTabs(): TabsStoreType['tabs'] | null {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const data = globalStore.get('tabs', null) as TabsStoreType['tabs'] | null
  if (!data) return null
  return data
}

/**
 * Updates selected tab index
 * @param index Index of selected tab
 */
export function setSelected(index: number) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalStore.set('selectedTabIndex', index)
}

/**
 * Retrieves selected tab index
 */
export function getSelected(): number {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const data = globalStore.get('selectedTabIndex', null) as number | null
  if (!data) return -1
  return data
}

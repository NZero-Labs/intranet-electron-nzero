import { useBoundStore } from '@/store/use-bound-store'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { Tab } from './tab'

export default function TabBar() {
  const tabs = useBoundStore((state) => state.tabs.items)
  const setSelectedTab = useBoundStore((state) => state.tabs.setSelectedTab)
  const remove = useBoundStore((state) => state.tabs.remove)
  // const add = useBoundStore((state) => state.tabs.add)
  const setTabs = useBoundStore((state) => state.tabs.reorder)
  const selectedTab = useBoundStore((state) => state.tabs.selectedTabId)
  const selectedTabIndex = useBoundStore((state) => state.tabs.selectedTabIndex)
  return (
    <div className="mx-2 flex flex-row w-full h-[40px] flex-grow">
      <Reorder.Group
        as="ul"
        axis="x"
        onReorder={setTabs}
        className="flex-grow group-tab-bar flex-nowrap flex justify-start items-center w-[300px] h-full gap-2 pt-2"
        values={tabs}
      >
        <AnimatePresence initial={false}>
          {tabs.map((item, index) => (
            <>
              <Tab
                key={item.id}
                item={item}
                isSelected={selectedTab === item.id}
                onClick={() => setSelectedTab(item)}
                onRemove={() => remove(item)}
                canRemove={tabs.length > 1}
              />
              {index !== (selectedTabIndex - 1) && index !== selectedTabIndex && tabs.length > 1 && (tabs.length - 1) !== index && (
                <motion.div
                  key={`divider-${index}`}
                  className="w-[2px] h-5 bg-accent divisor opacity-100"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}          
            </>
          ))}
          {/* <motion.button
            className="titlebar-button flex items-center justify-center hover:bg-white/5
              rounded-full h-6 w-6 transition-all duration-300 ml-2"
            onClick={add}
            whileTap={{ scale: 0.9 }}
          >
            <PlusIcon className="size-4 opacity-55 hover:opacity-100 transition-all text-white duration-300" />
          </motion.button> */}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  )
}


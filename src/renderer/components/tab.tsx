import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TabInfo } from '@/types/tabs'
import { motion, Reorder } from 'framer-motion'
import { XIcon } from 'lucide-react'

interface Props {
  item: TabInfo
  isSelected: boolean
  onClick: () => void
  onRemove: () => void
  canRemove: boolean
}

export const Tab = ({ item, onClick, onRemove, isSelected, canRemove }: Props) => {
  const title = item.name || "Intranet"
  return (
    <Reorder.Item
      value={item}
      id={item.id}
      initial={{
        opacity: 1,
        y: 30
      }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.1, ease: 'easeInOut' }
      }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.15 } }}
      whileDrag={{
        transition: { ease: 'easeInOut' }
      }}
      className={cn(
        ' titlebar-button group max-w-52 bg-background text-background-foreground flex justify-between items-center flex-1 gap-6 rounded-t-[1rem] border shadow-lg w-full relative cursor-pointer select-none ronded-b-none h-full p-2 overflow-visible',
        isSelected 
          && 'selected bg-accent text-accent-foreground'
      )}
      onPointerDown={onClick}
    >
      <motion.span
        className={cn(
          `text-xs text-center flex-shrink flex-grow leading-[8px] whitespace-nowrap block min-w-0 pr-[30px]`
        )}
        layout="position"
      >
        {title.length > 20 ? title.slice(0, 20) + '...' : title}
      </motion.span>
      <motion.div
        layout
        className="absolute top-0 bottom-0 right-[0px] flex align-center items-center justify-end flex-shrink-0 pr-2"
      >
        {canRemove && (
          <Button 
            type="button" 
            variant={"ghost"}
            className={cn(
              "remove-button size-4",
              isSelected ? 'inline-flex' : 'hidden group-hover:inline-flex',
              !isSelected && "bg-accent text-accent-foreground hover:text-accent-foreground hover:bg-accent/80",
              isSelected && "bg-background text-foreground hover:text-foreground hover:bg-background/80",
            )}
            size="icon"
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
          >
            <XIcon className={"size-3"} />
          </Button>
        )}
      </motion.div>
    </Reorder.Item>
  )
}

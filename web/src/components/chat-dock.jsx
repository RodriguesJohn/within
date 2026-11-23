import { useEffect, useRef, useState } from 'react'
import { MessageSquare, PanelRightClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ITEM_KIND } from '@/lib/action-items'
import { AgentAvatar, CountPill, LiveDot } from './agent-ui'
import { AllAgentsThread, TicketThread } from './chat'

function CountBadge({ items, className }) {
  const blocking = items.some((i) => ITEM_KIND[i.kind].group === 'blocked')
  return <CountPill n={items.length} alert={blocking} className={className} />
}

function useBump(count) {
  const prev = useRef(count)
  const [bump, setBump] = useState(false)
  useEffect(() => {
    if (count > prev.current) {
      setBump(true)
      const id = setTimeout(() => setBump(false), 1600)
      prev.current = count
      return () => clearTimeout(id)
    }
    prev.current = count
  }, [count])
  return bump
}

export function ChatRail({ items, anyWorking, onExpand }) {
  const bump = useBump(items.length)
  return (
    <aside className="my-2 mr-2 flex w-11 shrink-0 flex-col items-center gap-2 rounded-xl border bg-background py-2 shadow-sm">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            aria-label="Open agent chat"
            className={cn('relative', bump && 'bg-status-approval/20 ring-2 ring-status-approval/50 transition-all')}
          >
            <MessageSquare />
            <CountBadge items={items} className="absolute -top-0.5 -right-0.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          Agent chat <Kbd>⌘J</Kbd>
        </TooltipContent>
      </Tooltip>
      {anyWorking && <LiveDot className="mt-1" />}
    </aside>
  )
}

export function ChatDock({
  tickets,
  items,
  actions,
  selected,
  scope,
  setScope,
  onOpen,
  onCollapse,
  focusKey,
  target,
  setTarget,
  withinChat,
  withinTyping,
  onAskWithin,
  className,
}) {
  const ticketScope = scope === 'ticket' && selected
  const selectedItem = selected && items.find((i) => i.ticketId === selected.id)

  return (
    <aside
      className={cn(
        'my-2 mr-2 flex min-h-0 w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm animate-in fade-in-0 slide-in-from-right-2',
        className,
      )}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
        <ToggleGroup
          type="single"
          size="sm"
          spacing={0}
          value={ticketScope ? 'ticket' : 'all'}
          onValueChange={(v) => v && setScope(v)}
          className="min-w-0"
        >
          <ToggleGroupItem value="all" className="gap-1.5 px-2.5">
            All agents
            <CountBadge items={items} />
          </ToggleGroupItem>
          {selected && (
            <ToggleGroupItem value="ticket" className="min-w-0 gap-1.5 px-2.5">
              <AgentAvatar id={selected.assignee} size="sm" className="size-4" />
              <span className="font-mono text-xs">{selected.id}</span>
              {selectedItem && <span className="size-1.5 rounded-full bg-alert" />}
            </ToggleGroupItem>
          )}
        </ToggleGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onCollapse} aria-label="Collapse chat">
              <PanelRightClose />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Collapse <Kbd>⌘J</Kbd>
          </TooltipContent>
        </Tooltip>
      </header>

      {ticketScope ? (
        <TicketThread key={selected.id} ticket={selected} item={selectedItem} actions={actions} onOpen={onOpen} focusKey={focusKey} />
      ) : (
        <AllAgentsThread
          tickets={tickets}
          items={items}
          actions={actions}
          onOpen={onOpen}
          focusKey={focusKey}
          target={target}
          setTarget={setTarget}
          withinChat={withinChat}
          withinTyping={withinTyping}
          onAskWithin={onAskWithin}
        />
      )}
    </aside>
  )
}

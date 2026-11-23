import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Inbox as InboxIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { waitLabel } from '@/lib/action-items'
import { PEOPLE, PROJECTS, PROJECT_BY_ID } from '@/data'
import { AgentAvatar, CountPill, Rich, STATUS_TONE, StatusIcon } from './agent-ui'
import { ItemActions, ItemKindBadge } from './chat'

const TOP = 4
const MotionCard = motion.create(Card)

const KPIS = [
  { status: 'progress', label: 'Working', match: (t) => t.status === 'progress' && !t.paused },
  { status: 'stuck', label: 'Stuck', match: (t) => t.status === 'stuck' },
  { status: 'approval', label: 'Needs approval', match: (t) => t.status === 'approval' },
  { status: 'review', label: 'In review', match: (t) => t.status === 'review' },
]

function KpiCards({ tickets }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {KPIS.map(({ status, label, match }) => {
        const n = tickets.filter(match).length
        return (
          <Card key={status} size="sm" className={cn('gap-1.5 px-3.5 py-3 shadow-soft ring-0', n === 0 && 'opacity-60')}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <StatusIcon status={status} className="size-3" />
              {label}
            </div>
            <div className={cn('text-2xl font-semibold tabular-nums', n > 0 && (status === 'stuck' || status === 'approval') && STATUS_TONE[status].text)}>
              {n}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function headline(item, ticket) {
  if (item.kind === 'approve') return <Rich text={`Run \`${ticket.approval?.action}\``} />
  if (item.kind === 'start') return `Start: ${ticket.steps?.[0]}`
  return item.title
}

function ItemCard({ item, ticket, selected, showProject, actions, onOpen, onReply }) {
  const owner = PEOPLE[item.agent]
  const wait = waitLabel(item.since)

  return (
    <MotionCard
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      size="sm"
      role="button"
      tabIndex={0}
      aria-label={`Open ${ticket.id}`}
      onClick={() => onOpen(item.ticketId)}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen(item.ticketId)}
      className={cn(
        'cursor-pointer gap-3 shadow-soft ring-0 transition-shadow hover:shadow-soft-lg focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
        selected && 'shadow-soft-lg ring-2 ring-status-progress/35',
      )}
    >
      <CardHeader className="flex items-center gap-3">
        <AgentAvatar id={item.agent} size="default" alert={item.kind === 'answer'} />
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-sm">{headline(item, ticket)}</CardTitle>
          <CardDescription className="truncate text-xs">
            <span className="font-medium text-foreground/80">{owner.name}</span> · {ticket.title}
          </CardDescription>
        </div>
        {wait && <CardAction className="self-center text-xs text-muted-foreground tabular-nums">{wait}</CardAction>}
      </CardHeader>

      <CardFooter className="gap-2 border-0 bg-transparent">
        <ItemKindBadge kind={item.kind} />
        {showProject && ticket.project && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('size-1.5 rounded-full', PROJECT_BY_ID[ticket.project].dot)} />
            {PROJECT_BY_ID[ticket.project].name}
          </span>
        )}
        <div className="ml-auto">
          <ItemActions item={item} ticket={ticket} actions={actions} onOpen={onOpen} onReply={onReply} size="sm" />
        </div>
      </CardFooter>
    </MotionCard>
  )
}

export function Inbox({ tickets, scopeTickets, items, selectedId, actions, onOpen, onReply, onShowAgents }) {
  const [project, setProject] = useState('all')
  const [expanded, setExpanded] = useState({})
  const byId = Object.fromEntries(tickets.map((t) => [t.id, t]))

  const scoped = project === 'all' ? items : items.filter((i) => i.project === project)
  const open = expanded[project]
  const shown = open ? scoped : scoped.slice(0, TOP)
  const hidden = scoped.length - TOP
  const blocking = (list) => list.filter((i) => i.kind === 'answer' || i.kind === 'approve').length

  const tabs = [{ id: 'all', name: 'All projects' }, ...PROJECTS]

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-5 pb-10">
        <KpiCards tickets={scopeTickets} />

        <section className="flex flex-col gap-3" aria-labelledby="needs-you">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 id="needs-you" className="flex items-center gap-1.5 text-sm font-semibold">
              Needs you
              <Tooltip>
                <TooltipTrigger asChild>
                  <Sparkles className="size-3.5 text-muted-foreground" aria-label="Ranked by Within agent" />
                </TooltipTrigger>
                <TooltipContent className="max-w-60">Ranked by Within agent, most urgent first.</TooltipContent>
              </Tooltip>
            </h2>
            <Tabs value={project} onValueChange={setProject} className="ml-auto">
              <TabsList>
                {tabs.map((p) => {
                  const list = p.id === 'all' ? items : items.filter((i) => i.project === p.id)
                  return (
                    <TabsTrigger key={p.id} value={p.id} className="gap-1.5 px-2.5">
                      {p.dot && <span className={cn('size-1.5 rounded-full', p.dot)} />}
                      {p.name}
                      <CountPill n={list.length} alert={blocking(list) > 0} />
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          </div>

          {scoped.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon />
                </EmptyMedia>
                <EmptyTitle>Nothing needs you</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={onShowAgents}>
                  See agent work
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <motion.div layout className="flex flex-col gap-2.5">
              <AnimatePresence initial={false} mode="popLayout">
                {shown.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    ticket={byId[item.ticketId]}
                    selected={item.ticketId === selectedId}
                    showProject={project === 'all'}
                    actions={actions}
                    onOpen={onOpen}
                    onReply={onReply}
                  />
                ))}
              </AnimatePresence>
              {hidden > 0 && (
                <motion.div layout>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setExpanded((e) => ({ ...e, [project]: !open }))}
                  >
                    <ChevronDown className={cn('transition-transform', open && 'rotate-180')} />
                    {open ? 'Show less' : `Show ${hidden} more`}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </section>
      </div>
    </ScrollArea>
  )
}

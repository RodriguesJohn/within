import { useState } from 'react'
import { GitPullRequest, MessageSquare, Pause, Plus, ShieldAlert, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { PEOPLE, STATUSES } from '@/data'
import { AgentAvatar, LiveDot, PriorityIcon, StatusIcon, StepProgress, stepNumber } from './agent-ui'

function TicketCard({ ticket, selected, onSelect }) {
  const person = PEOPLE[ticket.assignee]
  const isAgent = person.kind === 'agent'
  const total = ticket.steps?.length
  const working = ticket.status === 'progress' && isAgent && !ticket.paused
  const pr = ticket.outputs.find((o) => o.type === 'pr')

  return (
    <Card
      size="sm"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', ticket.id)}
      onClick={() => onSelect(ticket.id)}
      className={cn(
        'relative cursor-pointer gap-2.5 shadow-soft ring-0 transition-shadow hover:shadow-soft-lg active:cursor-grabbing animate-in fade-in-0 slide-in-from-bottom-1',
        selected && 'shadow-soft-lg ring-2 ring-status-progress/35',
      )}
    >
      {(ticket.status === 'stuck' || ticket.status === 'approval') && (
        <span
          className={cn(
            'absolute inset-y-3 left-0 w-[3px] rounded-r-full',
            ticket.status === 'stuck' ? 'bg-status-stuck' : 'bg-status-approval',
          )}
        />
      )}
      <CardHeader className="gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">{ticket.id}</span>
          <AgentAvatar id={ticket.assignee} size="sm" live={working} className="size-5" />
        </div>
        <CardTitle className="text-sm leading-snug text-pretty">{ticket.title}</CardTitle>
      </CardHeader>

      {(isAgent && total) || ticket.blocker || ticket.approval ? (
        <CardContent className="flex flex-col gap-2.5">
          {isAgent && ticket.status === 'progress' && total && (
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {ticket.paused ? <Pause className="size-3 shrink-0" /> : <LiveDot />}
              <span className="truncate">{ticket.paused ? 'Paused' : ticket.steps[ticket.step]}</span>
            </div>
          )}
          {ticket.status === 'stuck' && ticket.blocker && (
            <div className="flex items-start gap-1.5 rounded-md bg-status-stuck/10 px-2 py-1.5 text-xs font-medium text-status-stuck">
              <TriangleAlert className="mt-px size-3 shrink-0" />
              <span>{ticket.blocker.title}</span>
            </div>
          )}
          {ticket.status === 'approval' && ticket.approval && (
            <div className="flex items-start gap-1.5 rounded-md bg-status-approval/15 px-2 py-1.5 text-xs font-medium text-amber-800 dark:text-status-approval">
              <ShieldAlert className="mt-px size-3 shrink-0" />
              <span>
                Needs approval to run a production change
              </span>
            </div>
          )}
          {isAgent && total && ticket.status !== 'done' && (
            <div className="flex items-center gap-2">
              <StepProgress ticket={ticket} className="flex-1" />
              <span className="text-xs text-muted-foreground tabular-nums">
                {stepNumber(ticket)}/{total}
              </span>
            </div>
          )}
        </CardContent>
      ) : null}

      <CardFooter className="gap-1.5 border-0 bg-transparent text-xs text-muted-foreground">
        <PriorityIcon priority={ticket.priority} />
        {ticket.labels.map((l) => (
          <Badge key={l} variant="secondary" className="h-5 font-normal text-muted-foreground">
            {l}
          </Badge>
        ))}
        <span className="ml-auto flex items-center gap-2">
          {pr && <GitPullRequest className="size-3" />}
          {ticket.chat.length > 0 && (
            <span className="flex items-center gap-0.5 tabular-nums">
              <MessageSquare className="size-3" />
              {ticket.chat.length}
            </span>
          )}
          <span className="text-foreground/80">{isAgent ? person.name : person.name.split(' ')[0]}</span>
        </span>
      </CardFooter>
    </Card>
  )
}

export function Board({ tickets, selectedId, onSelect, onMove }) {
  const [over, setOver] = useState(null)

  return (
    <div className="min-h-0 flex-1 overflow-x-auto">
      <div className="flex h-full w-max gap-3 p-4">
        {STATUSES.map((s) => {
          const items = tickets.filter((t) => t.status === s.id)
          return (
            <section
              key={s.id}
              className={cn(
                'flex w-72 shrink-0 flex-col rounded-xl bg-muted/50 transition-colors',
                over === s.id && 'bg-muted outline-2 outline-dashed outline-ring/50',
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(s.id)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOver(null)
              }}
              onDrop={(e) => {
                onMove(e.dataTransfer.getData('text/plain'), s.id)
                setOver(null)
              }}
            >
              <header className="flex items-center gap-2 px-3 pt-3 pb-2">
                <StatusIcon status={s.id} />
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-sm text-muted-foreground tabular-nums">{items.length}</span>
                <Button variant="ghost" size="icon-xs" className="ml-auto text-muted-foreground" title={`Add to ${s.label}`}>
                  <Plus />
                </Button>
              </header>
              <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-2 px-2 pb-2">
                  {items.map((t) => (
                    <TicketCard key={t.id} ticket={t} selected={t.id === selectedId} onSelect={onSelect} />
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-lg px-3 py-6 text-center text-xs text-muted-foreground">Nothing here</div>
                  )}
                </div>
              </ScrollArea>
            </section>
          )
        })}
      </div>
    </div>
  )
}

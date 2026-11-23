import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, ChevronRight, Inbox } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ITEM_KIND, getActionItems } from '@/lib/action-items'
import { AGENT_IDS, PEOPLE, STATUS_BY_ID } from '@/data'
import { AgentAvatar, StatusIcon, WithinMark, needSummary, needsOf, urgentCount } from './agent-ui'

export const SUGGESTIONS = ['What needs me?', "What's Atlas doing?", 'Summarize the sprint']

export function reply(text, tickets) {
  const agentId = AGENT_IDS.find((id) => text.toLowerCase().includes(id))
  if (agentId) {
    const mine = tickets.filter((t) => t.assignee === agentId && t.status !== 'done')
    const name = PEOPLE[agentId].name
    if (!mine.length) return { text: `${name} is idle. Nothing assigned right now.` }
    const lines = mine.map((t) => {
      if (t.status === 'progress') return `On ${t.id}, step ${t.step + 1} of ${t.steps.length}: ${t.steps[t.step]}${t.paused ? ' (paused)' : ''}.`
      if (t.status === 'stuck') return `Stuck on ${t.id}: ${t.blocker?.title}.`
      if (t.status === 'approval') return `Waiting for approval on ${t.id}.`
      return `${t.id} is ${STATUS_BY_ID[t.status].label.toLowerCase()}.`
    })
    return { text: `Here's ${name}:\n${lines.join('\n')}`, tickets: mine.map((t) => t.id) }
  }
  if (/need|inbox|stuck|block|approv|waiting|me\b/i.test(text)) {
    const items = getActionItems(tickets)
    if (!items.length) return { text: "Nothing is waiting on you. Every agent is unblocked." }
    const blocked = items.filter((i) => ITEM_KIND[i.kind].group === 'blocked').length
    return {
      text: `${items.length} ${items.length === 1 ? 'thing needs' : 'things need'} you${blocked ? `, ${blocked} of them blocking an agent` : ''}. Most urgent first:`,
      tickets: items.map((i) => i.ticketId),
    }
  }
  if (/summar|status|sprint|today|overview/i.test(text)) {
    const agentTickets = tickets.filter((t) => PEOPLE[t.assignee].kind === 'agent')
    const count = (s) => agentTickets.filter((t) => t.status === s).length
    return {
      text: `Sprint 14 so far: ${count('progress')} tickets in progress, ${count('stuck')} stuck, ${count('approval')} waiting on approval, ${count('review')} in review and ${count('done')} done.`,
    }
  }
  const match = tickets.filter((t) => text.toLowerCase().split(/\W+/).some((w) => w.length > 3 && t.title.toLowerCase().includes(w)))
  if (match.length) return { text: 'These tickets look related:', tickets: match.slice(0, 4).map((t) => t.id) }
  return { text: "I watch every agent on this board. Ask me what needs you, what an agent is doing, or about any ticket by name." }
}

export function TicketRow({ ticket, onOpen, detail }) {
  return (
    <button
      onClick={() => onOpen(ticket.id)}
      className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
    >
      <StatusIcon status={ticket.status} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{ticket.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {ticket.id} · {PEOPLE[ticket.assignee].name}
          {detail ? ` · ${detail}` : ''}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

export function WithinAgent({ tickets, open, setOpen, onOpenTicket, onOpenInbox }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  const urgent = needsOf(tickets, ['stuck', 'approval'])
  const recent = tickets
    .filter((t) => t.chat.length && !urgent.includes(t))
    .slice(0, 4)
  const byId = Object.fromEntries(tickets.map((t) => [t.id, t]))

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ block: 'end' })
      inputRef.current?.focus()
    }
  }, [open, messages.length, typing])

  const send = (text) => {
    const value = (text ?? draft).trim()
    if (!value) return
    setMessages((m) => [...m, { from: 'user', text: value }])
    setDraft('')
    setTyping(true)
    setTimeout(() => {
      setMessages((m) => [...m, { from: 'within', ...reply(value, tickets) }])
      setTyping(false)
    }, 700)
  }

  if (!open) {
    const n = urgentCount(tickets)
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="absolute right-4 bottom-4 z-20 h-11 gap-2.5 rounded-full border-0 bg-background pr-3 pl-1.5 shadow-float hover:bg-background"
      >
        <WithinMark className="size-8" />
        <span className="text-sm font-medium">Ask Within agent</span>
        {n > 0 && <Badge className="h-5 min-w-5 rounded-full bg-alert px-1.5 text-white tabular-nums">{n}</Badge>}
        <Kbd>⌘J</Kbd>
      </Button>
    )
  }

  return (
    <Card className="absolute right-4 bottom-4 z-30 flex h-[580px] max-h-[calc(100%-2rem)] w-[400px] max-w-[calc(100%-2rem)] flex-col gap-0 py-0 shadow-float ring-0 animate-in fade-in-0 slide-in-from-bottom-4">
      <header className="flex shrink-0 items-center gap-2.5 border-b px-4 py-3">
        <WithinMark />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-sm font-semibold">Within agent</div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-status-done" />
            Watching {AGENT_IDS.length} agents on Sprint 14
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} title="Minimize (⌘J)">
          <ChevronDown />
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex gap-2.5">
            <WithinMark className="size-6" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {urgent.length
                  ? `${urgent.length} ${urgent.length === 1 ? 'thing needs' : 'things need'} you right now.`
                  : "Nothing is waiting on you. I'll flag blockers here as they happen."}
              </p>
              {urgent.length > 0 && (
                <div className="mt-2 -mx-2 flex flex-col">
                  {urgent.map((t) => (
                    <TicketRow key={t.id} ticket={t} onOpen={onOpenTicket} detail={needSummary(t)} />
                  ))}
                </div>
              )}
              <Button variant="link" size="sm" className="mt-1 h-auto px-0 text-muted-foreground" onClick={onOpenInbox}>
                <Inbox /> Open inbox
              </Button>
            </div>
          </div>

          {recent.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Continue a conversation</div>
              <div className="-mx-2 flex flex-col">
                {recent.map((t) => {
                  const last = t.chat.at(-1)
                  return <TicketRow key={t.id} ticket={t} onOpen={onOpenTicket} detail={last?.text.replace(/`/g, '').slice(0, 48)} />
                })}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.from === 'user' ? (
              <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground animate-in fade-in-0">
                {m.text}
              </div>
            ) : (
              <div key={i} className="flex gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1">
                <WithinMark className="size-6" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm whitespace-pre-line">{m.text}</p>
                  {m.tickets?.length > 0 && (
                    <div className="mt-1.5 -mx-2 flex flex-col">
                      {m.tickets.map((id) => byId[id] && <TicketRow key={id} ticket={byId[id]} onOpen={onOpenTicket} detail={needSummary(byId[id])} />)}
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          {typing && (
            <div className="flex items-center gap-2.5">
              <WithinMark className="size-6" />
              <div className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <Button key={s} variant="outline" size="xs" className="rounded-full font-normal" onClick={() => send(s)}>
              {s}
            </Button>
          ))}
        </div>
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <Input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about any agent or ticket…" className="h-10 rounded-full pr-11 pl-4" />
          <Button type="submit" size="icon-sm" className={cn('absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full')} disabled={!draft.trim()} title="Send">
            <ArrowUp />
          </Button>
        </form>
      </div>
    </Card>
  )
}

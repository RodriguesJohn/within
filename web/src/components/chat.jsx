import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Ban, Check, ChevronDown, GitMerge, GitPullRequest, Hand, MessageSquare, Play, Reply } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ITEM_KIND, timeKey } from '@/lib/action-items'
import { PEOPLE } from '@/data'
import { AgentAvatar, ApproveButton, Rich, STATUS_TONE, WithinMark, needSummary } from './agent-ui'
import { SUGGESTIONS as WITHIN_SUGGESTIONS, TicketRow } from './within-agent'

export function suggestionsFor(ticket) {
  if (ticket.status === 'stuck') return ticket.blocker?.suggestions ?? ['Try again']
  if (ticket.status === 'approval') return ['Approve, go ahead', 'Hold off for now']
  if (ticket.status === 'review' || ticket.status === 'done') return ['Summarize what changed']
  return ['What are you doing right now?', 'How far along are you?']
}

export function ItemKindBadge({ kind, className }) {
  const tone = STATUS_TONE[ITEM_KIND[kind].status]
  return (
    <Badge variant="ghost" className={cn('h-4 px-1.5 text-[10px]', tone.badge, className)}>
      {ITEM_KIND[kind].label}
    </Badge>
  )
}

// Every card gets at most two actions: the secondary (quiet) and the primary (solid), primary last.
// Clicking the card itself opens the ticket, so "open" never needs its own button.
export function itemActionSet(item) {
  const human = item.human
  switch (item.kind) {
    case 'answer':
      return { secondary: human ? null : { label: 'Take over', icon: Hand, run: 'takeOver' }, primary: { label: 'Reply', icon: Reply, run: 'reply' } }
    case 'approve':
      return { secondary: { label: 'Reject', icon: Ban, run: 'reject' }, primary: { label: 'Approve', icon: Check, run: 'approve' } }
    case 'review':
      return {
        secondary: human ? { label: 'Approve', icon: Check, run: 'complete' } : { label: 'Mark merged', icon: GitMerge, run: 'merge' },
        primary: { label: 'Review', icon: GitPullRequest, run: 'open' },
      }
    case 'start':
      return { secondary: null, primary: { label: 'Start', icon: Play, run: 'start' } }
    default:
      return { secondary: null, primary: null }
  }
}

export function ItemActions({ item, ticket, actions, onOpen, onReply, size = 'xs' }) {
  const id = item.ticketId
  const { secondary, primary } = itemActionSet(item)
  const run = (key) => {
    if (key === 'reply') return onReply(id)
    if (key === 'open') return onOpen(id)
    return actions[key](id)
  }
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {secondary && (
        <Button size={size} variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => run(secondary.run)}>
          <secondary.icon /> {secondary.label}
        </Button>
      )}
      {primary &&
        (primary.run === 'approve' && item.destructive ? (
          <ApproveButton ticket={ticket} onApprove={actions.approve} size={size} />
        ) : (
          <Button size={size} onClick={() => run(primary.run)}>
            <primary.icon /> {primary.label}
          </Button>
        ))}
    </div>
  )
}

function SystemLine({ m }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Separator className="flex-1" />
      <span>{m.text}</span>
      <time className="tabular-nums">{m.t}</time>
      <Separator className="flex-1" />
    </div>
  )
}

function UserBubble({ m }) {
  return (
    <div className="flex flex-col items-end gap-1 animate-in fade-in-0 slide-in-from-bottom-1">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
        <Rich text={m.text} />
      </div>
      <time className="text-[11px] text-muted-foreground tabular-nums">{m.t}</time>
    </div>
  )
}

function MessageMeta({ author, ticket, t, showTicket, onOpen }) {
  return (
    <div className="flex items-baseline gap-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{author.name}</span>
      {showTicket && (
        <button
          type="button"
          onClick={() => onOpen(ticket.id)}
          title={ticket.title}
          className="hover:text-foreground hover:underline"
        >
          {ticket.id}
        </button>
      )}
      <time className="ml-auto tabular-nums">{t}</time>
    </div>
  )
}

// `grouped`: same author + ticket as the message above, so the name line is dropped.
// Every agent message has the same shape. Messages that need a person just add their
// actions underneath, so the thread reads as one calm column instead of a stack of cards.
export function ChatMessage({ m, ticket, item, actions, onOpen, onReply, showTicket = false, grouped = false }) {
  if (m.from === 'system') return <SystemLine m={m} />
  if (m.from === 'user') return <UserBubble m={m} />
  const author = PEOPLE[m.by ?? ticket.prevAgent ?? ticket.assignee]
  const meta = { author, ticket, t: m.t, showTicket, onOpen }
  const needsYou = Boolean(item)

  return (
    <div className={cn('flex gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1', grouped && !needsYou && '-mt-2.5')}>
      {grouped && !needsYou ? <span className="w-6 shrink-0" /> : <AgentAvatar id={author.id} size="sm" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {(!grouped || needsYou) && <MessageMeta {...meta} />}
        <p className={cn('text-sm', needsYou ? 'text-foreground' : 'text-foreground/80')}>
          <Rich text={m.text} />
        </p>
        {item && (
          <div className="-ml-2 pt-0.5 [&>div]:justify-start">
            <ItemActions item={item} ticket={ticket} actions={actions} onOpen={onOpen} onReply={onReply} />
          </div>
        )}
      </div>
    </div>
  )
}

// Plain agent messages directly under one from the same agent on the same ticket.
function isGrouped(prev, cur) {
  return (
    prev &&
    !prev.item &&
    prev.m.from === 'agent' &&
    cur.m.from === 'agent' &&
    prev.ticket?.id === cur.ticket?.id &&
    (prev.m.by ?? null) === (cur.m.by ?? null) &&
    prev.m.kind !== 'question'
  )
}

export function TypingDots({ agent }) {
  return (
    <div className="flex items-center gap-2.5">
      <AgentAvatar id={agent} size="sm" />
      <div className="flex gap-1 rounded-lg border bg-card px-3 py-2.5">
        {[0, 150, 300].map((d) => (
          <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  )
}

function Composer({ placeholder, suggestions, onSend, focusKey, header }) {
  const [draft, setDraft] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (focusKey) ref.current?.focus()
  }, [focusKey])

  const send = (text) => {
    const value = (text ?? draft).trim()
    if (!value) return
    onSend(value)
    setDraft('')
  }

  return (
    <div className="shrink-0 border-t p-3">
      {header}
      {suggestions?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <Button key={s} variant="outline" size="xs" className="rounded-full font-normal" onClick={() => send(s)}>
              {s}
            </Button>
          ))}
        </div>
      )}
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <Textarea
          ref={ref}
          rows={2}
          value={draft}
          placeholder={placeholder}
          className="max-h-32 min-h-16 resize-none pr-11"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
            if (e.key === 'Escape' && !draft) e.currentTarget.blur()
          }}
        />
        <Button type="submit" size="icon-sm" className="absolute right-2 bottom-2" disabled={!draft.trim()} title="Send">
          <ArrowUp />
        </Button>
      </form>
    </div>
  )
}

// Radix wraps viewport content in a `display: table` div, which lets nowrap rows push the thread wider than the dock.
const THREAD_SCROLL = 'min-h-0 flex-1 bg-muted/30 [&_[data-slot=scroll-area-viewport]>div]:block!'

function useScrollToEnd(deps) {
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return endRef
}

export function TicketThread({ ticket, item, actions, onOpen, focusKey }) {
  const person = PEOPLE[ticket.assignee]
  const isAgent = person.kind === 'agent'
  const endRef = useScrollToEnd([ticket.chat.length, ticket.typing])
  const itemMsgIndex = item ? ticket.chat.findLastIndex((m) => m.from === 'agent') : -1
  const [replyFocus, setReplyFocus] = useState(0)
  const reply = () => setReplyFocus((n) => n + 1)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className={THREAD_SCROLL}>
        <div className="flex flex-col gap-5 p-4">
          {ticket.chat.length === 0 && !item && (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageSquare />
                </EmptyMedia>
                <EmptyTitle>No messages yet</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
          {ticket.chat.map((m, i) => (
            <ChatMessage
              key={i}
              m={m}
              ticket={ticket}
              item={i === itemMsgIndex ? item : null}
              actions={actions}
              onOpen={onOpen}
              onReply={reply}
              grouped={i !== itemMsgIndex && isGrouped(i > 0 && { m: ticket.chat[i - 1], ticket, item: i - 1 === itemMsgIndex ? item : null }, { m, ticket })}
            />
          ))}
          {item && itemMsgIndex === -1 && (
            <ChatMessage
              m={{ from: 'agent', by: item.agent, t: item.since, text: item.ask }}
              ticket={ticket}
              item={item}
              actions={actions}
              onOpen={onOpen}
              onReply={reply}
            />
          )}
          {ticket.typing && <TypingDots agent={ticket.assignee} />}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <Composer
        focusKey={focusKey + replyFocus}
        placeholder={isAgent ? `Message ${person.name}…` : 'Leave a comment…'}
        suggestions={suggestionsFor(ticket)}
        onSend={(text) => actions.send(ticket.id, text)}
      />
    </div>
  )
}

function buildFeed(tickets, items, withinChat) {
  const agentTickets = tickets.filter((t) => PEOPLE[t.assignee].kind === 'agent' || t.prevAgent)
  const itemByTicket = Object.fromEntries(items.map((i) => [i.ticketId, i]))
  const entries = []
  for (const t of agentTickets) {
    const item = itemByTicket[t.id]
    const last = item ? t.chat.findLastIndex((m) => m.from === 'agent') : -1
    t.chat.forEach((m, i) => entries.push({ m, ticket: t, item: i === last ? item : null, order: entries.length }))
    if (item && last === -1) {
      entries.push({ m: { from: 'agent', by: item.agent, t: item.since, text: item.ask }, ticket: t, item, order: entries.length })
    }
  }
  withinChat.forEach((m) => entries.push({ m, ticket: null, order: entries.length }))
  return entries.sort((a, b) => timeKey(a.m.t) - timeKey(b.m.t) || a.order - b.order)
}

function WithinMessage({ m, byId, onOpen }) {
  return (
    <div className="flex gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1">
      <WithinMark className="size-6" />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="text-sm font-medium">Within</span>
          <time className="text-[11px] text-muted-foreground tabular-nums">{m.t}</time>
        </div>
        <p className="text-sm whitespace-pre-line text-foreground/85">{m.text}</p>
        {m.tickets?.length > 0 && (
          <div className="mt-1.5 -mx-2 flex flex-col">
            {m.tickets.map((id) => byId[id] && <TicketRow key={id} ticket={byId[id]} onOpen={onOpen} detail={needSummary(byId[id])} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export function AllAgentsThread({ tickets, items, actions, onOpen, focusKey, target, setTarget, withinChat, withinTyping, onAskWithin }) {
  const feed = buildFeed(tickets, items, withinChat)
  const byId = Object.fromEntries(tickets.map((t) => [t.id, t]))
  const targetTicket = byId[target]
  const endRef = useScrollToEnd([feed.length, targetTicket?.typing, withinTyping])
  const targetItem = items.find((i) => i.ticketId === target)
  const [replyFocus, setReplyFocus] = useState(0)

  const reply = (id) => {
    setTarget(id)
    setReplyFocus((n) => n + 1)
  }

  const openItems = new Set(items.map((i) => i.ticketId))
  const pickable = tickets
    .filter((t) => PEOPLE[t.assignee].kind === 'agent' && t.status !== 'done')
    .sort((a, b) => Number(openItems.has(b.id)) - Number(openItems.has(a.id)))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className={THREAD_SCROLL}>
        <div className="flex flex-col gap-5 p-4">
          {feed.map(({ m, ticket, item }, i) => {
            if (!ticket) {
              return m.from === 'user' ? (
                <UserBubble key={`within-${i}`} m={m} />
              ) : (
                <WithinMessage key={`within-${i}`} m={m} byId={byId} onOpen={onOpen} />
              )
            }
            return (
              <ChatMessage
                key={`${ticket.id}-${i}`}
                m={m}
                ticket={ticket}
                item={item}
                actions={actions}
                onOpen={onOpen}
                onReply={reply}
                showTicket
                grouped={!item && isGrouped(feed[i - 1], feed[i])}
              />
            )
          })}
          {targetTicket?.typing && <TypingDots agent={targetTicket.assignee} />}
          {withinTyping && (
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
      <Composer
        focusKey={focusKey + replyFocus}
        placeholder={targetTicket ? `Message ${PEOPLE[targetTicket.assignee].name} on ${targetTicket.id}…` : 'Ask about any agent or ticket…'}
        suggestions={targetTicket ? (targetItem?.kind === 'answer' ? targetItem.suggestions : []) : WITHIN_SUGGESTIONS}
        onSend={(text) => (targetTicket ? actions.send(targetTicket.id, text) : onAskWithin(text))}
        header={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" className="-ml-1.5 mb-1.5 max-w-full font-normal text-muted-foreground">
                {targetTicket ? (
                  <>
                    <AgentAvatar id={targetTicket.assignee} size="sm" className="size-4" />
                    To {PEOPLE[targetTicket.assignee].name} · <span className="font-mono">{targetTicket.id}</span>
                    {targetItem && <span className={cn('size-1.5 rounded-full', STATUS_TONE[ITEM_KIND[targetItem.kind].status].dot)} />}
                  </>
                ) : (
                  <>
                    <WithinMark className="size-4" />
                    To Within · whole board
                  </>
                )}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Send to</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTarget('within')}>
                <WithinMark className="size-4" />
                Within
                <span className="ml-auto text-xs text-muted-foreground">Whole board</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {pickable.map((t, i) => (
                <div key={t.id}>
                  {i > 0 && openItems.has(pickable[i - 1].id) && !openItems.has(t.id) && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={() => setTarget(t.id)}>
                    <AgentAvatar id={t.assignee} size="sm" className="size-4" />
                    <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                    <span className="truncate">{t.title}</span>
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </div>
  )
}

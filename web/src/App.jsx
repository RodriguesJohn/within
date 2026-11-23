import { useEffect, useState } from 'react'
import { Moon, Search, SlidersHorizontal, Sun, Undo2, X } from 'lucide-react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AppSidebar } from '@/components/app-sidebar'
import { Board } from '@/components/board'
import { AgentPanel } from '@/components/agent-panel'
import { AgentAvatar } from '@/components/agent-ui'
import { ChatDock, ChatRail } from '@/components/chat-dock'
import { TicketThread } from '@/components/chat'
import { Inbox } from '@/components/inbox'
import { reply as withinReply } from '@/components/within-agent'
import { getActionItems } from '@/lib/action-items'
import { INITIAL_TICKETS, PEOPLE, STATUS_BY_ID } from '@/data'

const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

const VIEW_TITLE = { all: 'Board', agents: 'Agent work', mine: 'My issues', inbox: 'Inbox' }

function agentSays(t, text, extra = {}) {
  return { from: 'agent', by: t.assignee, t: clock(), text, ...extra }
}

function advance(t) {
  const next = t.step + 1
  const log = [...t.log, { t: clock(), kind: 'step', text: `Finished: ${t.steps[t.step]}` }]

  if (t.trap && next === t.trap.step) {
    const { blocker } = t.trap
    return {
      ...t,
      step: next,
      status: 'stuck',
      blocker,
      trap: null,
      log: [...log, { t: clock(), kind: 'error', text: blocker.title }],
      chat: [...t.chat, agentSays(t, blocker.question, { kind: 'question' })],
    }
  }

  if (next >= t.steps.length) {
    const pr = `PR #${400 + Number(t.id.split('-')[1])}`
    return {
      ...t,
      step: t.steps.length,
      status: 'review',
      log: [...log, { t: clock(), kind: 'done', text: `Opened ${pr}` }],
      outputs: [...t.outputs, { type: 'pr', label: `${pr} · ${t.title}` }],
      chat: [...t.chat, agentSays(t, `${pr} is up for review. All ${t.steps.length} steps are done.`)],
    }
  }

  return { ...t, step: next, log }
}

function approveTicket(t) {
  return {
    ...t,
    status: 'progress',
    approval: null,
    log: [...t.log, { t: clock(), kind: 'human', text: 'Approved by John' }],
    chat: [...t.chat, { from: 'system', t: clock(), text: 'John approved the action' }, agentSays(t, 'Approved. Running it now.')],
  }
}

function agentReply(t, text) {
  const done = { ...t, typing: false }
  const say = (msg) => [...t.chat, agentSays(t, msg)]

  if (t.status === 'stuck') {
    return {
      ...done,
      status: 'progress',
      blocker: null,
      paused: false,
      log: [...t.log, { t: clock(), kind: 'human', text: 'Unblocked by John' }],
      chat: say(`Thanks, that unblocks me. Resuming step ${t.step + 1}: ${t.steps[t.step]}.`),
    }
  }
  if (t.status === 'approval') {
    if (/^(approve|approved|yes|go|ship|ok|lgtm)/i.test(text)) return approveTicket(done)
    return { ...done, chat: say("Understood. I'll hold here until you approve or reject the action.") }
  }
  if (t.status === 'queued') {
    return { ...done, chat: say("Noted. I'll factor that in when I pick this up.") }
  }
  if (t.status === 'review' || t.status === 'done') {
    const pr = t.outputs.find((o) => o.type === 'pr')
    return { ...done, chat: say(pr ? `Everything is in ${pr.label.split(' · ')[0]}. Happy to make follow-up changes.` : 'This one is wrapped up.') }
  }
  if (/how far|progress|where are you/i.test(text)) {
    return { ...done, chat: say(`I'm on step ${t.step + 1} of ${t.steps.length}. ${t.steps.length - t.step - 1} steps left after this one.`) }
  }
  return { ...done, chat: say(`Got it. Right now I'm on "${t.steps[t.step]}" and I'll take that into account.`) }
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export default function App() {
  const [tickets, setTickets] = useState(INITIAL_TICKETS)
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('inbox')
  const [agentFilter, setAgentFilter] = useState(null)
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(false)
  const [dockOpen, setDockOpen] = useState(() => window.innerWidth >= 1024)
  const [dockScope, setDockScope] = useState('all')
  const [focusKey, setFocusKey] = useState(0)
  const [chatTarget, setChatTarget] = useState('within')
  const [withinChat, setWithinChat] = useState([])
  const [withinTyping, setWithinTyping] = useState(false)
  const [toast, setToast] = useState(null)
  const wide = useMediaQuery('(min-width: 1280px)')
  const split = useMediaQuery('(min-width: 1536px)')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setDockOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(id)
  }, [toast])

  const update = (id, fn) => setTickets((ts) => ts.map((t) => (t.id === id ? fn(t) : t)))

  useEffect(() => {
    const iv = setInterval(() => {
      setTickets((ts) =>
        ts.map((t) => {
          const live = t.status === 'progress' && !t.paused && t.steps && PEOPLE[t.assignee].kind === 'agent'
          return live && Math.random() < 0.4 ? advance(t) : t
        }),
      )
    }, 3000)
    return () => clearInterval(iv)
  }, [])

  const actions = {
    send(id, text) {
      const t = tickets.find((x) => x.id === id)
      const isAgent = PEOPLE[t.assignee].kind === 'agent'
      update(id, (t) => ({
        ...t,
        typing: isAgent,
        chat: [...t.chat, { from: 'user', t: clock(), text }],
        // A teammate's question is answered once you reply.
        ...(!isAgent && t.status === 'stuck'
          ? { status: 'progress', blocker: null, log: [...t.log, { t: clock(), kind: 'human', text: 'Answered by John' }] }
          : {}),
      }))
      if (isAgent) setTimeout(() => update(id, (t) => agentReply(t, text)), 1200)
    },
    complete: (id) =>
      update(id, (t) => ({
        ...t,
        status: 'done',
        log: [...t.log, { t: clock(), kind: 'human', text: 'Approved by John' }],
        chat: [...t.chat, { from: 'system', t: clock(), text: 'John approved the work' }],
      })),
    approve: (id) => update(id, approveTicket),
    reject: (id) =>
      update(id, (t) => ({
        ...t,
        status: 'progress',
        approval: null,
        log: [...t.log, { t: clock(), kind: 'human', text: 'Action rejected by John' }],
        chat: [
          ...t.chat,
          { from: 'system', t: clock(), text: 'John rejected the action' },
          agentSays(t, "Understood. I'll skip that and find another way to finish this step."),
        ],
      })),
    retry: (id) =>
      update(id, (t) => ({
        ...t,
        status: 'progress',
        blocker: null,
        log: [...t.log, { t: clock(), kind: 'human', text: 'Retry requested by John' }],
        chat: [...t.chat, agentSays(t, `Retrying "${t.steps[t.step]}".`)],
      })),
    togglePause: (id) =>
      update(id, (t) => ({
        ...t,
        paused: !t.paused,
        log: [...t.log, { t: clock(), kind: 'pause', text: t.paused ? 'Resumed by John' : 'Paused by John' }],
        chat: [...t.chat, { from: 'system', t: clock(), text: t.paused ? 'John resumed the agent' : 'John paused the agent' }],
      })),
    start: (id) =>
      update(id, (t) => ({
        ...t,
        status: 'progress',
        log: [...t.log, { t: clock(), kind: 'start', text: 'Started by John' }],
        chat: [...t.chat, agentSays(t, `On it. Starting with "${t.steps[0]}".`)],
      })),
    merge: (id) =>
      update(id, (t) => ({
        ...t,
        status: 'done',
        log: [...t.log, { t: clock(), kind: 'human', text: 'PR merged by John' }],
        chat: [...t.chat, { from: 'system', t: clock(), text: 'John merged the PR' }],
      })),
    takeOver: (id) => actions.reassign(id, 'john'),
    reassign: (id, to) =>
      update(id, (t) => {
        const from = PEOPLE[t.assignee]
        const target = PEOPLE[to]
        const toAgent = target.kind === 'agent'
        const msg = to === 'john' ? `You took over from ${from.name}. The trace stays on the ticket.` : `Reassigned from ${from.name} to ${target.name}`
        return {
          ...t,
          prevAgent: toAgent ? null : from.kind === 'agent' ? t.assignee : t.prevAgent,
          assignee: to,
          status: ['stuck', 'approval'].includes(t.status) ? 'progress' : t.status,
          blocker: null,
          approval: null,
          paused: false,
          steps: t.steps ?? (toAgent ? ['Read ticket and context', 'Do the work', 'Open pull request'] : undefined),
          step: t.step ?? 0,
          log: [...t.log, { t: clock(), kind: 'human', text: msg }],
          chat: [
            ...t.chat,
            { from: 'system', t: clock(), text: msg },
            ...(toAgent ? [{ from: 'agent', by: to, t: clock(), text: `Picked this up from ${from.name}. I've read the trace and will continue from here.` }] : []),
          ],
        }
      }),
    handBack: (id) =>
      update(id, (t) => ({
        ...t,
        assignee: t.prevAgent,
        prevAgent: null,
        log: [...t.log, { t: clock(), kind: 'human', text: `Handed back to ${PEOPLE[t.prevAgent].name}` }],
        chat: [
          ...t.chat,
          { from: 'system', t: clock(), text: `Handed back to ${PEOPLE[t.prevAgent].name}` },
          { from: 'agent', by: t.prevAgent, t: clock(), text: `Picking it back up from step ${Math.min(t.step + 1, t.steps.length)}.` },
        ],
      })),
  }

  const move = (id, status) =>
    update(id, (t) => {
      if (!id || t.status === status) return t
      return {
        ...t,
        status,
        blocker: status === 'stuck' ? t.blocker : null,
        approval: status === 'approval' ? t.approval : null,
        step: status === 'done' && t.steps ? t.steps.length : t.step,
        log: [...t.log, { t: clock(), kind: 'human', text: `Moved to ${STATUS_BY_ID[status].label} by John` }],
      }
    })

  const visible = tickets.filter((t) => {
    const p = PEOPLE[t.assignee]
    if (view === 'agents' && p.kind !== 'agent') return false
    if (view === 'mine' && t.assignee !== 'john') return false
    if (agentFilter && t.assignee !== agentFilter) return false
    if (query && !`${t.id} ${t.title}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const items = getActionItems(tickets)
  const visibleItems = getActionItems(visible)
  const target = tickets.some((t) => t.id === chatTarget) ? chatTarget : 'within'

  const askWithin = (text) => {
    const answer = withinReply(text, tickets)
    setWithinChat((m) => [...m, { from: 'user', t: clock(), text }])
    setWithinTyping(true)
    setTimeout(() => {
      setWithinChat((m) => [...m, { from: 'within', t: clock(), ...answer }])
      setWithinTyping(false)
    }, 700)
  }

  const withUndo = (label, fn) => (id) => {
    const prev = tickets.find((t) => t.id === id)
    fn(id)
    setToast({ key: Date.now(), text: `${label} · ${id}`, undo: () => update(id, () => prev) })
  }
  const itemActions = {
    ...actions,
    approve: withUndo('Approved', actions.approve),
    reject: withUndo('Rejected', actions.reject),
    retry: withUndo('Retrying', actions.retry),
    start: withUndo('Started', actions.start),
    merge: withUndo('Marked merged', actions.merge),
    complete: withUndo('Approved', actions.complete),
    takeOver: withUndo('Took over', actions.takeOver),
  }

  // Clicking a card opens the tracker (plan, activity, outputs). Reply opens the chat.
  const [panelTab, setPanelTab] = useState({ tab: 'plan', n: 0 })
  const openTicket = (id) => {
    setSelectedId(id)
    setDockScope('ticket')
    setPanelTab((p) => ({ tab: 'plan', n: p.n + 1 }))
  }
  const answer = (id) => {
    setSelectedId(id)
    setDockScope('ticket')
    setPanelTab((p) => ({ tab: 'chat', n: p.n + 1 }))
    setDockOpen(true)
    setFocusKey((k) => k + 1)
  }

  const anyWorking = tickets.some((t) => t.status === 'progress' && !t.paused && PEOPLE[t.assignee].kind === 'agent')
  const agentItems = items.filter((i) => !i.human)

  const selected = tickets.find((t) => t.id === selectedId)
  const close = () => {
    setSelectedId(null)
    setDockScope('all')
  }
  const selectedItem = selected && items.find((i) => i.ticketId === selected.id)
  const inlineChat = selected && !split && (
    <TicketThread key={selected.id} ticket={selected} item={selectedItem} actions={itemActions} onOpen={openTicket} focusKey={focusKey} />
  )
  const showDock = split || !selected || !wide

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar
          tickets={tickets}
          items={items}
          view={view}
          setView={setView}
          agentFilter={agentFilter}
          setAgentFilter={setAgentFilter}
          dark={dark}
          setDark={setDark}
        />
        <SidebarInset className="min-w-0 overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-1 data-vertical:h-4 data-vertical:self-center" />
            <nav className="flex min-w-0 items-center gap-1.5 text-sm whitespace-nowrap">
              <span className="text-muted-foreground">Product</span>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-muted-foreground">Sprint 14</span>
              <span className="text-muted-foreground/60">/</span>
              {agentFilter ? (
                <Badge variant="outline" className="h-6 gap-1.5 pr-0.5 pl-1">
                  <AgentAvatar id={agentFilter} size="sm" className="size-4" />
                  {PEOPLE[agentFilter].name}
                  <Button variant="ghost" size="icon-xs" className="size-5" onClick={() => setAgentFilter(null)} aria-label="Clear filter">
                    <X />
                  </Button>
                </Badge>
              ) : (
                <span className="font-medium">{VIEW_TITLE[view]}</span>
              )}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter tickets" className="h-8 w-44 pl-8" />
              </div>
              <Button variant="outline" size="sm">
                <SlidersHorizontal /> Display
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDark((d) => !d)}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={dark ? 'Light mode' : 'Dark mode'}
              >
                {dark ? <Sun /> : <Moon />}
              </Button>
            </div>
          </header>

          {view === 'inbox' ? (
            <Inbox
              tickets={tickets}
              scopeTickets={visible}
              items={visibleItems}
              selectedId={selectedId}
              actions={itemActions}
              onOpen={openTicket}
              onReply={answer}
              onShowAgents={() => setView('agents')}
            />
          ) : (
            <Board tickets={visible} selectedId={selectedId} onSelect={openTicket} onMove={move} />
          )}
        </SidebarInset>

        {selected && wide && (
          <aside className="my-2 mr-2 w-[420px] shrink-0 overflow-hidden rounded-xl border bg-background shadow-sm animate-in fade-in-0 slide-in-from-right-2">
            <AgentPanel key={selected.id} ticket={selected} actions={actions} onClose={close} onAnswer={answer} chat={inlineChat} tabRequest={panelTab} />
          </aside>
        )}

        {!wide && (
          <Sheet open={!!selected} onOpenChange={(open) => !open && close()}>
            <SheetContent showCloseButton={false} aria-describedby={undefined} className="w-[420px] gap-0 p-0 sm:max-w-[420px]">
              {selected && (
                <AgentPanel key={selected.id} ticket={selected} actions={actions} onClose={close} onAnswer={answer} chat={inlineChat} tabRequest={panelTab} titleAs={SheetTitle} />
              )}
            </SheetContent>
          </Sheet>
        )}

        {showDock &&
          (dockOpen ? (
            <ChatDock
              tickets={tickets}
              items={agentItems}
              actions={itemActions}
              selected={selected}
              scope={dockScope}
              setScope={setDockScope}
              onOpen={openTicket}
              onCollapse={() => setDockOpen(false)}
              focusKey={focusKey}
              target={target}
              setTarget={setChatTarget}
              withinChat={withinChat}
              withinTyping={withinTyping}
              onAskWithin={askWithin}
            />
          ) : (
            <ChatRail items={agentItems} anyWorking={anyWorking} onExpand={() => setDockOpen(true)} />
          ))}

        {toast && (
          <div
            key={toast.key}
            role="status"
            className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-popover py-1.5 pr-1.5 pl-3 text-sm shadow-lg animate-in fade-in-0 slide-in-from-bottom-2"
          >
            {toast.text}
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                toast.undo()
                setToast(null)
              }}
            >
              <Undo2 /> Undo
            </Button>
          </div>
        )}
      </SidebarProvider>
    </TooltipProvider>
  )
}

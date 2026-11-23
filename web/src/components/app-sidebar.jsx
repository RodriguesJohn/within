import {
  Bot,
  ChevronsUpDown,
  CircleUserRound,
  Inbox,
  LayoutGrid,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  SquarePen,
  Sun,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'
import { ITEM_KIND } from '@/lib/action-items'
import { AGENT_IDS, PEOPLE, TEAMMATE_IDS } from '@/data'
import { AgentAvatar, CountPill } from './agent-ui'

const AGENT_STATE = {
  stuck: { label: 'Stuck', className: 'text-status-stuck' },
  approval: { label: 'Waiting', className: 'text-amber-700 dark:text-status-approval' },
  working: { label: 'Working', className: 'text-status-progress' },
  idle: { label: 'Idle', className: 'text-muted-foreground' },
}

function agentState(tickets, id) {
  const mine = tickets.filter((t) => t.assignee === id)
  if (mine.some((t) => t.status === 'stuck')) return 'stuck'
  if (mine.some((t) => t.status === 'approval')) return 'approval'
  if (mine.some((t) => t.status === 'progress' && !t.paused)) return 'working'
  return 'idle'
}

const TEAMMATE_STATE = {
  asking: { label: 'Asking you', className: 'text-status-stuck' },
  review: { label: 'Review', className: 'text-status-review' },
  working: { label: 'Working', className: 'text-status-progress' },
  idle: { label: 'Idle', className: 'text-muted-foreground' },
}

function teammateState(tickets, id) {
  const mine = tickets.filter((t) => t.assignee === id)
  if (mine.some((t) => t.status === 'stuck')) return 'asking'
  if (mine.some((t) => t.status === 'review')) return 'review'
  if (mine.some((t) => t.status === 'progress')) return 'working'
  return 'idle'
}

export function AppSidebar({ tickets, items, view, setView, agentFilter, setAgentFilter, dark, setDark, ...props }) {
  const blocking = items.some((i) => ITEM_KIND[i.kind].group === 'blocked')
  const mine = tickets.filter((t) => t.assignee === 'john' && t.status !== 'done').length

  const nav = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: items.length, alert: blocking },
    { id: 'mine', label: 'My issues', icon: CircleUserRound, badge: mine },
    { id: 'all', label: 'Board', icon: LayoutGrid },
    { id: 'agents', label: 'Agent work', icon: Bot },
  ]

  const select = (id) => {
    setView(id)
    setAgentFilter(null)
  }

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary font-semibold text-sidebar-primary-foreground">
                    W
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Within</span>
                    <span className="truncate text-xs text-muted-foreground">Pro plan · 7 seats</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56" align="start">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
                <DropdownMenuItem>
                  Within
                  <DropdownMenuShortcut>⌘1</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Side projects
                  <DropdownMenuShortcut>⌘2</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Plus /> Add workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Search" className="text-muted-foreground">
              <Search />
              <span>Search</span>
              <Kbd className="ml-auto">⌘K</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="New ticket">
              <SquarePen />
              <span>New ticket</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map(({ id, label, icon: Icon, badge, alert }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton tooltip={label} isActive={view === id && !agentFilter} onClick={() => select(id)}>
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                  {badge > 0 && (
                    <SidebarMenuBadge className="min-w-0 px-0">
                      <CountPill n={badge} alert={alert} className="h-5 min-w-5 px-1.5 text-xs" />
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Agents</SidebarGroupLabel>
          <SidebarGroupAction title="Add agent">
            <Plus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {AGENT_IDS.map((id) => {
                const state = agentState(tickets, id)
                return (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      tooltip={`${PEOPLE[id].name} · ${AGENT_STATE[state].label}`}
                      isActive={agentFilter === id}
                      onClick={() => setAgentFilter(agentFilter === id ? null : id)}
                    >
                      <AgentAvatar id={id} size="sm" live={state === 'working'} alert={state === 'stuck'} className="size-4!" />
                      <span>{PEOPLE[id].name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className={cn('font-normal', AGENT_STATE[state].className)}>{AGENT_STATE[state].label}</SidebarMenuBadge>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Teammates</SidebarGroupLabel>
          <SidebarGroupAction title="Invite teammate">
            <Plus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {TEAMMATE_IDS.map((id) => {
                const state = teammateState(tickets, id)
                return (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      tooltip={`${PEOPLE[id].name} · ${TEAMMATE_STATE[state].label}`}
                      isActive={agentFilter === id}
                      onClick={() => setAgentFilter(agentFilter === id ? null : id)}
                    >
                      <AgentAvatar id={id} size="sm" className="size-4! text-[8px]" />
                      <span>{PEOPLE[id].name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className={cn('font-normal', TEAMMATE_STATE[state].className)}>{TEAMMATE_STATE[state].label}</SidebarMenuBadge>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Teams</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                ['Platform', 'bg-status-progress'],
                ['Design', 'bg-status-review'],
                ['Product', 'bg-status-done'],
              ].map(([team, color]) => (
                <SidebarMenuItem key={team}>
                  <SidebarMenuButton tooltip={team}>
                    <span className="grid size-4 place-items-center">
                      <span className={cn('size-2 rounded-[3px]', color)} />
                    </span>
                    <span>{team}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <AgentAvatar id="john" size="default" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">John Rodrigues</span>
                    <span className="truncate text-xs text-muted-foreground">john@within.app</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56" side="top" align="start">
                <DropdownMenuItem onClick={() => setDark(!dark)}>
                  {dark ? <Sun /> : <Moon />}
                  {dark ? 'Light mode' : 'Dark mode'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

import { Check, GitPullRequest, MessageCircleQuestion, ShieldAlert, Sparkle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarBadge, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PEOPLE, STATUS_BY_ID } from '@/data'

export const NEED_KIND = {
  stuck: { label: 'Answer a question', short: 'Blocked', icon: MessageCircleQuestion, tone: 'text-status-stuck bg-status-stuck/10' },
  approval: { label: 'Approve an action', short: 'Approval', icon: ShieldAlert, tone: 'text-amber-700 bg-status-approval/15 dark:text-status-approval' },
  review: { label: 'Review finished work', short: 'Review', icon: GitPullRequest, tone: 'text-status-review bg-status-review/10' },
}

export function needsOf(tickets, kinds = ['stuck', 'approval', 'review']) {
  return kinds.flatMap((k) => tickets.filter((t) => t.status === k && PEOPLE[t.assignee].kind === 'agent'))
}

export function urgentCount(tickets) {
  return needsOf(tickets, ['stuck', 'approval']).length
}

export function surfacedAt(ticket) {
  const hit = [...ticket.log].reverse().find((e) => ['error', 'approval', 'done'].includes(e.kind))
  return (hit ?? ticket.log.at(-1))?.t ?? ''
}

export function needSummary(ticket) {
  if (ticket.status === 'stuck') return ticket.blocker?.title
  if (ticket.status === 'approval') return `Wants to run ${ticket.approval?.action}`
  if (ticket.status === 'review') return ticket.outputs.find((o) => o.type === 'pr')?.label.split(' · ')[0] + ' is ready'
  if (ticket.status === 'queued' && ticket.steps) return 'Ready to start'
  return ''
}

export function WithinMark({ className }) {
  return (
    <span className={cn('grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground', className)}>
      <Sparkles className="size-[55%]" />
    </span>
  )
}

export function ApproveButton({ ticket, onApprove, size = 'sm' }) {
  const agent = PEOPLE[ticket.assignee]
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size={size}>
          <Check /> Approve
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-status-approval/15 text-amber-700 dark:text-status-approval">
            <ShieldAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Let {agent.name} run this on production?</AlertDialogTitle>
          <AlertDialogDescription>
            <code className="font-mono text-foreground">{ticket.approval.action}</code> can't be undone from the board. {ticket.approval.reason}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onApprove(ticket.id)}>Approve and run</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const STATUS_TONE = {
  queued: {
    text: 'text-status-queued',
    badge: 'bg-status-queued/10 text-muted-foreground',
    bar: '*:data-[slot=progress-indicator]:bg-status-queued',
    dot: 'bg-status-queued',
  },
  progress: {
    text: 'text-status-progress',
    badge: 'bg-status-progress/10 text-status-progress',
    bar: '*:data-[slot=progress-indicator]:bg-status-progress',
    dot: 'bg-status-progress',
  },
  stuck: {
    text: 'text-status-stuck',
    badge: 'bg-status-stuck/10 text-status-stuck',
    bar: '*:data-[slot=progress-indicator]:bg-status-stuck',
    dot: 'bg-status-stuck',
  },
  approval: {
    text: 'text-status-approval',
    badge: 'bg-status-approval/15 text-amber-700 dark:text-status-approval',
    bar: '*:data-[slot=progress-indicator]:bg-status-approval',
    dot: 'bg-status-approval',
  },
  review: {
    text: 'text-status-review',
    badge: 'bg-status-review/10 text-status-review',
    bar: '*:data-[slot=progress-indicator]:bg-status-review',
    dot: 'bg-status-review',
  },
  done: {
    text: 'text-status-done',
    badge: 'bg-status-done/10 text-status-done',
    bar: '*:data-[slot=progress-indicator]:bg-status-done',
    dot: 'bg-status-done',
  },
}

export function AgentAvatar({ id, size = 'sm', live = false, alert = false, className }) {
  const p = PEOPLE[id]
  if (!p) return null
  const isAgent = p.kind === 'agent'
  return (
    <Avatar size={size} className={cn(isAgent && 'rounded-md after:rounded-md', className)}>
      <AvatarFallback
        className={cn('font-medium text-white', isAgent && 'rounded-md')}
        style={{ background: p.color }}
        title={isAgent ? `${p.name} · ${p.role}` : p.name}
      >
        {isAgent ? <Sparkle className="size-3/5 fill-current" /> : p.initials}
      </AvatarFallback>
      {live && <AvatarBadge className="bg-status-progress animate-[agent-pulse_1.6s_ease-out_infinite]" />}
      {alert && <AvatarBadge className="bg-status-stuck" />}
    </Avatar>
  )
}

export function StatusIcon({ status, className }) {
  const common = { viewBox: '0 0 14 14', 'aria-hidden': true, className: cn('size-3.5 shrink-0', STATUS_TONE[status].text, className) }
  switch (status) {
    case 'queued':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.2 2" />
        </svg>
      )
    case 'progress':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 3.5 A3.5 3.5 0 0 1 7 10.5 Z" fill="currentColor" />
        </svg>
      )
    case 'stuck':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6.25" fill="currentColor" />
          <rect x="6.25" y="3.5" width="1.5" height="4.5" rx=".75" fill="#fff" />
          <circle cx="7" cy="10" r=".9" fill="#fff" />
        </svg>
      )
    case 'approval':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="7" cy="7" r="2.2" fill="currentColor" />
        </svg>
      )
    case 'review':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 3.5 A3.5 3.5 0 1 1 3.5 7 L7 7 Z" fill="currentColor" />
        </svg>
      )
    case 'done':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6.25" fill="currentColor" />
          <path d="M4.3 7.2l1.8 1.8 3.6-3.8" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

export function StatusBadge({ status, className }) {
  return (
    <Badge variant="ghost" className={cn('gap-1.5', STATUS_TONE[status].badge, className)}>
      <StatusIcon status={status} className="size-3" />
      {STATUS_BY_ID[status].label}
    </Badge>
  )
}

const PRIORITY_LEVEL = { low: 1, medium: 2, high: 3 }

export function PriorityIcon({ priority }) {
  if (priority === 'urgent') {
    return (
      <span title="Urgent" className="grid size-3.5 place-items-center rounded-[4px] bg-status-stuck text-[10px] font-bold text-white">
        !
      </span>
    )
  }
  const level = PRIORITY_LEVEL[priority] ?? 0
  return (
    <svg viewBox="0 0 14 14" className="size-3.5 text-muted-foreground" aria-label={`${priority} priority`}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={2 + i * 4} y={9 - i * 3} width="2.5" height={3 + i * 3} rx=".6" fill="currentColor" opacity={i < level ? 1 : 0.25} />
      ))}
    </svg>
  )
}

export function stepNumber(ticket) {
  if (!ticket.steps) return 0
  if (ticket.status === 'queued') return 0
  return Math.min(ticket.step + 1, ticket.steps.length)
}

export function StepProgress({ ticket, className }) {
  const total = ticket.steps.length
  const doneSteps = ticket.status === 'queued' ? 0 : Math.min(ticket.step, total)
  const tone = ticket.paused ? STATUS_TONE.queued : STATUS_TONE[ticket.status]
  return <Progress value={(doneSteps / total) * 100} className={cn('h-1.5', tone.bar, className)} />
}

// The one count badge. Alert = something is blocking an agent: white on red in both themes.
export function CountPill({ n, alert = false, className }) {
  if (!n) return null
  return (
    <span
      className={cn(
        'grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-medium tabular-nums',
        alert ? 'bg-alert text-white' : 'bg-muted-foreground/15 text-muted-foreground',
        className,
      )}
    >
      {n}
    </span>
  )
}

export function LiveDot({ className }) {
  return <span className={cn('size-1.5 shrink-0 rounded-full bg-status-progress animate-[agent-pulse_1.6s_ease-out_infinite]', className)} />
}

export function Rich({ text }) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  )
}

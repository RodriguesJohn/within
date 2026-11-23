import { useEffect, useState } from 'react'
import {
  Ban,
  Check,
  Circle,
  CircleCheck,
  CirclePlay,
  Ellipsis,
  FileText,
  GitBranch,
  GitPullRequest,
  Hand,
  Link2,
  ListChecks,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  TriangleAlert,
  Undo2,
  UserRound,
  UserRoundPen,
  X,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { AGENT_IDS, PEOPLE } from '@/data'
import { AgentAvatar, LiveDot, StatusBadge, StatusIcon, StepProgress, stepNumber } from './agent-ui'

const LOG_ICON = {
  start: CirclePlay,
  step: Check,
  error: TriangleAlert,
  approval: ShieldAlert,
  human: UserRound,
  pause: Pause,
  done: GitPullRequest,
}

const LOG_TONE = {
  step: 'text-status-done',
  error: 'border-status-stuck bg-status-stuck text-white',
  approval: 'border-status-approval bg-status-approval text-white',
  done: 'border-status-review bg-status-review text-white',
}

const OUTPUT_ICON = { branch: GitBranch, pr: GitPullRequest, file: FileText }
const OUTPUT_LABEL = { branch: 'Branch', pr: 'Pull request', file: 'File' }

function EmptyTab({ icon: Icon, title, children }) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{children}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function AgentPanel({ ticket, actions, onClose, onAnswer, chat, tabRequest, titleAs: TitleAs = 'h2' }) {
  // Opens on the tracker (plan). Reply asks for the chat tab, when the chat lives in this panel.
  const wanted = (req) => (req?.tab === 'chat' && chat ? 'chat' : 'plan')
  const [tab, setTab] = useState(() => wanted(tabRequest))
  useEffect(() => {
    if (tabRequest) setTab(wanted(tabRequest))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabRequest?.n])

  const person = PEOPLE[ticket.assignee]
  const isAgent = person.kind === 'agent'
  const total = ticket.steps?.length
  const finished = ticket.status === 'review' || ticket.status === 'done'

  const answer = () => {
    if (chat) setTab('chat')
    onAnswer(ticket.id)
  }

  const nowLabel = {
    queued: 'Up next',
    progress: ticket.paused ? 'Paused at' : 'Now doing',
    stuck: 'Stuck at',
    approval: 'Waiting at',
    review: 'Finished',
    done: 'Finished',
  }[ticket.status]

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-1.5 border-b px-4">
        <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
        <span className="text-muted-foreground/60">/</span>
        <span className="text-sm text-muted-foreground">{ticket.team}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" title="More actions">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>
                <Link2 /> Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Reassign to</DropdownMenuLabel>
              {[...AGENT_IDS, 'john'].map((id) => (
                <DropdownMenuItem key={id} disabled={id === ticket.assignee} onClick={() => actions.reassign(ticket.id, id)}>
                  <AgentAvatar id={id} size="sm" className="size-4" />
                  {id === 'john' ? 'Me' : PEOPLE[id].name}
                  {PEOPLE[id].kind === 'agent' && <span className="ml-auto text-xs text-muted-foreground">{PEOPLE[id].role}</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && (
            <Button variant="ghost" size="icon-sm" title="Close" onClick={onClose}>
              <X />
            </Button>
          )}
        </div>
      </header>

      <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3">
        <TitleAs className="text-lg leading-snug font-semibold tracking-tight">{ticket.title}</TitleAs>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={ticket.status} />
          <Badge variant="outline" className="gap-1.5 pl-1">
            <AgentAvatar id={ticket.assignee} size="sm" className="size-4" live={isAgent && ticket.status === 'progress' && !ticket.paused} />
            {person.name}
            {isAgent && <span className="font-normal text-muted-foreground">{person.role}</span>}
          </Badge>
          {ticket.paused && <Badge variant="secondary">Paused</Badge>}
        </div>

        {isAgent && total && (
          <Card size="sm" className="gap-2 bg-muted/40 shadow-none">
            <CardHeader>
              <CardDescription className="text-[11px] font-medium tracking-wider uppercase">{nowLabel}</CardDescription>
              <CardAction className="font-mono text-xs text-muted-foreground tabular-nums">
                Step {stepNumber(ticket)} of {total}
              </CardAction>
              <CardTitle className="flex items-center gap-2 text-sm">
                {ticket.status === 'progress' && !ticket.paused && <LiveDot />}
                {finished ? 'All steps complete' : ticket.steps[Math.min(ticket.step, total - 1)]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StepProgress ticket={ticket} />
            </CardContent>
          </Card>
        )}

        {ticket.status === 'stuck' && ticket.blocker && (
          <Alert variant="destructive" className="border-status-stuck/30 bg-status-stuck/5">
            <TriangleAlert />
            <AlertTitle>{ticket.blocker.title}</AlertTitle>
            <AlertDescription>
              <p>{ticket.blocker.detail}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button size="sm" onClick={answer}>
                  <MessageSquare /> Answer in chat
                </Button>
                <Button size="sm" variant="outline" onClick={() => actions.retry(ticket.id)}>
                  <RotateCcw /> Retry
                </Button>
                <Button size="sm" variant="outline" onClick={() => actions.takeOver(ticket.id)}>
                  <Hand /> Take over
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {ticket.status === 'approval' && ticket.approval && (
          <Alert className="border-status-approval/40 bg-status-approval/5">
            <ShieldAlert className="text-amber-700! dark:text-status-approval!" />
            <AlertTitle>{person.name} wants to run</AlertTitle>
            <AlertDescription>
              <pre className="my-1.5 w-full overflow-x-auto rounded-md bg-foreground px-2.5 py-2 font-mono text-xs text-background">
                {ticket.approval.action}
              </pre>
              <p>{ticket.approval.reason}</p>
              <div className="mt-2 flex gap-1.5">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm">
                      <Check /> Approve
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia className="bg-status-approval/15 text-amber-700 dark:text-status-approval">
                        <ShieldAlert />
                      </AlertDialogMedia>
                      <AlertDialogTitle>Let {person.name} run this on production?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <code className="font-mono text-foreground">{ticket.approval.action}</code> can't be undone from the board.{' '}
                        {ticket.approval.reason}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => actions.approve(ticket.id)}>Approve and run</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button size="sm" variant="outline" onClick={() => actions.reject(ticket.id)}>
                  <Ban /> Reject
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="-ml-2 flex flex-wrap gap-0.5 empty:hidden">
          {isAgent && ticket.status === 'progress' && (
            <Button variant="ghost" size="sm" onClick={() => actions.togglePause(ticket.id)}>
              {ticket.paused ? <Play /> : <Pause />}
              {ticket.paused ? 'Resume' : 'Pause'}
            </Button>
          )}
          {isAgent && ticket.status === 'queued' && (
            <Button variant="ghost" size="sm" onClick={() => actions.start(ticket.id)}>
              <Play /> Start now
            </Button>
          )}
          {isAgent && !['done', 'stuck'].includes(ticket.status) && (
            <Button variant="ghost" size="sm" onClick={() => actions.takeOver(ticket.id)}>
              <Hand /> Take over
            </Button>
          )}
          {!isAgent && ticket.prevAgent && (
            <Button variant="ghost" size="sm" onClick={() => actions.handBack(ticket.id)}>
              <Undo2 /> Hand back to {PEOPLE[ticket.prevAgent].name}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
        <TabsList variant="line" className="w-full justify-start border-b px-3">
          {[
            chat && ['chat', 'Chat', ticket.chat.length],
            ['plan', 'Plan', total ?? 0],
            ['activity', 'Activity', ticket.log.length],
            ['outputs', 'Outputs', ticket.outputs.length],
          ]
            .filter(Boolean)
            .map(([id, label, count]) => (
            <TabsTrigger key={id} value={id} className="flex-none px-2">
              {label}
              <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {chat && (
          <TabsContent value="chat" className="flex min-h-0 flex-col">
            {chat}
          </TabsContent>
        )}

        <TabsContent value="plan" className="min-h-0">
          <ScrollArea className="h-full">
            {total ? (
              <ol className="flex flex-col gap-1 p-4">
                {ticket.steps.map((label, i) => {
                  const done = finished || i < ticket.step
                  const current = !finished && i === ticket.step && ticket.status !== 'queued'
                  return (
                    <li
                      key={label}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm',
                        current && 'bg-muted font-medium',
                        !done && !current && 'text-muted-foreground',
                      )}
                    >
                      {done ? (
                        <CircleCheck className="size-4 text-status-done" />
                      ) : current ? (
                        <StatusIcon status={ticket.paused ? 'queued' : ticket.status} className="size-4" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground/50" />
                      )}
                      <span className="flex-1">{label}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <EmptyTab icon={ListChecks} title="No plan">
                Human-owned tickets don't have an agent plan.
              </EmptyTab>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="activity" className="min-h-0">
          <ScrollArea className="h-full">
            {ticket.log.length ? (
              <ol className="relative flex flex-col gap-1 p-4 before:absolute before:top-6 before:bottom-6 before:left-[26px] before:w-px before:bg-border">
                {[...ticket.log].reverse().map((e, i) => {
                  const Icon = LOG_ICON[e.kind] ?? CircleCheck
                  return (
                    <li key={i} className="relative flex items-start gap-3 py-1">
                      <span
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded-full border bg-background text-muted-foreground',
                          LOG_TONE[e.kind],
                        )}
                      >
                        <Icon className="size-3" />
                      </span>
                      <span className={cn('flex-1 pt-px text-sm', e.kind === 'error' && 'font-medium text-status-stuck')}>{e.text}</span>
                      <time className="pt-0.5 font-mono text-[10px] text-muted-foreground">{e.t}</time>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <EmptyTab icon={UserRoundPen} title="No activity yet">
                Steps, errors, and human actions show up here.
              </EmptyTab>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="outputs" className="min-h-0">
          <ScrollArea className="h-full">
            {ticket.outputs.length ? (
              <div className="flex flex-col gap-2 p-4">
                {ticket.outputs.map((o, i) => {
                  const Icon = OUTPUT_ICON[o.type] ?? FileText
                  return (
                    <Card key={i} size="sm" className="flex-row items-center gap-3 px-3">
                      <Icon
                        className={cn(
                          'size-4 shrink-0',
                          o.type === 'pr' && 'text-status-review',
                          o.type === 'branch' && 'text-status-progress',
                          o.type === 'file' && 'text-muted-foreground',
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">{o.label}</span>
                      <Badge variant="secondary">{OUTPUT_LABEL[o.type]}</Badge>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <EmptyTab icon={GitPullRequest} title="No outputs yet">
                PRs, branches, and files show up here.
              </EmptyTab>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

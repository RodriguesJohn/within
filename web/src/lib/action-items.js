import { PEOPLE } from '@/data'

export const ITEM_KIND = {
  answer: { label: 'Needs answer', group: 'blocked', status: 'stuck' },
  approve: { label: 'Needs approval', group: 'blocked', status: 'approval' },
  review: { label: 'Ready for review', group: 'review', status: 'review' },
  start: { label: 'Ready to start', group: 'start', status: 'queued' },
}

export const ITEM_GROUPS = [
  { id: 'blocked', label: 'Blocked on you' },
  { id: 'review', label: 'Ready for review' },
  { id: 'start', label: 'Ready to start' },
]

const GROUP_RANK = { blocked: 0, review: 1, start: 2 }
const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 }
const SINCE_LOG_KIND = { answer: 'error', approve: 'approval', review: 'done', start: 'start' }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Log and chat times are "HH:MM" for today or a weekday name for earlier days.
export function timeKey(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t ?? '')
  if (m) return Number(m[1]) * 60 + Number(m[2])
  const day = DAYS.indexOf(t)
  if (day === -1) return -Infinity
  const daysAgo = (new Date().getDay() - day + 7) % 7 || 7
  return -daysAgo * 1440
}

export function waitLabel(since) {
  const key = timeKey(since)
  if (key < 0) return since ? `since ${since}` : ''
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes() - key
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export function isDestructive(action = '') {
  return /\b(drop|delete|truncate|destroy|force[- ]push)\b|prod(uction)?\b/i.test(action)
}

// Teammates surface the same way agents do: a question for you, or work waiting on your review.
function humanItemFor(t) {
  if (t.status === 'stuck' && t.blocker) {
    return { kind: 'answer', title: t.blocker.title, ask: t.blocker.question, suggestions: t.blocker.suggestions ?? [] }
  }
  if (t.status === 'review' && t.request) {
    return { kind: 'review', title: t.request.title, ask: t.request.ask }
  }
  return null
}

function itemFor(t) {
  const agent = PEOPLE[t.assignee]
  if (t.assignee === 'john') return null // your own work never waits on you
  if (agent?.kind === 'human') {
    const item = humanItemFor(t)
    return item && { ...item, human: true }
  }
  if (agent?.kind !== 'agent') return null
  if (t.status === 'stuck' && t.blocker) {
    return { kind: 'answer', title: t.blocker.title, ask: t.blocker.question, suggestions: t.blocker.suggestions ?? [] }
  }
  if (t.status === 'approval' && t.approval) {
    return {
      kind: 'approve',
      title: 'Approve action',
      ask: `I need your approval to run \`${t.approval.action}\`.`,
      detail: t.approval.reason,
      destructive: isDestructive(t.approval.action),
    }
  }
  const pr = t.outputs.find((o) => o.type === 'pr')
  if (t.status === 'review' && pr) {
    const prName = pr.label.split(' · ')[0]
    return { kind: 'review', title: `${prName} ready`, ask: `${prName} is ready for review.` }
  }
  if (t.status === 'queued' && t.steps) {
    return { kind: 'start', title: 'Ready to start', ask: `${t.steps.length} steps planned, starting with "${t.steps[0]}".` }
  }
  return null
}

export function getActionItems(tickets) {
  return tickets
    .map((t) => {
      const item = itemFor(t)
      if (!item) return null
      const since = [...t.log].reverse().find((e) => e.kind === SINCE_LOG_KIND[item.kind])?.t
      return { ...item, id: `${t.id}:${item.kind}`, ticketId: t.id, agent: t.assignee, priority: t.priority, project: t.project, since }
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        GROUP_RANK[ITEM_KIND[a.kind].group] - GROUP_RANK[ITEM_KIND[b.kind].group] ||
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        timeKey(a.since) - timeKey(b.since),
    )
}

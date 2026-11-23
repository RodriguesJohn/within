// Everything the page shows lives here. Paste a URL into any `url: ""` to fill it in.

import {
  siClaude,
  siCursor,
  siGithub,
  siFigma,
  siReact,
  siShadcnui,
  siTailwindcss,
  siVercel,
  type SimpleIcon,
} from "simple-icons"

/** This project's repo on GitHub. */
const GITHUB_URL = "https://github.com/RodriguesJohn/within"

const FIGJAM_URL =
  "https://www.figma.com/board/fR4r1M1AzABGOEjGYV82wa/Design-Within?node-id=0-1&t=NzEqdG9QrkDMOzA7-1"

/** The "Mind map — Agent at work" section on the board (node 1:84). */
export const MIND_MAP_URL =
  "https://www.figma.com/board/fR4r1M1AzABGOEjGYV82wa/Design-Within?node-id=1-84"

export type Resource = {
  id: string
  title: string
  url: string
}

export type LinkKind =
  "figma" | "prototype" | "doc" | "chat" | "github" | "agent"

export type Link = {
  label: string
  url: string
  kind: LinkKind
  /** In-page route (a hash) instead of an outside URL. */
  route?: string
}

export const project = {
  title: "Design challenge",
  oneLiner:
    "A ticket has been assigned to an AI agent that's now working it autonomously. Design the ticket view that shows what the agent is doing right now, how far along it is, where it's stuck, and how a human steps in.",
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const BRIEF = "brief"
export const CHAT_LOG = "chat-log"

// ── Sidebar: Figma ────────────────────────────────────────────────────────────

export const figma: Resource = { id: "figma", title: "Figma", url: FIGJAM_URL }

// ── Sidebar: App ──────────────────────────────────────────────────────────────

export type Prototype = Resource & {
  name: string
  idea: string
  tradeoff: string
  picked?: boolean
}

export const prototypes: Prototype[] = [
  {
    id: "prototype-1",
    title: "Prototype 1",
    url: "https://within-prototype.vercel.app",
    name: "Board, Linear style",
    idea: "Agents sit on the same board as people, and an inbox surfaces what needs a human.",
    tradeoff: "Matches how teams already work, and scales to a lot of tickets.",
    picked: true,
  },
  {
    id: "prototype-2",
    title: "Prototype 2",
    url: "",
    name: "Chat groups",
    idea: "Agents join chat groups like teammates. You check in, assign work and unblock them the way you'd manage a team in Slack.",
    tradeoff:
      "Feels natural for small teams, but status gets buried in conversation once there are many tickets.",
  },
  {
    id: "prototype-3",
    title: "Prototype 3",
    url: "",
    name: "Voice",
    idea: "A richer, visual view of the run, plus voice: ask an agent what it's doing, approve a step or redirect it out loud.",
    tradeoff:
      "Hands-free and quick, but a new pattern to learn, and a constant voice channel risks cognitive overload.",
  },
  {
    id: "prototype-4",
    title: "Prototype 4",
    url: "",
    name: "Notifications only",
    idea: "No board. When an agent is stuck or needs approval, a desktop notification surfaces at the top of the screen and you act right there.",
    tradeoff:
      "Only what needs you reaches you, but a stream of notifications leads to cognitive overload and loses the big picture.",
  },
]

/** Sample notifications for the Prototype 4 concept. Taken from the Prototype 1 tickets. */
export const sampleNotifications = [
  {
    agent: "Relay",
    ticket: "WIT-168",
    title: "Needs approval",
    body: "Run rotate-credentials --env=production",
    actions: ["Reject", "Approve"],
  },
  {
    agent: "Relay",
    ticket: "WIT-138",
    title: "Stuck",
    body: "Stripe key rejected (401)",
    actions: ["Take over", "Reply"],
  },
  {
    agent: "Atlas",
    ticket: "WIT-166",
    title: "Stuck",
    body: "3 auth tests failing since #471",
    actions: ["Take over", "Reply"],
  },
]

// ── Overview: links, two by two ───────────────────────────────────────────────

export const linkCards: { title: string; links: Link[] }[] = [
  {
    title: "Design",
    links: [
      {
        label: "Figma whiteboard",
        url: figma.url,
        kind: "figma",
        route: figma.id,
      },
    ],
  },
  {
    title: "App",
    links: prototypes.map((p) => ({
      label: p.picked ? p.title : `${p.title}: ${p.name}`,
      url: p.url,
      route: p.id,
      kind: "prototype" as const,
    })),
  },
  {
    title: "Product",
    links: [
      { label: "Project brief", url: "", kind: "doc", route: BRIEF },
      { label: "Chat log", url: "", kind: "chat", route: CHAT_LOG },
    ],
  },
  {
    title: "Code",
    links: [{ label: "GitHub repo", url: GITHUB_URL, kind: "github" }],
  },
]

// ── Tools ─────────────────────────────────────────────────────────────────────

export type Tool = { name: string; icon: SimpleIcon }

export const tools: Tool[] = [
  { name: "Figma", icon: siFigma },
  { name: "Figma Desktop MCP", icon: siFigma },
  { name: "Cursor", icon: siCursor },
  { name: "Claude Code", icon: siClaude },
  { name: "React", icon: siReact },
  { name: "Tailwind", icon: siTailwindcss },
  { name: "shadcn/ui", icon: siShadcnui },
  { name: "GitHub", icon: siGithub },
  { name: "Vercel", icon: siVercel },
]

export const buildTools = ["Figma", "Cursor", "Claude Code"]

// ── Workflow: my steps ────────────────────────────────────────────────────────

export const workflowSteps = [
  "Explore the problem",
  "Pick the medium",
  "Design and build",
  "Design the agent",
]

export const agentFlow = [
  { title: "Input", detail: "The ticket and its acceptance criteria" },
  { title: "Tools", detail: "Code, GitHub, Figma, Slack and the tracker" },
  { title: "Output", detail: "A run with a trace of every tool call" },
  { title: "Evals", detail: "Checks every run against the criteria" },
]

export const agentCriteria = [
  {
    group: "Observability",
    detail: "A person can always answer the four questions from the run.",
  },
  {
    group: "Behaviour",
    detail: "Plans first, asks before risky actions, stops early when stuck.",
  },
  {
    group: "Outcome",
    detail: "Meets the ticket's acceptance criteria and opens a reviewable PR.",
  },
]

export const allLinks = linkCards.flatMap((card) => card.links)

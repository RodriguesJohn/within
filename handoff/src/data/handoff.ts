// Everything the page shows lives here. Paste a URL into any `url: ""` to fill it in.

import {
  siClaude,
  siCursor,
  siFigma,
  siReact,
  siShadcnui,
  siTailwindcss,
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
    url: "http://localhost:5173",
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

// ── Chat log: how the page took shape ──────────────────────────────────────

export type ChatEntry = { asked: string; changed: string[] }

export const chatLog: { date: string; source: string; entries: ChatEntry[] } = {
  date: "Nov 23, 2026",
  source: "Claude Code",
  entries: [
    {
      asked: "Start the local dev server.",
      changed: ["Started the page locally."],
    },
    {
      asked:
        "Dark mode, drop the eyebrow text, use Inter and my personal finance design system. Add an overview with all the links.",
      changed: [
        "Switched to the design system's tokens and type scale, with Inter.",
        "Removed the small uppercase labels above titles.",
        "Added a links section to the overview.",
      ],
    },
    {
      asked:
        "Sidebar should be Overview, Figma, then App with Prototype 1, 2 and 3. I should be able to see what we built.",
      changed: [
        "Rebuilt the sidebar around Overview, Figma and App.",
        "Embedded the working app inside the page as Prototype 1.",
      ],
    },
    {
      asked:
        "Keep it simple. Title, one-liner, plain links in four cards: Design, App, Product, Code. Add a process and tools card with logos, and a workflow.",
      changed: [
        "Cut the overview down to the title, two-by-two link cards and a process card.",
        "Added tool logos and a Workflow page.",
      ],
    },
    {
      asked:
        "Light mode, link icons, softer shadows. Explain why I picked this direction over chat, voice and notifications. Add the Figma Desktop MCP.",
      changed: [
        "Moved to light mode with soft-shadow cards.",
        "Added an icon to every link and an arrow where you can click.",
        "Added the four directions with their trade-offs.",
      ],
    },
    {
      asked:
        "The workflow should be mine: FigJam mind map, picking the medium, building with Figma, Cursor and Claude Code, then designing the agent with inputs, outputs and evals.",
      changed: [
        "Rewrote the workflow as four steps in my words.",
        "Added the agent's input, tools, output and evals, with its key criteria.",
        "Removed card outlines and trimmed the text.",
      ],
    },
    {
      asked:
        "Prototype 1 in dark mode by default. Embed the Figma board. Colour the logos.",
      changed: [
        "Prototype 1 now opens in dark mode.",
        "The Design Within board opens inside the page.",
        "Tool logos use their brand colours.",
      ],
    },
    {
      asked:
        "Only Prototype 1 exists. Describe the other directions instead, show Prototype 4 as a desktop notification, and replace specs and decisions with this chat log.",
      changed: [
        "Prototypes 2 to 4 are now concept pages marked as potential directions.",
        "Prototype 4 shows how notifications would surface on the desktop.",
        "Added the project brief and this chat log.",
      ],
    },
    {
      asked:
        "Use the design challenge as the brief, call the design link Figma whiteboard, and frame the voice and notification trade-offs as cognitive overload.",
      changed: [
        "The overview now opens with the challenge as Within wrote it.",
        "Renamed the design link to Figma whiteboard.",
        "Voice and Notifications only now name cognitive overload as the trade-off.",
      ],
    },
    {
      asked:
        "Show a preview of the mind map, and make the Prototype 1 chat less dense.",
      changed: [
        "The workflow now embeds the mind map from the FigJam board.",
        "Chat messages share one plain style, with actions as quiet buttons underneath.",
        "Removed the status labels and monospace IDs from the chat.",
      ],
    },
    {
      asked:
        "There's no Within repo or Atlas link. Code should just be my GitHub.",
      changed: ["The Code card now has a single GitHub link."],
    },
    {
      asked:
        "Drop the word handoff. Say Within interview and my name, add my photo and the Within logo.",
      changed: [
        "The header now reads Within interview, John Rodrigues.",
        "Added the Within logo and my profile photo.",
      ],
    },
    {
      asked: "Put my Cursor chat log from today on the Chat log page.",
      changed: [
        "The Chat log page now shows the Cursor session too, as a conversation.",
      ],
    },
    {
      asked: "Too text heavy at the top of the chat log.",
      changed: [
        "Cut the chat log intro, shortened the tabs, and folded long replies behind Show more.",
      ],
    },
    {
      asked:
        "Create a GitHub repo for this project and link it from the Code card.",
      changed: [
        "Pushed the project to GitHub and pointed the Code link at the repo.",
      ],
    },
  ],
}

export const allLinks = linkCards.flatMap((card) => card.links)

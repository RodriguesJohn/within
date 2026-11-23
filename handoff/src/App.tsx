import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  AppWindowIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BellIcon,
  BotIcon,
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  FileTextIcon,
  FrameIcon,
  LayoutDashboardIcon,
  MenuIcon,
  MessagesSquareIcon,
  RotateCwIcon,
  WorkflowIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { siFigma, siGithub, type SimpleIcon } from "simple-icons"

import cursorLog from "../../docs/CHAT_LOG_2026-11-23.md?raw"
import brief from "../../PROJECT_KNOWLEDGE_BASE.md?raw"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  agentCriteria,
  agentFlow,
  BRIEF,
  buildTools,
  CHAT_LOG,
  chatLog,
  figma,
  linkCards,
  MIND_MAP_URL,
  project,
  prototypes,
  sampleNotifications,
  tools,
  workflowSteps,
  type Link,
  type LinkKind,
  type Prototype,
  type Resource,
} from "@/data/handoff"
import { cn } from "@/lib/utils"

const OVERVIEW = "overview"
const WORKFLOW = "workflow"
const SURFACE = "surface"

const enter = (i: number) => ({ "--enter-i": i }) as CSSProperties

function useHashRoute() {
  const read = () => window.location.hash.replace("#", "") || OVERVIEW
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])

  return route
}

function hostOf(url: string) {
  try {
    const { host, pathname } = new URL(url)
    return host + (pathname === "/" ? "" : pathname)
  } catch {
    return url
  }
}

// ── Small pieces ──────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const label = copied ? "Copied" : "Copy link"

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      className="rounded-full"
      aria-label={label}
      title={label}
      onClick={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          })
          .catch(() => undefined)
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}

function OpenButton({ url, label = "Open" }: { url: string; label?: string }) {
  return (
    <Button asChild size="sm" className="rounded-full">
      <a href={url} target="_blank" rel="noreferrer">
        {label}
        <ArrowUpRightIcon />
      </a>
    </Button>
  )
}

function BrandIcon({
  icon,
  className,
}: {
  icon: SimpleIcon
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-4 shrink-0 fill-current", className)}
      aria-hidden
    >
      <path d={icon.path} />
    </svg>
  )
}

function FigmaLogo() {
  return (
    <svg viewBox="0 0 38 57" className="h-4 w-auto shrink-0" aria-hidden>
      <path
        fill="#1ABCFE"
        d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"
      />
      <path
        fill="#0ACF83"
        d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"
      />
      <path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path
        fill="#F24E1E"
        d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"
      />
      <path
        fill="#A259FF"
        d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"
      />
    </svg>
  )
}

/** Brand-colored logo. Figma gets its five-color mark; near-black brands use ink. */
function ToolLogo({ icon }: { icon: SimpleIcon }) {
  if (icon.slug === "figma") return <FigmaLogo />
  const sum =
    parseInt(icon.hex.slice(0, 2), 16) +
    parseInt(icon.hex.slice(2, 4), 16) +
    parseInt(icon.hex.slice(4, 6), 16)
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      style={{ fill: sum < 120 ? "var(--foreground)" : `#${icon.hex}` }}
      aria-hidden
    >
      <path d={icon.path} />
    </svg>
  )
}

function ToolChips({ only }: { only?: string[] }) {
  const list = only ? tools.filter((t) => only.includes(t.name)) : tools
  return (
    <ul className="flex flex-wrap gap-2">
      {list.map((tool) => (
        <li
          key={tool.name}
          className="flex h-8 items-center gap-2 rounded-full bg-muted px-3 text-sm"
        >
          <ToolLogo icon={tool.icon} />
          {tool.name}
        </li>
      ))}
    </ul>
  )
}

function DirectionBadge({ picked }: { picked?: boolean }) {
  return picked ? (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 type-meta text-primary">
      <CheckIcon className="size-3" />
      Picked
    </span>
  ) : (
    <span className="inline-flex w-fit items-center rounded-full bg-muted px-2 type-meta text-muted-foreground">
      Potential direction
    </span>
  )
}

function Section({
  title,
  index,
  children,
}: {
  title: string
  index: number
  children: ReactNode
}) {
  return (
    <section className="flex enter flex-col gap-3" style={enter(index)}>
      <h2 className="type-section">{title}</h2>
      {children}
    </section>
  )
}

function PageHeader({
  title,
  badge,
  children,
}: {
  title: string
  badge?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="flex enter flex-col gap-1" style={enter(0)}>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="type-page-title text-balance">{title}</h1>
        {badge}
      </div>
      {children && (
        <p className="max-w-[60ch] type-body text-muted-foreground">
          {children}
        </p>
      )}
    </header>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function NavItem({
  href,
  active,
  icon: Icon,
  label,
  nested,
  onNavigate,
}: {
  href: string
  active: boolean
  icon?: LucideIcon
  label: string
  nested?: boolean
  onNavigate: () => void
}) {
  return (
    <a
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        nested && "h-8",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 opacity-70" />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </a>
  )
}

function Sidebar({
  route,
  open,
  onClose,
}: {
  route: string
  open: boolean
  onClose: () => void
}) {
  const inApp = prototypes.some((p) => p.id === route)

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:sticky md:top-0 md:h-svh md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-5 pt-6 pb-5">
        <div className="flex items-start gap-3">
          <img
            src="/within-logo.png"
            alt="Within"
            className="mt-px h-7 w-auto shrink-0"
          />
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="type-card-title leading-none">Within interview</p>
            <div className="flex items-center gap-1.5 leading-none">
              <img
                src="/john.jpg"
                alt=""
                className="size-4 shrink-0 rounded-full object-cover object-top"
              />
              <span className="type-label leading-none text-muted-foreground">
                John Rodrigues
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Close menu"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
        <NavItem
          href={`#${OVERVIEW}`}
          active={route === OVERVIEW}
          icon={LayoutDashboardIcon}
          label="Overview"
          onNavigate={onClose}
        />
        <NavItem
          href={`#${WORKFLOW}`}
          active={route === WORKFLOW}
          icon={WorkflowIcon}
          label="Workflow"
          onNavigate={onClose}
        />
        <NavItem
          href={`#${figma.id}`}
          active={route === figma.id}
          icon={FrameIcon}
          label="Figma"
          onNavigate={onClose}
        />
        <NavItem
          href={`#${prototypes[0].id}`}
          active={false}
          icon={AppWindowIcon}
          label="App"
          onNavigate={onClose}
        />
        <div
          className={cn(
            "ml-[1.0625rem] flex flex-col gap-0.5 border-l pl-2",
            inApp ? "border-sidebar-foreground/20" : "border-sidebar-border"
          )}
        >
          {prototypes.map((p) => (
            <NavItem
              key={p.id}
              nested
              href={`#${p.id}`}
              active={route === p.id}
              label={p.title}
              onNavigate={onClose}
            />
          ))}
        </div>
      </nav>
    </aside>
  )
}

// ── Links ─────────────────────────────────────────────────────────────────────

const LINK_ICON: Record<LinkKind, LucideIcon | SimpleIcon> = {
  figma: siFigma,
  prototype: AppWindowIcon,
  doc: FileTextIcon,
  chat: MessagesSquareIcon,
  github: siGithub,
  agent: BotIcon,
}

function LinkKindIcon({ kind }: { kind: LinkKind }) {
  const icon = LINK_ICON[kind]
  let glyph: ReactNode
  if ("path" in icon) {
    glyph = <BrandIcon icon={icon} className="size-3.5" />
  } else {
    const Icon = icon
    glyph = <Icon className="size-3.5" />
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground/70">
      {glyph}
    </span>
  )
}

function LinkItem({ link }: { link: Link }) {
  const row =
    "group -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors duration-200"
  const arrow =
    "size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"

  if (link.route) {
    return (
      <a
        href={`#${link.route}`}
        className={cn(
          row,
          "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        )}
      >
        <LinkKindIcon kind={link.kind} />
        <span className="min-w-0 flex-1 truncate">{link.label}</span>
        <ArrowRightIcon className={arrow} />
      </a>
    )
  }

  if (link.url) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          row,
          "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        )}
      >
        <LinkKindIcon kind={link.kind} />
        <span className="min-w-0 flex-1 truncate">{link.label}</span>
        <ArrowUpRightIcon className={arrow} />
      </a>
    )
  }

  // No URL yet: same row, quieter, not clickable.
  return (
    <div className={cn(row, "text-muted-foreground")} title="Link coming soon">
      <LinkKindIcon kind={link.kind} />
      <span className="min-w-0 flex-1 truncate">{link.label}</span>
      <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground/40" />
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────

function Overview() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={project.title}>{project.oneLiner}</PageHeader>

      <Section index={1} title="Links">
        <div className="grid gap-4 sm:grid-cols-2">
          {linkCards.map((card) => (
            <div
              key={card.title}
              className={cn(SURFACE, "flex flex-col gap-2 p-5")}
            >
              <h3 className="type-card-title text-muted-foreground">
                {card.title}
              </h3>
              <ul className="flex flex-col gap-0.5">
                {card.links.map((link) => (
                  <li key={link.label}>
                    <LinkItem link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section index={2} title="Why this direction">
        <ul className="grid gap-4 sm:grid-cols-2">
          {prototypes.map((p) => (
            <li key={p.id}>
              <a
                href={`#${p.id}`}
                className={cn(
                  SURFACE,
                  "group flex h-full flex-col gap-1.5 p-5 transition-shadow duration-200 outline-none hover:shadow-[0_10px_28px_-12px_rgb(16_24_40/0.18)] focus-visible:ring-3 focus-visible:ring-ring/50"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="type-card-title">{p.name}</span>
                  <ArrowRightIcon className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
                <DirectionBadge picked={p.picked} />
                <span className="pt-1 type-label text-muted-foreground">
                  {p.tradeoff}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section index={3} title="Process and tools">
        <div className={cn(SURFACE, "flex flex-col gap-5 p-5")}>
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm">
            {workflowSteps.map((step, i) => (
              <li key={step} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                )}
                {step}
              </li>
            ))}
          </ol>
          <ToolChips />
          <a
            href={`#${WORKFLOW}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            See my workflow
            <ArrowRightIcon className="size-3.5" />
          </a>
        </div>
      </Section>
    </div>
  )
}

// ── Workflow ──────────────────────────────────────────────────────────────────

function MindMap() {
  const src = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(MIND_MAP_URL)}`
  return (
    <div className="flex flex-col gap-2">
      <iframe
        src={src}
        title="Mind map of the agent-at-work problem in FigJam"
        loading="lazy"
        allowFullScreen
        className="aspect-[16/10] w-full rounded-lg bg-muted"
      />
      <a
        href={MIND_MAP_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-fit items-center gap-1 type-meta text-muted-foreground hover:text-foreground"
      >
        Open the mind map in Figma
        <ArrowUpRightIcon className="size-3" />
      </a>
    </div>
  )
}

function Step({
  n,
  title,
  text,
  children,
  last,
}: {
  n: number
  title: string
  text: string
  children?: ReactNode
  last?: boolean
}) {
  return (
    <li className="relative flex enter gap-4 pb-6 last:pb-0" style={enter(n)}>
      {!last && (
        <span
          className="absolute top-9 bottom-1 left-4 w-px -translate-x-1/2 bg-border"
          aria-hidden
        />
      )}
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-sm tabular-nums shadow-[0_1px_3px_rgb(16_24_40/0.08)]">
        {n}
      </span>
      <div className={cn(SURFACE, "flex min-w-0 flex-1 flex-col gap-4 p-5")}>
        <div className="flex flex-col gap-1">
          <h3 className="type-card-title">{title}</h3>
          <p className="max-w-[60ch] type-label text-muted-foreground">
            {text}
          </p>
        </div>
        {children}
      </div>
    </li>
  )
}

function Workflow() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="My workflow">
        How I went from the brief to a working app and agent.
      </PageHeader>

      <ol className="flex flex-col">
        <Step
          n={1}
          title={workflowSteps[0]}
          text="I explored the problem statement in FigJam and mapped out how it should work as a mind map."
        >
          <MindMap />
        </Step>

        <Step
          n={2}
          title={workflowSteps[1]}
          text="I picked a Linear-style board. It matches how teams already think about tickets, and it holds up when there are a lot of them. With more time, I'd explore the others."
        >
          <ul className="flex flex-wrap gap-2">
            {prototypes.map((p) => (
              <li key={p.id}>
                <a
                  href={`#${p.id}`}
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-full px-3 text-sm transition-colors duration-200",
                    p.picked
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.picked && <CheckIcon className="size-3.5" />}
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </Step>

        <Step
          n={3}
          title={workflowSteps[2]}
          text="I designed and built it with Figma, Cursor and Claude Code, on top of my design system."
        >
          <ToolChips only={buildTools} />
        </Step>

        <Step
          n={4}
          last
          title={workflowSteps[3]}
          text="I designed Atlas, the agent working the tickets, with its input, tools, output and evals, and defined the criteria for success."
        >
          <ol className="grid gap-2 sm:grid-cols-4">
            {agentFlow.map((item) => (
              <li
                key={item.title}
                className="flex flex-col gap-0.5 rounded-lg bg-muted p-3"
              >
                <span className="text-sm">{item.title}</span>
                <span className="type-meta text-muted-foreground">
                  {item.detail}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2">
            <p className="type-label text-muted-foreground">Key criteria</p>
            <ul className="flex flex-col">
              {agentCriteria.map((c, i) => (
                <li key={c.group}>
                  {i > 0 && <Separator />}
                  <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
                    <span className="w-28 shrink-0 text-sm">{c.group}</span>
                    <span className="type-label text-muted-foreground">
                      {c.detail}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Step>
      </ol>
    </div>
  )
}

// ── Project brief ─────────────────────────────────────────────────────────────

const md: Components = {
  h1: () => null,
  h2: ({ children }) => (
    <h2 className="pt-6 type-section first:pt-0">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="pt-3 type-card-title">{children}</h3>,
  p: ({ children }) => (
    <p className="type-body text-secondary-ink">{children}</p>
  ),
  blockquote: ({ children }) => (
    <blockquote className="rounded-lg bg-muted px-4 py-2.5 type-label text-muted-foreground [&_p]:text-[length:inherit] [&_p]:text-inherit">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="flex list-disc flex-col gap-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex list-decimal flex-col gap-1 pl-5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="type-body text-secondary-ink">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="text-muted-foreground">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b py-2 pr-4 type-label font-normal text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b py-2.5 pr-4 align-top">{children}</td>
  ),
  hr: () => <Separator />,
}

function Brief() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Project brief">
        The knowledge base I built from the FigJam board. Every later step works
        from it.
      </PageHeader>
      <article
        className={cn(SURFACE, "flex enter flex-col gap-3 p-6 md:p-8")}
        style={enter(1)}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
          {brief}
        </ReactMarkdown>
      </article>
    </div>
  )
}

// ── Chat log ──────────────────────────────────────────────────────────────────

type Turn = { speaker: string; time?: string; body: string }

/**
 * Splits the Cursor chat log (docs/CHAT_LOG_2026-11-23.md) into an intro, the turns,
 * and the closing note about the parallel session. Session-id links point into Cursor,
 * so they render as plain text.
 */
function parseCursorLog(raw: string) {
  const clean = raw
    .replace(/^Session id:.*$/m, "")
    .replace(/\[([^\]]+)\]\([0-9a-f-]{36}\)/g, "$1")
  const blocks = clean
    .split(/\n---\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  const intro = blocks[0].replace(/^#\s.*$/m, "").trim()
  const turns: Turn[] = []
  let note: { title: string; body: string } | null = null

  for (const block of blocks.slice(1)) {
    const m = block.match(/^##\s+(.+)\n([\s\S]*)$/)
    if (!m) continue
    const [, heading, body] = m
    const [speaker, time] = heading.split("·").map((x) => x.trim())
    if (speaker === "You" || speaker === "Assistant") {
      turns.push({ speaker, time, body: body.trim() })
    } else {
      note = {
        title: heading.replace(/^Also today\s*[—-]\s*/, ""),
        body: body.trim(),
      }
    }
  }
  return { intro, turns, note }
}

const cursor = parseCursorLog(cursorLog)

const chatMd: Components = {
  ...md,
  p: ({ children }) => <p className="text-sm leading-6">{children}</p>,
  li: ({ children }) => <li className="text-sm leading-6">{children}</li>,
  td: ({ children }) => (
    <td className="border-b py-2 pr-4 align-top text-sm">{children}</td>
  ),
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div
      className="inline-flex w-fit rounded-full bg-black/[0.05] p-1"
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 rounded-full px-4 text-sm transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            value === o.value
              ? "bg-card text-foreground shadow-[0_1px_3px_rgb(16_24_40/0.1)]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function AssistantTurn({ body }: { body: string }) {
  const [open, setOpen] = useState(false)
  const long = body.length > 360

  return (
    <div className={cn(SURFACE, "flex flex-col gap-2.5 p-5")}>
      <div
        className={cn(
          "flex flex-col gap-2.5",
          long &&
            !open &&
            "max-h-36 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMd}>
          {body}
        </ReactMarkdown>
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-fit rounded-sm type-label text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

function CursorTranscript() {
  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-col gap-5">
        {cursor.turns.map((turn, i) =>
          turn.speaker === "You" ? (
            <li key={i} className="flex flex-col items-end gap-1">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground [&_strong]:text-primary-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMd}>
                  {turn.body}
                </ReactMarkdown>
              </div>
              {turn.time && (
                <span className="type-meta text-muted-foreground tabular-nums">
                  {turn.time}
                </span>
              )}
            </li>
          ) : (
            <li key={i} className="max-w-[92%]">
              <AssistantTurn body={turn.body} />
            </li>
          )
        )}
      </ol>
      {cursor.note && (
        <aside className="flex flex-col gap-2 rounded-xl bg-muted p-5">
          <h3 className="type-card-title">{cursor.note.title}</h3>
          <div className="flex flex-col gap-2 text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMd}>
              {cursor.note.body}
            </ReactMarkdown>
          </div>
        </aside>
      )}
    </div>
  )
}

function ClaudeTranscript() {
  return (
    <ol className="flex flex-col gap-4">
      {chatLog.entries.map((entry, i) => (
        <li
          key={entry.asked}
          className={cn(SURFACE, "flex flex-col gap-3 p-5")}
        >
          <div className="flex gap-3">
            <span className="pt-0.5 type-meta text-muted-foreground tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="min-w-0 flex-1 type-body">{entry.asked}</p>
          </div>
          <ul className="flex flex-col gap-1 pl-8">
            {entry.changed.map((c) => (
              <li
                key={c}
                className="flex gap-2 type-label text-muted-foreground"
              >
                <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
                {c}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

function ChatLog() {
  const [tab, setTab] = useState<"cursor" | "claude">("cursor")

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Chat log">Nov 23, 2026</PageHeader>
      <div className="flex enter flex-col gap-6" style={enter(1)}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "cursor", label: "Cursor" },
            { value: "claude", label: "Claude Code" },
          ]}
        />
        {tab === "cursor" ? <CursorTranscript /> : <ClaudeTranscript />}
      </div>
    </div>
  )
}

// ── Concept pages for prototypes not built yet ────────────────────────────────

function NotificationsMock() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(160deg,oklch(0.72_0.06_250),oklch(0.55_0.08_260))] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between type-meta text-white/80">
        <span>Desktop</span>
        <span className="tabular-nums">10:12</span>
      </div>
      <ul className="ml-auto flex max-w-sm flex-col gap-2">
        {sampleNotifications.map((n) => (
          <li
            key={n.ticket}
            className="flex flex-col gap-2 rounded-2xl bg-white/85 p-3 shadow-[0_8px_24px_-8px_rgb(16_24_40/0.35)] backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm text-background">
                W
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm">
                    {n.agent} · {n.title}
                  </span>
                  <span className="shrink-0 type-meta text-muted-foreground">
                    now
                  </span>
                </div>
                <span className="truncate type-label text-muted-foreground">
                  {n.ticket} · {n.body}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-1.5">
              {n.actions.map((a, i) => (
                <span
                  key={a}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 type-meta",
                    i === n.actions.length - 1
                      ? "bg-foreground text-background"
                      : "bg-black/[0.06]"
                  )}
                >
                  {a}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConceptView({ prototype }: { prototype: Prototype }) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={prototype.name} badge={<DirectionBadge />}>
        {prototype.title}. Not built yet, this is how I'd explore it.
      </PageHeader>

      <section
        className={cn(SURFACE, "flex enter flex-col gap-4 p-5")}
        style={enter(1)}
      >
        <div className="flex flex-col gap-1">
          <h3 className="type-card-title">What I think</h3>
          <p className="type-label text-muted-foreground">{prototype.idea}</p>
        </div>
        <Separator />
        <div className="flex flex-col gap-1">
          <h3 className="type-card-title">Trade-off</h3>
          <p className="type-label text-muted-foreground">
            {prototype.tradeoff}
          </p>
        </div>
      </section>

      {prototype.id === "prototype-4" && (
        <section className="flex enter flex-col gap-3" style={enter(2)}>
          <h2 className="flex items-center gap-2 type-section">
            <BellIcon className="size-4 text-muted-foreground" />
            How it would surface
          </h2>
          <NotificationsMock />
          <p className="type-meta text-muted-foreground">
            Three agents, three notifications in a minute. That's the cognitive
            overload.
          </p>
        </section>
      )}
    </div>
  )
}

// ── Embeds: Figma board and built prototypes ──────────────────────────────────

function embedSrc(resource: Resource) {
  if (resource.url.includes("figma.com")) {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(resource.url)}`
  }
  return resource.url
}

function EmbedView({ resource }: { resource: Resource }) {
  const [reloadKey, setReloadKey] = useState(0)
  const isFigma = resource.url.includes("figma.com")

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h1 className="type-section">{resource.title}</h1>
          <p className="truncate type-meta text-muted-foreground">
            {hostOf(resource.url)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="rounded-full"
            aria-label="Reload"
            title="Reload"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            <RotateCwIcon />
          </Button>
          <CopyButton value={resource.url} />
          <OpenButton
            url={resource.url}
            label={isFigma ? "Open in Figma" : "Open in new tab"}
          />
        </div>
      </header>

      <iframe
        key={reloadKey}
        src={embedSrc(resource)}
        title={resource.title}
        allowFullScreen
        className={cn(SURFACE, "min-h-0 w-full flex-1 bg-white")}
      />
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

function Page({ route }: { route: string }) {
  if (route === WORKFLOW) return <Workflow />
  if (route === BRIEF) return <Brief />
  if (route === CHAT_LOG) return <ChatLog />
  const concept = prototypes.find((p) => p.id === route && !p.url)
  if (concept) return <ConceptView prototype={concept} />
  return <Overview />
}

export function App() {
  const route = useHashRoute()
  const [menuOpen, setMenuOpen] = useState(false)
  const embed =
    prototypes.find((p) => p.id === route && p.url) ??
    (route === figma.id ? figma : undefined)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])

  return (
    <div className="flex min-h-svh bg-sidebar">
      <Sidebar
        route={route}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-black/20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-canvas md:my-2 md:mr-2 md:rounded-2xl md:shadow-[0_1px_3px_rgb(16_24_40/0.05)]",
          embed && "h-svh md:h-[calc(100svh-1rem)]"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-canvas/90 px-4 py-3 backdrop-blur md:hidden">
          <Button
            variant="secondary"
            size="icon-sm"
            className="rounded-full"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </Button>
          <p className="type-section">Within interview</p>
        </div>

        {embed ? (
          <main key={route} className="flex min-h-0 flex-1 flex-col p-3 md:p-4">
            <EmbedView resource={embed} />
          </main>
        ) : (
          <main
            key={route}
            className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-12"
          >
            <Page route={route} />
          </main>
        )}
      </div>
    </div>
  )
}

export default App

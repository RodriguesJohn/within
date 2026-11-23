import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="active:scale-[0.96]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="relative size-3.5">
        <SunIcon className="absolute inset-0 size-3.5 transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] dark:scale-[0.25] dark:opacity-0 dark:blur-[4px]" />
        <MoonIcon className="absolute inset-0 size-3.5 scale-[0.25] opacity-0 blur-[4px] transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] dark:scale-100 dark:opacity-100 dark:blur-none" />
      </span>
    </Button>
  )
}

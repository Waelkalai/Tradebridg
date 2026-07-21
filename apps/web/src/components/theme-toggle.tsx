"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, MonitorCog } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const MODES = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration-safe mount guard (next-themes' own recommended pattern)
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full bg-muted-bg" />;
  }

  const current = (theme ?? "system") as (typeof MODES)[number];
  const icon = current === "light" ? <Sun size={18} /> : current === "dark" ? <Moon size={18} /> : <MonitorCog size={18} />;

  const cycle = () => {
    const idx = MODES.indexOf(current);
    setTheme(MODES[(idx + 1) % MODES.length]);
  };

  return (
    <button
      onClick={cycle}
      title={t(current === "system" ? "system" : current)}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-smooth hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30"
      aria-label="Toggle theme"
    >
      {icon}
    </button>
  );
}

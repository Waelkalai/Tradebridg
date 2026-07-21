"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useState } from "react";

const LABELS: Record<string, string> = {
  ar: "العربية",
  fr: "Français",
  en: "English",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 h-9 text-sm font-medium text-foreground transition-smooth hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30"
      >
        <Globe size={16} />
        {LABELS[locale]}
      </button>
      {open && (
        <div
          className="absolute end-0 z-20 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-lg animate-fade-in-up"
          onMouseLeave={() => setOpen(false)}
        >
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => {
                setOpen(false);
                router.replace(pathname, { locale: l });
              }}
              className={`block w-full px-4 py-2 text-start text-sm transition-smooth hover:bg-brand-50 dark:hover:bg-brand-900/30 ${
                l === locale ? "font-semibold text-brand-600" : "text-foreground"
              }`}
            >
              {LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { Button } from "./ui/button";
import { useAuth } from "@/lib/auth-context";
import { Boxes } from "lucide-react";

export function Navbar() {
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-300">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Boxes size={18} />
          </span>
          {tBrand("name")}
        </Link>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  {t("dashboard")}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                {t("logout")}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  {t("registerSeller")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

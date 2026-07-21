"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Boxes } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/api-client";

const NAV_ITEMS: Record<UserRole, string[]> = {
  seller: ["Dashboard", "Products", "Orders", "Wholesale", "Wallet", "My Store", "Messages"],
  supplier: ["Dashboard", "Products", "Depots", "Wholesale", "Wallet", "Messages"],
  agent: ["Dashboard", "Account Approvals", "Product Reviews", "Messages", "Orders to Confirm", "Warehouse", "Tickets"],
  manager: ["Dashboard", "Agents", "Finance", "Warehouse", "Reports", "Audit Log"],
  admin: ["Dashboard", "Users", "Agencies", "Managers", "Products", "Orders", "Finance", "Settings"],
};

export function DashboardShell({ children }: { children: ReactNode }) {
  const t = useTranslations("nav");
  const { user, logout } = useAuth();

  if (!user) return null;

  const items = NAV_ITEMS[user.role];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-e border-border bg-card p-4 sm:flex">
        <div className="mb-8 flex items-center gap-2 px-2 font-bold text-brand-700 dark:text-brand-300">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Boxes size={18} />
          </span>
          TradeBridge
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item, i) => (
            <div
              key={item}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-smooth ${
                i === 0
                  ? "bg-brand-600 text-white"
                  : "text-foreground hover:bg-muted-bg cursor-default opacity-70"
              }`}
            >
              {item}
              {i !== 0 && (
                <Badge tone="neutral" className="ms-2 text-[10px]">
                  soon
                </Badge>
              )}
            </div>
          ))}
        </nav>
        <Button variant="ghost" size="sm" onClick={logout} className="mt-4">
          {t("logout")}
        </Button>
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="text-sm text-muted">
            {user.username} · <span className="capitalize">{user.role}</span>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

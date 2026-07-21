"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="animate-fade-in-up">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-brand-600 dark:text-brand-300">{value}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted">…</div>;
  }

  const roleTitle = t(`${user.role}.title` as never);

  return (
    <DashboardShell>
      <h1 className="text-2xl font-bold text-foreground">{roleTitle}</h1>
      <p className="mt-1 text-muted">{t("welcome", { name: user.full_name })}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {user.role === "seller" && (
          <>
            <StatCard label={t("ordersToday")} value={7} />
            <StatCard label={t("walletBalance")} value="128.500 DT" />
            <StatCard label={t("seller.retourBalance")} value="35.000 DT" />
            <StatCard label={t("openTickets")} value={1} />
          </>
        )}
        {user.role === "supplier" && (
          <>
            <StatCard label={t("pendingReview")} value={3} />
            <StatCard label={t("supplier.stockAlerts")} value={2} />
            <StatCard label={t("walletBalance")} value="940.200 DT" />
            <StatCard label={t("openTickets")} value={0} />
          </>
        )}
        {user.role === "agent" && (
          <>
            <StatCard label={t("agent.accountApprovals")} value={4} />
            <StatCard label={t("agent.productReviews")} value={9} />
            <StatCard label={t("agent.messagesPending")} value={12} />
            <StatCard label={t("openTickets")} value={5} />
          </>
        )}
        {user.role === "manager" && (
          <>
            <StatCard label={t("manager.activeAgents")} value={6} />
            <StatCard label={t("manager.withdrawalApprovals")} value={3} />
            <StatCard label={t("ordersToday")} value={41} />
            <StatCard label={t("openTickets")} value={2} />
          </>
        )}
        {user.role === "admin" && (
          <>
            <StatCard label={t("admin.totalUsers")} value="1,842" />
            <StatCard label={t("admin.totalAgencies")} value={18} />
            <StatCard label={t("admin.gmv")} value="512,400 DT" />
            <StatCard label={t("openTickets")} value={14} />
          </>
        )}
      </div>

      <Card className="mt-8">
        <p className="text-sm text-muted">{t("comingSoon")}</p>
      </Card>
    </DashboardShell>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hourglass } from "lucide-react";

export default function PendingPage() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const name = params.get("name") ?? "";
  const username = params.get("username") ?? "";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Card className="animate-fade-in-up">
          <Hourglass className="mx-auto mb-4 text-brand-600" size={36} />
          <h1 className="text-xl font-bold text-foreground">{t("pendingTitle")}</h1>
          <p className="mt-3 text-sm text-muted">{t("pendingBody", { name, username })}</p>
          <Link href="/login">
            <Button className="mt-6 w-full">{t("backToLogin")}</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

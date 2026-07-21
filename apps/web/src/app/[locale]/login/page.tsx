"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(usernameOrEmail, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
        <Card className="w-full animate-fade-in-up">
          <h1 className="text-2xl font-bold text-foreground">{t("loginTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("loginSubtitle")}</p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label={t("usernameOrEmail")}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="S4821 / seller@example.com"
              required
            />
            <Input
              label={t("password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {t("loginButton")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/register" className="font-medium text-brand-600 hover:underline">
              {t("chooseRoleTitle")}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

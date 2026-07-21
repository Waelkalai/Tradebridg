import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageSearch, Truck, ShieldCheck, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const t = useTranslations("landing");

  const steps = [
    t("howStep1"),
    t("howStep2"),
    t("howStep3"),
    t("howStep4"),
    t("howStep5"),
    t("howStep6"),
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-mesh relative overflow-hidden px-4 pt-20 pb-24 text-center">
        <div className="mx-auto max-w-3xl animate-fade-in-up">
          <Badge tone="brand" className="mb-6">
            {t("badge")}
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{t("subtitle")}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register/seller">
              <Button size="lg">
                {t("ctaSeller")}
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/register/supplier">
              <Button size="lg" variant="outline">
                {t("ctaSupplier")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { value: "1,200+", label: t("statsProducts") },
            { value: "18", label: t("statsAgencies") },
            { value: "35,000+", label: t("statsOrders") },
          ].map((stat) => (
            <Card key={stat.label} className="animate-fade-in-up">
              <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-300">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-10 text-center text-3xl font-bold text-foreground">
          {t("featuresTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="transition-smooth hover:-translate-y-1 hover:shadow-lg">
            <PackageSearch className="mb-4 text-brand-600" size={28} />
            <h3 className="mb-2 text-lg font-semibold">{t("feature1Title")}</h3>
            <p className="text-sm text-muted">{t("feature1Body")}</p>
          </Card>
          <Card className="transition-smooth hover:-translate-y-1 hover:shadow-lg">
            <Truck className="mb-4 text-brand-600" size={28} />
            <h3 className="mb-2 text-lg font-semibold">{t("feature2Title")}</h3>
            <p className="text-sm text-muted">{t("feature2Body")}</p>
          </Card>
          <Card className="transition-smooth hover:-translate-y-1 hover:shadow-lg">
            <ShieldCheck className="mb-4 text-brand-600" size={28} />
            <h3 className="mb-2 text-lg font-semibold">{t("feature3Title")}</h3>
            <p className="text-sm text-muted">{t("feature3Body")}</p>
          </Card>
        </div>
      </section>

      <section className="bg-muted-bg px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground">{t("howTitle")}</h2>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step}>
                <Card className="h-full">
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-foreground">{step}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} TradeBridge — Tunisia
      </footer>
    </div>
  );
}

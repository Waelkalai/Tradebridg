import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Store, Truck } from "lucide-react";

export default function ChooseRolePage() {
  const t = useTranslations("auth");

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground">{t("chooseRoleTitle")}</h1>
        <p className="mt-2 text-muted">{t("chooseRoleSubtitle")}</p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link href="/register/seller">
            <Card className="h-full cursor-pointer text-start transition-smooth hover:-translate-y-1 hover:border-brand-400 hover:shadow-lg">
              <Store className="mb-4 text-brand-600" size={32} />
              <h2 className="text-lg font-semibold text-foreground">{t("sellerCardTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("sellerCardBody")}</p>
            </Card>
          </Link>
          <Link href="/register/supplier">
            <Card className="h-full cursor-pointer text-start transition-smooth hover:-translate-y-1 hover:border-brand-400 hover:shadow-lg">
              <Truck className="mb-4 text-brand-600" size={32} />
              <h2 className="text-lg font-semibold text-foreground">{t("supplierCardTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("supplierCardBody")}</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

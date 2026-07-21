"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi, ApiError } from "@/lib/api-client";

const schema = z.object({
  full_name: z.string().min(2),
  cin_number: z.string().min(4),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  company_name: z.string().optional(),
  fiscal_number: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SellerRegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const res = await authApi.registerSeller(values);
      router.push(`/register/pending?name=${encodeURIComponent(res.user.full_name)}&username=${res.user.username}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-foreground">{t("sellerCardTitle")}</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
            <Input label={t("fullName")} {...register("full_name")} error={errors.full_name?.message} />
            <Input label={t("cinNumber")} {...register("cin_number")} error={errors.cin_number?.message} />
            <Input label={t("email")} type="email" {...register("email")} error={errors.email?.message} />
            <Input label={t("phone")} {...register("phone")} error={errors.phone?.message} />
            <Input label={t("password")} type="password" {...register("password")} error={errors.password?.message} />
            <Input label={t("companyName")} {...register("company_name")} />
            <Input label={t("fiscalNumber")} {...register("fiscal_number")} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {t("submitRegister")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

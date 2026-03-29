import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { AccountingDashboard } from "@saas/finance/components/accounting/AccountingDashboard";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("finance.pages.accountingDashboard") };
}

export default async function AccountingDashboardRoute({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageContent organizationSlug={organizationSlug} />
    </Suspense>
  );
}

async function PageContent({ organizationSlug }: { organizationSlug: string }) {
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) return notFound();
  return (
    <FinanceShell organizationSlug={organizationSlug}>
      <AccountingDashboard organizationId={activeOrganization.id} organizationSlug={organizationSlug} />
    </FinanceShell>
  );
}

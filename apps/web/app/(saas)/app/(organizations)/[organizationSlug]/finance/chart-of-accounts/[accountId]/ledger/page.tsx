import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { AccountLedgerPage } from "@saas/finance/components/accounting/AccountLedgerPage";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("finance.accounting.ledger.title") };
}

export default async function AccountLedgerRoute({
  params,
}: {
  params: Promise<{ organizationSlug: string; accountId: string }>;
}) {
  const { organizationSlug, accountId } = await params;
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageContent organizationSlug={organizationSlug} accountId={accountId} />
    </Suspense>
  );
}

async function PageContent({
  organizationSlug,
  accountId,
}: {
  organizationSlug: string;
  accountId: string;
}) {
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) return notFound();
  return (
    <FinanceShell organizationSlug={organizationSlug} sectionKey="chart-of-accounts">
      <AccountLedgerPage
        organizationId={activeOrganization.id}
        organizationSlug={organizationSlug}
        accountId={accountId}
      />
    </FinanceShell>
  );
}

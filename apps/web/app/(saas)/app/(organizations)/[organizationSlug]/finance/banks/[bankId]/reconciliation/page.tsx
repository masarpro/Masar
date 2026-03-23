import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { BankReconciliation } from "@saas/finance/components/banks/BankReconciliation";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";

export const metadata = { title: "التسوية البنكية" };

export default async function BankReconciliationRoute({
  params,
}: {
  params: Promise<{ organizationSlug: string; bankId: string }>;
}) {
  const { organizationSlug, bankId } = await params;
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageContent organizationSlug={organizationSlug} bankId={bankId} />
    </Suspense>
  );
}

async function PageContent({
  organizationSlug,
  bankId,
}: {
  organizationSlug: string;
  bankId: string;
}) {
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) return notFound();
  return (
    <FinanceShell organizationSlug={organizationSlug} sectionKey="banks">
      <BankReconciliation
        organizationId={activeOrganization.id}
        organizationSlug={organizationSlug}
        bankAccountId={bankId}
      />
    </FinanceShell>
  );
}

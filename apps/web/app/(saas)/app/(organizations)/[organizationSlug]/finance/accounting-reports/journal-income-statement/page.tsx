import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { JournalIncomeStatementReport } from "@saas/finance/components/accounting/JournalIncomeStatementReport";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const t = await getTranslations();
  return { title: t("finance.accounting.incomeStatement.title") };
}

export default async function JournalIncomeStatementRoute({ params }: { params: Promise<{ organizationSlug: string }> }) {
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
    <FinanceShell organizationSlug={organizationSlug} sectionKey="accounting-reports">
      <JournalIncomeStatementReport organizationId={activeOrganization.id} organizationSlug={organizationSlug} />
    </FinanceShell>
  );
}

import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { CostCenterReport } from "@saas/finance/components/accounting/CostCenterReport";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";

export const metadata = { title: "تقرير مراكز التكلفة" };

export default async function CostCenterRoute({
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
    <FinanceShell organizationSlug={organizationSlug} sectionKey="accounting-reports">
      <CostCenterReport organizationId={activeOrganization.id} organizationSlug={organizationSlug} />
    </FinanceShell>
  );
}

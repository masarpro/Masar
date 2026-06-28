import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { AccountingDashboard } from "@saas/finance/components/accounting/AccountingDashboard";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
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

  const organizationId = activeOrganization.id;

  // Server-prefetch the three dashboard queries so the data is hydrated at first
  // paint instead of triggering a client round-trip (and skeleton flash) after
  // hydration. Same queryOptions/keys the client uses → useQuery reads the cache.
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(
      orpc.accounting.dashboard.queryOptions({ input: { organizationId } }),
    ),
    queryClient.prefetchQuery(
      orpc.accounting.health.check.queryOptions({ input: { organizationId } }),
    ),
    queryClient.prefetchQuery(
      orpc.accounting.ownerDrawings.companySummary.queryOptions({
        input: { organizationId },
      }),
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FinanceShell organizationSlug={organizationSlug}>
        <AccountingDashboard organizationId={organizationId} organizationSlug={organizationSlug} />
      </FinanceShell>
    </HydrationBoundary>
  );
}

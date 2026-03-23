import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ClientStatementReport } from "@saas/finance/components/accounting/ClientStatementReport";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("finance.accounting.statement.clientStatement") };
}

export default async function ClientStatementRoute({
  params,
}: {
  params: Promise<{ organizationSlug: string; clientId: string }>;
}) {
  const { organizationSlug, clientId } = await params;
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageContent organizationSlug={organizationSlug} clientId={clientId} />
    </Suspense>
  );
}

async function PageContent({
  organizationSlug,
  clientId,
}: {
  organizationSlug: string;
  clientId: string;
}) {
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) return notFound();
  return (
    <FinanceShell organizationSlug={organizationSlug} sectionKey="clients">
      <ClientStatementReport
        organizationId={activeOrganization.id}
        organizationSlug={organizationSlug}
        clientId={clientId}
      />
    </FinanceShell>
  );
}

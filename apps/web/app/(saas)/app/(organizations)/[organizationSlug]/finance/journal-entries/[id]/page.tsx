import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { JournalEntryDetails } from "@saas/finance/components/accounting/JournalEntryDetails";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ organizationSlug: string; id: string }> }) {
  const t = await getTranslations();
  return { title: t("finance.accounting.journalEntries") };
}

export default async function JournalEntryDetailsRoute({ params }: { params: Promise<{ organizationSlug: string; id: string }> }) {
  const { organizationSlug, id } = await params;
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageContent organizationSlug={organizationSlug} id={id} />
    </Suspense>
  );
}

async function PageContent({ organizationSlug, id }: { organizationSlug: string; id: string }) {
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) return notFound();
  return (
    <FinanceShell organizationSlug={organizationSlug} sectionKey="journal-entries">
      <JournalEntryDetails organizationId={activeOrganization.id} organizationSlug={organizationSlug} entryId={id} />
    </FinanceShell>
  );
}

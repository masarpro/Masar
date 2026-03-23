import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentVoucher } from "@saas/finance/components/payments/PaymentVoucher";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";

export const metadata = { title: "سند صرف" };

export default async function ExpenseVoucherRoute({
  params,
}: {
  params: Promise<{ organizationSlug: string; expenseId: string }>;
}) {
  const { organizationSlug, expenseId } = await params;
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageContent organizationSlug={organizationSlug} expenseId={expenseId} />
    </Suspense>
  );
}

async function PageContent({
  organizationSlug,
  expenseId,
}: {
  organizationSlug: string;
  expenseId: string;
}) {
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) return notFound();
  return (
    <FinanceShell organizationSlug={organizationSlug} sectionKey="expenses">
      <PaymentVoucher
        organizationId={activeOrganization.id}
        organizationSlug={organizationSlug}
        expenseId={expenseId}
      />
    </FinanceShell>
  );
}

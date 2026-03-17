import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseDetail } from "@saas/company/components/expenses/ExpenseDetail";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.expenses.details") };
}

export default async function ExpenseDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; expenseId: string }>;
}) {
	const { organizationSlug, expenseId } = await params;
	return (
		<Suspense fallback={<DetailPageSkeleton />}>
			<ExpenseDetailPageContent
				organizationSlug={organizationSlug}
				expenseId={expenseId}
			/>
		</Suspense>
	);
}

async function ExpenseDetailPageContent({
	organizationSlug,
	expenseId,
}: { organizationSlug: string; expenseId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<ExpenseDetail
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			expenseId={expenseId}
		/>
	);
}

import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";
import { FinanceView } from "@saas/projects/components/finance/FinanceView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.title"),
	};
}

export default async function FinancePage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton rows={8} cols={5} />}>
			<FinancePageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function FinancePageContent({
	organizationSlug,
	projectId,
}: {
	organizationSlug: string;
	projectId: string;
}) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<PageContextProvider
			moduleId="finance"
			pageName="Project Finance"
			pageNameAr="مالية المشروع"
			pageDescription="عرض المصروفات والمطالبات والدفعات للمشروع"
			visibleStats={{}}
		>
			<div>
				<FinanceView
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					projectId={projectId}
				/>
			</div>
		</PageContextProvider>
	);
}

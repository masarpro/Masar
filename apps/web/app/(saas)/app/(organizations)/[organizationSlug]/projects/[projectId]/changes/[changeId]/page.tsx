import { ChangeOrderDetail } from "@saas/projects-changes/components/ChangeOrderDetail";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("changeOrders.detail.title"),
	};
}

interface ChangeOrderDetailPageProps {
	params: Promise<{
		organizationSlug: string;
		projectId: string;
		changeId: string;
	}>;
}

export default async function ChangeOrderDetailPage({ params }: ChangeOrderDetailPageProps) {
	const { projectId, changeId } = await params;
	const t = await getTranslations();

	return (
		<>
			<PageHeader
				title={t("changeOrders.detail.title")}
				subtitle={t("changeOrders.detail.subtitle")}
			/>
			<ChangeOrderDetail projectId={projectId} changeOrderId={changeId} />
		</>
	);
}

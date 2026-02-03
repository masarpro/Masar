import { ChangeOrdersBoard } from "@saas/projects-changes/components/ChangeOrdersBoard";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("changeOrders.title"),
	};
}

interface ChangeOrdersPageProps {
	params: Promise<{
		organizationSlug: string;
		projectId: string;
	}>;
}

export default async function ChangeOrdersPage({ params }: ChangeOrdersPageProps) {
	const { projectId } = await params;

	return <ChangeOrdersBoard projectId={projectId} />;
}

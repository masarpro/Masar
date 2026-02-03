import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuantitiesList } from "@saas/quantities/components/QuantitiesList";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("quantities.title"),
	};
}

export default async function QuantitiesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<PageHeader
				title={t("quantities.title")}
				subtitle={t("quantities.subtitle")}
			/>
			<QuantitiesList organizationId={activeOrganization.id} />
		</div>
	);
}

import { getActiveOrganization } from "@saas/auth/lib/server";
import { NotificationsList } from "@saas/projects/components/NotificationsList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("notifications.title"),
	};
}

export default async function NotificationsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<NotificationsList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}

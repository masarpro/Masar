import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { NotificationPreferencesForm } from "@saas/settings/components/NotificationPreferencesForm";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("settings.notifications.title"),
	};
}

export default async function NotificationSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) return null;

	return (
		<NotificationPreferencesForm
			organizationId={organization.id}
		/>
	);
}

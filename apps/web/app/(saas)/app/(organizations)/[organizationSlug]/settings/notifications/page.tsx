import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { NotificationPreferencesPanel } from "@saas/settings/components/notification-preferences/NotificationPreferencesPanel";
import { DigestSubscriptionsSection } from "@saas/settings/components/DigestSubscriptionsSection";

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

	return (
		<Suspense fallback={null}>
			<NotificationSettingsPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function NotificationSettingsPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) return null;

	return (
		<div className="space-y-8">
			<NotificationPreferencesPanel
				organizationId={organization.id}
			/>
			<DigestSubscriptionsSection
				organizationId={organization.id}
			/>
		</div>
	);
}

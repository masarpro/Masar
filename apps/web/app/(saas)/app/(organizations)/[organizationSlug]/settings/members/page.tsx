import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { TeamManagementTabs } from "@saas/organizations/components/TeamManagementTabs";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("organizations.settings.title"),
	};
}

export default async function OrganizationSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	// No inner Suspense: the route loading.tsx skeleton covers the await.
	return <OrganizationSettingsContent organizationSlug={organizationSlug} />;
}

async function OrganizationSettingsContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const [session, organization] = await Promise.all([
		getSession(),
		getActiveOrganization(organizationSlug),
	]);

	if (!organization) {
		return notFound();
	}

	const userIsAdmin = isOrganizationAdmin(organization, session?.user);

	return (
		<SettingsList>
			<TeamManagementTabs
				organizationId={organization.id}
				isAdmin={userIsAdmin}
			/>
		</SettingsList>
	);
}

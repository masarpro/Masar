import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { InviteMemberForm } from "@saas/organizations/components/InviteMemberForm";
import { TeamManagementTabs } from "@saas/organizations/components/TeamManagementTabs";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

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

	return (
		<Suspense fallback={null}>
			<OrganizationSettingsContent organizationSlug={organizationSlug} />
		</Suspense>
	);
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
			{userIsAdmin && (
				<InviteMemberForm organizationId={organization.id} />
			)}
			<TeamManagementTabs
				organizationId={organization.id}
				isAdmin={userIsAdmin}
			/>
		</SettingsList>
	);
}

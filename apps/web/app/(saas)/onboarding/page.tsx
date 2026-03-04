import { config } from "@repo/config";
import {
	getSession,
	getOrganizationList,
} from "@saas/auth/lib/server";
import { OnboardingWizard } from "@saas/onboarding/components/OnboardingWizard";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("onboarding.title"),
	};
}

export default async function OnboardingPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	if (!config.users.enableOnboarding || session.user.onboardingComplete) {
		redirect("/app");
	}

	// Get user's organization (auto-created on signup)
	const organizations = await getOrganizationList();
	const organization = organizations[0];

	if (!organization) {
		redirect("/app");
	}

	return (
		<OnboardingWizard
			organizationId={organization.id}
			organizationSlug={organization.slug ?? ""}
			organizationName={organization.name}
		/>
	);
}

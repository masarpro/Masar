import { Suspense } from "react";
import { config } from "@repo/config";
import {
	getSession,
	getOrganizationList,
} from "@saas/auth/lib/server";
import { autoCreateOrganizationIfNeeded } from "@saas/organizations/lib/auto-create-organization";
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
	return (
		<Suspense fallback={null}>
			<OnboardingPageContent />
		</Suspense>
	);
}

async function OnboardingPageContent() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	if (!config.users.enableOnboarding || session.user.onboardingComplete) {
		redirect("/app");
	}

	// Get user's organization, or auto-create one if needed
	let organizations = await getOrganizationList();

	if (organizations.length === 0 && config.organizations.autoCreateOnSignup) {
		const newOrg = await autoCreateOrganizationIfNeeded(session);
		if (newOrg) {
			organizations = await getOrganizationList();
		}
	}

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

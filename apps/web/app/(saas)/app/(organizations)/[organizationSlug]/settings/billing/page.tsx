import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ActivePlan } from "@saas/payments/components/ActivePlan";
import { ChangePlan } from "@saas/payments/components/ChangePlan";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { cachedListPurchases } from "@shared/lib/cached-queries";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { attemptAsync } from "es-toolkit";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("settings.billing.title"),
	};
}

export default async function BillingSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	// No inner Suspense: the route loading.tsx skeleton covers the await.
	return <BillingSettingsPageContent organizationSlug={organizationSlug} />;
}

async function BillingSettingsPageContent({ organizationSlug }: { organizationSlug: string }) {
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		return notFound();
	}

	const [error, purchasesData] = await attemptAsync(() =>
		cachedListPurchases(organization.id),
	);

	if (error) {
		throw new Error("Failed to fetch purchases");
	}

	const purchases = purchasesData?.purchases ?? [];
	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: orpc.payments.listPurchases.queryKey({
			input: {
				organizationId: organization.id,
			},
		}),
		queryFn: () => purchasesData,
	});

	const { activePlan } = createPurchasesHelper(purchases);

	return (
		<SettingsList>
			{activePlan && <ActivePlan organizationId={organization.id} />}
			<ChangePlan
				organizationId={organization.id}
				activePlanId={activePlan?.id}
			/>
		</SettingsList>
	);
}

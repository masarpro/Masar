import { config } from "@repo/config";
import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { ChoosePlanContent } from "@saas/payments/components/ChoosePlanContent";
import { getPurchases } from "@saas/payments/lib/server";
import { attemptAsync } from "es-toolkit";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("choosePlan.title"),
	};
}

export default async function ChoosePlanPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	let organizationId: string | undefined;
	if (config.organizations.enable && config.organizations.enableBilling) {
		const organization = (await getOrganizationList()).at(0);

		if (!organization) {
			redirect("/new-organization");
		}

		organizationId = organization.id;
	}

	const [error, purchases] = await attemptAsync(() =>
		getPurchases(organizationId),
	);

	if (!error && purchases) {
		const { activePlan } = createPurchasesHelper(purchases);

		if (activePlan) {
			redirect("/app");
		}
	}

	return <ChoosePlanContent />;
}

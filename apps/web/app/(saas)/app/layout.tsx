import { config } from "@repo/config";
import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { autoCreateOrganizationIfNeeded } from "@saas/organizations/lib/auto-create-organization";
import { cachedListPurchases } from "@shared/lib/cached-queries";
import { attemptAsync } from "es-toolkit";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function Layout({ children }: PropsWithChildren) {
	const layoutStart = performance.now();
	const [session, organizationsList] = await Promise.all([
		getSession(),
		getOrganizationList(),
	]);

	if (!session) {
		redirect("/auth/login");
	}

	// Eagerly fire purchases fetch — organizationId is available now, overlaps with sync checks
	const hasFreePlan = Object.values(config.payments.plans).some(
		(plan) => "isFree" in plan,
	);
	const needsPurchaseCheck =
		((config.organizations.enable && config.organizations.enableBilling) ||
			config.users.enableBilling) &&
		!hasFreePlan;

	let purchasesPromise: ReturnType<typeof cachedListPurchases> | null = null;
	if (needsPurchaseCheck) {
		const organizationId = config.organizations.enable
			? (session.session.activeOrganizationId ??
					organizationsList?.at(0)?.id ??
					undefined)
			: undefined;
		purchasesPromise = cachedListPurchases(organizationId);
		purchasesPromise.catch(() => {}); // prevent unhandled rejection if we redirect before awaiting
	}

	// إذا يجب تغيير كلمة المرور، وجّه لصفحة التغيير
	if ((session.user as any).mustChangePassword) {
		redirect("/auth/change-password");
	}

	// حظر المستخدمين المعطّلين — دفاع إضافي بجانب protectedProcedure
	if ((session.user as any).isActive === false) {
		redirect("/auth/account-disabled");
	}

	let organizations = organizationsList;

	// Auto-create organization if enabled and user has no organizations
	if (
		config.organizations.enable &&
		config.organizations.autoCreateOnSignup &&
		organizations.length === 0
	) {
		const newOrg = await autoCreateOrganizationIfNeeded(session);
		if (newOrg) {
			redirect(`/app/${newOrg.slug}`);
		}
	}

	if (
		config.organizations.enable &&
		config.organizations.requireOrganization
	) {
		const organization =
			organizations.find(
				(org) => org.id === session?.session.activeOrganizationId,
			) || organizations[0];

		if (!organization) {
			redirect("/new-organization");
		}
	}

	// Await the eagerly-fired purchases check
	if (needsPurchaseCheck && purchasesPromise) {
		const [error, data] = await attemptAsync(() => purchasesPromise!);

		if (error) {
			throw new Error("Failed to fetch purchases");
		}

		const purchases = data?.purchases ?? [];

		const { activePlan } = createPurchasesHelper(purchases);

		if (!activePlan) {
			redirect("/choose-plan");
		}
	}

	console.log(`[PERF] (saas)/app/layout.tsx: ${Math.round(performance.now() - layoutStart)}ms`);

	return children;
}

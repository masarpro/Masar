import { config } from "@repo/config";
import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { ActivationCodeForm } from "@saas/payments/components/ActivationCodeForm";
import { PricingTable } from "@saas/payments/components/PricingTable";
import { getPurchases } from "@saas/payments/lib/server";
import { AuthWrapper } from "@saas/shared/components/AuthWrapper";
import { attemptAsync } from "es-toolkit";
import {
	CheckIcon,
	CrownIcon,
	MessageCircleIcon,
	UserIcon,
} from "lucide-react";
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
	const t = await getTranslations();
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

	if (error || !purchases) {
		throw new Error("Failed to fetch purchases");
	}

	const { activePlan } = createPurchasesHelper(purchases);

	if (activePlan) {
		redirect("/app");
	}

	const freeFeatures = [
		t("choosePlan.free.features.users"),
		t("choosePlan.free.features.viewOnly"),
		t("choosePlan.free.features.noProjects"),
	];

	const proFeatures = [
		t("choosePlan.pro.features.users"),
		t("choosePlan.pro.features.projects"),
		t("choosePlan.pro.features.storage"),
		t("choosePlan.pro.features.reports"),
		t("choosePlan.pro.features.support"),
	];

	return (
		<AuthWrapper contentClass="max-w-4xl">
			<div className="mb-6 text-center">
				<h1 className="font-bold text-2xl lg:text-3xl">
					{t("choosePlan.title")}
				</h1>
				<p className="text-muted-foreground text-sm lg:text-base mt-1">
					{t("choosePlan.description")}
				</p>
			</div>

			{/* Plan Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-8">
				{/* FREE Plan */}
				<div className="rounded-xl border p-6 space-y-4">
					<div>
						<h3 className="font-bold text-xl">
							{t("choosePlan.free.name")}
						</h3>
						<p className="text-2xl font-bold mt-1">
							{t("choosePlan.free.price")}
						</p>
					</div>

					<ul className="space-y-2">
						{freeFeatures.map((feature) => (
							<li
								key={feature}
								className="flex items-center gap-2 text-sm text-muted-foreground"
							>
								<CheckIcon className="size-4 shrink-0" />
								{feature}
							</li>
						))}
					</ul>

					<button
						type="button"
						disabled
						className="w-full rounded-lg border px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
					>
						{t("choosePlan.free.currentPlan")}
					</button>
				</div>

				{/* PRO Plan */}
				<div className="rounded-xl border-2 border-primary p-6 space-y-4 relative">
					<div className="absolute -top-3 start-4">
						<span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
							<CrownIcon className="size-3" />
							{t("choosePlan.pro.popular")}
						</span>
					</div>

					<div>
						<h3 className="font-bold text-xl">
							{t("choosePlan.pro.name")}
						</h3>
						<p className="text-2xl font-bold mt-1">
							{t("choosePlan.pro.price")}
						</p>
					</div>

					<ul className="space-y-2">
						{proFeatures.map((feature) => (
							<li
								key={feature}
								className="flex items-center gap-2 text-sm"
							>
								<CheckIcon className="size-4 shrink-0 text-primary" />
								{feature}
							</li>
						))}
					</ul>

					<a
						href="https://wa.me/966500000000"
						target="_blank"
						rel="noopener noreferrer"
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						<MessageCircleIcon className="size-4" />
						{t("choosePlan.pro.contactUs")}
					</a>
				</div>
			</div>

			{/* Divider */}
			<div className="relative mb-8">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="bg-card px-4 text-muted-foreground">
						{t("choosePlan.or")}
					</span>
				</div>
			</div>

			{/* Activation Code Section */}
			<ActivationCodeForm />
		</AuthWrapper>
	);
}

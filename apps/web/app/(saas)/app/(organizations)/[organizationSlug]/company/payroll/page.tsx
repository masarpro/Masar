import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PayrollRunList } from "@saas/company/components/payroll/PayrollRunList";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.payroll.title") };
}

export default async function PayrollPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<PayrollRunList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}

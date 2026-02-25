import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PayrollRunDetail } from "@saas/company/components/payroll/PayrollRunDetail";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.payroll.runDetail") };
}

export default async function PayrollRunPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; id: string }>;
}) {
	const { organizationSlug, id } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<PayrollRunDetail
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			runId={id}
		/>
	);
}

"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { EditLeadForm } from "./EditLeadForm";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

interface EditLeadPageProps {
	leadId: string;
	organizationId: string;
	organizationSlug: string;
}

export function EditLeadPage({ leadId, organizationId, organizationSlug }: EditLeadPageProps) {
	const t = useTranslations();

	const { data: lead, isLoading: leadLoading } = useQuery(
		orpc.pricing.leads.getById.queryOptions({
			input: { organizationId, leadId },
		}),
	);

	const { data: membersData, isLoading: membersLoading } = useQuery(
		orpc.orgUsers.list.queryOptions({
			input: { organizationId },
		}),
	);

	const members = (membersData as any)?.users ?? [];
	const isLoading = leadLoading || membersLoading;

	if (isLoading) {
		return <FormPageSkeleton />;
	}

	if (!lead) {
		return (
			<div className="py-20 text-center">
				<p className="text-muted-foreground">{t("pricing.leads.detail.notFound")}</p>
			</div>
		);
	}

	return (
		<EditLeadForm
			organizationId={organizationId}
			organizationSlug={organizationSlug}
			members={members.map((m: any) => ({
				id: m.id,
				name: m.name,
				image: m.image,
			}))}
			lead={lead as any}
		/>
	);
}

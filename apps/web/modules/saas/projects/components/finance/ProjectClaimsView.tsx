"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { ClaimsTable } from "./ClaimsTable";

interface ProjectClaimsViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function ProjectClaimsView({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectClaimsViewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/claims`;

	const {
		data: claimsData,
		isLoading,
		refetch,
	} = useQuery(
		orpc.projectFinance.listClaims.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (isLoading) {
		return <ListTableSkeleton />;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-end">
				<Button asChild className="rounded-xl">
					<Link href={`${basePath}/new`}>
						<Plus className="me-2 h-4 w-4" />
						{t("finance.claims.new")}
					</Link>
				</Button>
			</div>
			<ClaimsTable
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				projectId={projectId}
				claims={claimsData?.claims ?? []}
				onRefresh={() => refetch()}
			/>
		</div>
	);
}

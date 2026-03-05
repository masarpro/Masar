"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { CreateLeadForm } from "./CreateLeadForm";

interface CreateLeadPageProps {
	organizationId: string;
	organizationSlug: string;
}

export function CreateLeadPage({ organizationId, organizationSlug }: CreateLeadPageProps) {
	const { data: membersData } = useQuery(
		orpc.orgUsers.list.queryOptions({
			input: { organizationId },
		}),
	);

	const members = membersData?.users ?? [];

	return (
		<CreateLeadForm
			organizationId={organizationId}
			organizationSlug={organizationSlug}
			members={members.map((m: any) => ({
				id: m.id,
				name: m.name,
				image: m.image,
			}))}
		/>
	);
}

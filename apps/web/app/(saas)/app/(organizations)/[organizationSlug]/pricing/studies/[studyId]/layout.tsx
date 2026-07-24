import type { PropsWithChildren } from "react";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { orpcServer } from "@shared/lib/orpc-server";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function StudyLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string; studyId: string }>;
}>) {
	const { organizationSlug, studyId } = await params;

	// Every stage page under this layout renders StudyPageShell, which blocks
	// its whole subtree on pricing.studies.getById. Prefetch it once here
	// (in-process, deduped by React cache) so all stage pages paint the study
	// header immediately instead of showing a skeleton while the client
	// round-trips. getActiveOrganization is React-cache()d — no extra DB read.
	const activeOrganization = await getActiveOrganization(organizationSlug);

	const queryClient = getServerQueryClient();
	if (activeOrganization) {
		await queryClient.prefetchQuery(
			orpcServer.pricing.studies.getById.queryOptions({
				input: { id: studyId, organizationId: activeOrganization.id },
			}),
		);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<PageContextProvider
				moduleId="quantities"
				pageName="Cost Study"
				pageNameAr="دراسة كميات وتكلفة"
				pageDescription="صفحات دراسة الكميات والتسعير: الكميات الإنشائية، التشطيبات، MEP، المواصفات، تسعير التكلفة، السعر النهائي، عرض السعر"
				visibleData={{ studyId }}
			>
				{children}
			</PageContextProvider>
		</HydrationBoundary>
	);
}

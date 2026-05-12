import type { PropsWithChildren } from "react";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";

export default async function StudyLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string; studyId: string }>;
}>) {
	const { studyId } = await params;

	return (
		<PageContextProvider
			moduleId="quantities"
			pageName="Cost Study"
			pageNameAr="دراسة كميات وتكلفة"
			pageDescription="صفحات دراسة الكميات والتسعير: الكميات الإنشائية، التشطيبات، MEP، المواصفات، تسعير التكلفة، السعر النهائي، عرض السعر"
			visibleData={{ studyId }}
		>
			{children}
		</PageContextProvider>
	);
}

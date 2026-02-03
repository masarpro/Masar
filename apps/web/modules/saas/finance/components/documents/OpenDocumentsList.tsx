"use client";

import { useTranslations } from "next-intl";

interface OpenDocumentsListProps {
	organizationId: string;
	organizationSlug: string;
}

export function OpenDocumentsList({
	organizationId,
	organizationSlug,
}: OpenDocumentsListProps) {
	const t = useTranslations();

	return (
		<div className="text-center py-10 text-slate-500">
			{t("finance.documents.comingSoon")}
		</div>
	);
}

"use client";

import { useTranslations } from "next-intl";

interface DocumentEditorProps {
	organizationId: string;
	organizationSlug: string;
	documentId: string;
}

export function DocumentEditor({
	organizationId,
	organizationSlug,
	documentId,
}: DocumentEditorProps) {
	const t = useTranslations();

	return (
		<div className="text-center py-10 text-muted-foreground">
			{t("finance.documents.editComingSoon")}
		</div>
	);
}

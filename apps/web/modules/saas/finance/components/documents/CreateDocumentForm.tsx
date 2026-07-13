"use client";

import { useTranslations } from "next-intl";

interface CreateDocumentFormProps {
	organizationId: string;
	organizationSlug: string;
}

export function CreateDocumentForm({
	organizationId,
	organizationSlug,
}: CreateDocumentFormProps) {
	const t = useTranslations();

	return (
		<div className="text-center py-10 text-muted-foreground">
			{t("finance.documents.createComingSoon")}
		</div>
	);
}

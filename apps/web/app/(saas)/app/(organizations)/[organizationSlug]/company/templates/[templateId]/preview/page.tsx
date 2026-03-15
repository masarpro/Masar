import { redirect } from "next/navigation";

export default async function TemplatePreviewPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; templateId: string }>;
}) {
	const { organizationSlug, templateId } = await params;
	redirect(`/app/${organizationSlug}/settings/templates/${templateId}/preview`);
}

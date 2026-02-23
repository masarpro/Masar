import { redirect } from "next/navigation";

export default async function ChatPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	redirect(`/app/${organizationSlug}/projects/${projectId}`);
}

import { TimelineBoard } from "@saas/projects-timeline/components/TimelineBoard";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("timeline.title"),
	};
}

interface TimelinePageProps {
	params: Promise<{
		organizationSlug: string;
		projectId: string;
	}>;
}

export default async function TimelinePage({ params }: TimelinePageProps) {
	const { projectId } = await params;

	return <TimelineBoard projectId={projectId} />;
}

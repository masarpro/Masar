"use client";

import { Card, CardContent } from "@ui/components/card";
import { useTranslations } from "next-intl";
import { ActivityFeedItem } from "./ActivityFeedItem";
import { CommentBox } from "./CommentBox";

interface Activity {
	id: string;
	type: string;
	content?: string | null;
	metadata?: any;
	createdAt: string | Date;
	createdBy: { id: string; name: string; image?: string | null };
}

interface LeadActivityTabProps {
	leadId: string;
	organizationId: string;
	activities: Activity[];
}

export function LeadActivityTab({ leadId, organizationId, activities }: LeadActivityTabProps) {
	const t = useTranslations();

	return (
		<div className="space-y-4">
			{/* Comment Box */}
			<Card className="rounded-2xl">
				<CardContent className="p-5">
					<h3 className="mb-3 text-sm font-semibold text-foreground">
						{t("pricing.leads.detail.addComment")}
					</h3>
					<CommentBox leadId={leadId} organizationId={organizationId} />
				</CardContent>
			</Card>

			{/* Activity Feed */}
			<Card className="rounded-2xl">
				<CardContent className="p-5">
					<h3 className="mb-4 text-sm font-semibold text-foreground">
						{t("pricing.leads.detail.activityLog")}
					</h3>
					{activities.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							{t("pricing.leads.detail.noActivity")}
						</p>
					) : (
						<div className="space-y-4">
							{activities.map((activity) => (
								<ActivityFeedItem key={activity.id} activity={activity} />
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

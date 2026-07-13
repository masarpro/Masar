"use client";

import { Clock, MessageSquare } from "lucide-react";
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
			<div className="rounded-2xl border-2 bg-card">
				<div className="flex items-center gap-2 border-b-2 px-5 py-3.5">
					<div className="h-[30px] w-[30px] rounded-lg bg-chart-4/15 dark:bg-chart-4/20 flex items-center justify-center">
						<MessageSquare className="h-4 w-4 text-chart-4 dark:text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-foreground">
						{t("pricing.leads.detail.addComment")}
					</h3>
				</div>
				<div className="p-5">
					<CommentBox leadId={leadId} organizationId={organizationId} />
				</div>
			</div>

			{/* Activity Feed */}
			<div className="rounded-2xl border-2 bg-card">
				<div className="flex items-center gap-2 border-b-2 px-5 py-3.5">
					<div className="h-[30px] w-[30px] rounded-lg bg-chart-1/15 flex items-center justify-center">
						<Clock className="h-4 w-4 text-chart-1" />
					</div>
					<h3 className="text-sm font-semibold text-foreground">
						{t("pricing.leads.detail.activityLog")}
					</h3>
				</div>
				<div className="p-5">
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
				</div>
			</div>
		</div>
	);
}

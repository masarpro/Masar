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
			<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
					<div className="h-[30px] w-[30px] rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
						<MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
			<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
					<div className="h-[30px] w-[30px] rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
						<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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

"use client";

import { cn } from "@ui/lib";
import {
	FileUp,
	Link2,
	MessageSquare,
	RefreshCw,
	Unlink,
	UserCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDate } from "@saas/finance/lib/utils";
import { LeadStatusBadge } from "./LeadStatusBadge";

interface Activity {
	id: string;
	type: string;
	content?: string | null;
	metadata?: any;
	createdAt: string | Date;
	createdBy: { id: string; name: string; image?: string | null };
}

interface ActivityFeedItemProps {
	activity: Activity;
}

const TYPE_CONFIG: Record<string, { icon: typeof MessageSquare; color: string }> = {
	COMMENT: { icon: MessageSquare, color: "text-blue-500 bg-blue-100 dark:bg-blue-950/40" },
	STATUS_CHANGE: { icon: RefreshCw, color: "text-orange-500 bg-orange-100 dark:bg-orange-950/40" },
	FILE_UPLOADED: { icon: FileUp, color: "text-purple-500 bg-purple-100 dark:bg-purple-950/40" },
	COST_STUDY_LINKED: { icon: Link2, color: "text-green-500 bg-green-100 dark:bg-green-950/40" },
	COST_STUDY_UNLINKED: { icon: Unlink, color: "text-red-500 bg-red-100 dark:bg-red-950/40" },
	QUOTATION_LINKED: { icon: Link2, color: "text-green-500 bg-green-100 dark:bg-green-950/40" },
	QUOTATION_UNLINKED: { icon: Unlink, color: "text-red-500 bg-red-100 dark:bg-red-950/40" },
	CREATED: { icon: UserCircle, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40" },
};

export function ActivityFeedItem({ activity }: ActivityFeedItemProps) {
	const t = useTranslations();
	const config = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.COMMENT;
	const Icon = config.icon;

	const renderContent = () => {
		switch (activity.type) {
			case "COMMENT":
				return (
					<p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
						{activity.content}
					</p>
				);

			case "STATUS_CHANGE": {
				const meta = activity.metadata as { oldStatus?: string; newStatus?: string; lostReason?: string } | null;
				return (
					<div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
						<span className="text-muted-foreground">{t("pricing.leads.detail.activity.from")}</span>
						{meta?.oldStatus && <LeadStatusBadge status={meta.oldStatus} size="sm" />}
						<span className="text-muted-foreground">{t("pricing.leads.detail.activity.to")}</span>
						{meta?.newStatus && <LeadStatusBadge status={meta.newStatus} size="sm" />}
						{meta?.lostReason && (
							<p className="mt-1 w-full text-xs text-muted-foreground">
								{t("pricing.leads.detail.lostReason")}: {meta.lostReason}
							</p>
						)}
					</div>
				);
			}

			case "FILE_UPLOADED": {
				const meta = activity.metadata as { fileName?: string; category?: string } | null;
				return (
					<p className="mt-1 text-sm text-muted-foreground">
						{t("pricing.leads.detail.activity.fileUploaded")}: {meta?.fileName}
					</p>
				);
			}

			case "COST_STUDY_LINKED":
			case "COST_STUDY_UNLINKED":
				return (
					<p className="mt-1 text-sm text-muted-foreground">
						{t(`pricing.leads.detail.activity.${activity.type === "COST_STUDY_LINKED" ? "costStudyLinked" : "costStudyUnlinked"}`)}
					</p>
				);

			case "QUOTATION_LINKED":
			case "QUOTATION_UNLINKED":
				return (
					<p className="mt-1 text-sm text-muted-foreground">
						{t(`pricing.leads.detail.activity.${activity.type === "QUOTATION_LINKED" ? "quotationLinked" : "quotationUnlinked"}`)}
					</p>
				);

			case "CREATED":
				return (
					<p className="mt-1 text-sm text-muted-foreground">
						{t("pricing.leads.detail.activity.created")}
					</p>
				);

			default:
				return activity.content ? (
					<p className="mt-1 text-sm text-muted-foreground">{activity.content}</p>
				) : null;
		}
	};

	return (
		<div className="flex gap-3">
			<div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", config.color)}>
				<Icon className="h-4 w-4" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-foreground">
						{activity.createdBy.name}
					</span>
					<span className="text-xs text-muted-foreground">
						{formatDate(activity.createdAt)}
					</span>
				</div>
				{renderContent()}
			</div>
		</div>
	);
}

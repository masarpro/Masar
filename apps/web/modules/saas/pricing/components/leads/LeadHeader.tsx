"use client";

import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Edit,
	FolderKanban,
	MoreHorizontal,
	RefreshCw,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LeadPriorityIndicator } from "./LeadPriorityIndicator";
import { LeadStatusBadge } from "./LeadStatusBadge";

interface LeadHeaderProps {
	lead: {
		id: string;
		name: string;
		company?: string | null;
		status: string;
		priority: string;
		convertedProjectId?: string | null;
	};
	organizationSlug: string;
	onChangeStatus: () => void;
	onDelete: () => void;
	onConvert: () => void;
}

export function LeadHeader({ lead, organizationSlug, onChangeStatus, onDelete, onConvert }: LeadHeaderProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing/leads`;

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-xl font-bold text-foreground">{lead.name}</h1>
					<LeadStatusBadge status={lead.status} />
					<LeadPriorityIndicator priority={lead.priority} />
				</div>
				{lead.company && (
					<p className="text-sm text-muted-foreground">{lead.company}</p>
				)}
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					className="rounded-xl"
					onClick={onChangeStatus}
				>
					<RefreshCw className="me-2 h-4 w-4" />
					{t("pricing.leads.detail.changeStatus")}
				</Button>

				{!lead.convertedProjectId && lead.status !== "LOST" && lead.status !== "WON" && (
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
						onClick={onConvert}
					>
						<FolderKanban className="me-2 h-4 w-4" />
						{t("pricing.leads.detail.convertToProject")}
					</Button>
				)}

				<Button asChild size="sm" className="rounded-xl">
					<Link href={`${basePath}/${lead.id}/edit`}>
						<Edit className="me-2 h-4 w-4" />
						{t("pricing.leads.actions.edit")}
					</Link>
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="rounded-xl">
						<DropdownMenuItem
							className="text-destructive"
							onClick={onDelete}
						>
							<Trash2 className="me-2 h-4 w-4" />
							{t("pricing.leads.actions.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

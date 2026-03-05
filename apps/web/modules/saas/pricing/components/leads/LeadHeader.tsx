"use client";

import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { cn } from "@ui/lib";
import {
	Banknote,
	ChevronLeft,
	FolderKanban,
	MapPin,
	MoreHorizontal,
	Pencil,
	Phone,
	RefreshCw,
	Trash2,
	UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LeadPriorityIndicator } from "./LeadPriorityIndicator";
import { LeadStatusBadge } from "./LeadStatusBadge";

interface LeadHeaderProps {
	lead: {
		id: string;
		name: string;
		phone?: string | null;
		email?: string | null;
		company?: string | null;
		status: string;
		priority: string;
		estimatedValue?: number | null;
		projectLocation?: string | null;
		convertedProjectId?: string | null;
		assignedTo?: { id: string; name: string } | null;
	};
	organizationSlug: string;
	onChangeStatus: () => void;
	onDelete: () => void;
	onConvert: () => void;
}

function getStatusProgress(status: string): string {
	const map: Record<string, string> = {
		NEW: "16%",
		STUDYING: "33%",
		QUOTED: "50%",
		NEGOTIATING: "75%",
		WON: "100%",
	};
	return map[status] ?? "0%";
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-SA", {
		style: "decimal",
		maximumFractionDigits: 0,
	}).format(amount);
}

const STATUS_LABELS = ["جديد", "دراسة", "عرض", "تفاوض", "عقد"];

export function LeadHeader({ lead, organizationSlug, onChangeStatus, onDelete, onConvert }: LeadHeaderProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing/leads`;

	const copyToClipboard = (text: string | null | undefined) => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		toast.success(t("pricing.leads.detail.copied"));
	};

	return (
		<div className="bg-card border rounded-2xl overflow-hidden">
			<div className="px-6 py-4">
				{/* Breadcrumb */}
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
					<Link href={`/app/${organizationSlug}/pricing`} className="hover:text-foreground transition-colors">
						{t("pricing.title")}
					</Link>
					<ChevronLeft className="h-3 w-3" />
					<Link href={`/app/${organizationSlug}/pricing/leads`} className="hover:text-foreground transition-colors">
						{t("pricing.leads.title")}
					</Link>
					<ChevronLeft className="h-3 w-3" />
					<span className="text-foreground font-medium">{lead.name}</span>
				</div>

				{/* Main Row */}
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3 min-w-0">
						{/* Avatar */}
						<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0">
							{lead.name.charAt(0).toUpperCase()}
						</div>
						<div className="min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<h1 className="text-xl font-bold truncate">{lead.name}</h1>
								<LeadStatusBadge status={lead.status} />
								<LeadPriorityIndicator priority={lead.priority} />
							</div>
							{/* Quick Info Bar */}
							<div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
								{lead.phone && (
									<span className="flex items-center gap-1" dir="ltr">
										<Phone className="h-3 w-3" />{lead.phone}
									</span>
								)}
								{lead.projectLocation && (
									<span className="flex items-center gap-1">
										<MapPin className="h-3 w-3" />{lead.projectLocation}
									</span>
								)}
								{lead.estimatedValue && (
									<span className="flex items-center gap-1 text-primary font-medium">
										<Banknote className="h-3 w-3" />
										{formatCurrency(Number(lead.estimatedValue))} ر.س
									</span>
								)}
								{lead.assignedTo && (
									<span className="flex items-center gap-1">
										<UserCheck className="h-3 w-3" />{lead.assignedTo.name}
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-2 shrink-0">
						<Button variant="outline" size="sm" asChild className="gap-1.5 rounded-xl">
							<Link href={`${basePath}/${lead.id}/edit`}>
								<Pencil className="h-3.5 w-3.5" />
								{t("pricing.leads.actions.edit")}
							</Link>
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="gap-1.5 rounded-xl"
							onClick={onChangeStatus}
						>
							<RefreshCw className="h-3.5 w-3.5" />
							{t("pricing.leads.detail.changeStatus")}
						</Button>

						{!lead.convertedProjectId && lead.status !== "LOST" && lead.status !== "WON" && (
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5 rounded-xl border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
								onClick={onConvert}
							>
								<FolderKanban className="h-3.5 w-3.5" />
								{t("pricing.leads.detail.convertToProject")}
							</Button>
						)}

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon" className="h-8 w-8 rounded-xl">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="rounded-xl">
								{lead.phone && (
									<DropdownMenuItem onClick={() => copyToClipboard(lead.phone)}>
										<Phone className="me-2 h-4 w-4" />
										{t("pricing.leads.detail.copyPhone")}
									</DropdownMenuItem>
								)}
								{lead.email && (
									<DropdownMenuItem onClick={() => copyToClipboard(lead.email)}>
										{t("pricing.leads.detail.copyEmail")}
									</DropdownMenuItem>
								)}
								{(lead.phone || lead.email) && <DropdownMenuSeparator />}
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

				{/* Status Progress Bar */}
				{lead.status !== "LOST" && (
					<div className="mt-4">
						<div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
							<span>{t("pricing.leads.detail.opportunityPath")}</span>
							<span>{getStatusProgress(lead.status)}</span>
						</div>
						<div className="h-1.5 bg-muted rounded-full overflow-hidden">
							<div
								className={cn(
									"h-full rounded-full transition-all duration-500",
									lead.status === "WON" ? "bg-green-500" : "bg-primary",
								)}
								style={{ width: getStatusProgress(lead.status) }}
							/>
						</div>
						{/* Stage Labels */}
						<div className="flex justify-between text-[9px] text-muted-foreground mt-1">
							{STATUS_LABELS.map((label) => (
								<span key={label}>{label}</span>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

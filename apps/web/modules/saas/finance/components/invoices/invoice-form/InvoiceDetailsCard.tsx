"use client";

import { useTranslations } from "next-intl";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import { Calendar, FolderOpen } from "lucide-react";

interface InvoiceDetailsCardProps {
	isEditMode: boolean;
	invoice?: { invoiceNo: string } | null;
	issueDate: string;
	dueDate: string;
	showProjectLink: boolean;
	projectId?: string;
	projects: { id: string; name: string }[];
	vatPercent: number;
	currency: string;
	onIssueDateChange: (value: string) => void;
	onDueDateChange: (value: string) => void;
	onShowProjectLinkChange: (checked: boolean) => void;
	onProjectIdChange: (value: string) => void;
}

export function InvoiceDetailsCard({
	isEditMode,
	invoice,
	issueDate,
	dueDate,
	showProjectLink,
	projectId,
	projects,
	vatPercent,
	currency,
	onIssueDateChange,
	onDueDateChange,
	onShowProjectLinkChange,
	onProjectIdChange,
}: InvoiceDetailsCardProps) {
	const t = useTranslations();

	return (
		<div className="bg-card rounded-2xl border-2 overflow-hidden">
			<div className="flex items-center gap-2.5 px-5 py-3.5 border-b-2">
				<div className="flex size-8 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
					<Calendar className="h-[15px] w-[15px]" />
				</div>
				<span className="text-sm font-semibold text-card-foreground">{t("finance.invoices.details.metadata")}</span>
			</div>
			<div className="p-5 space-y-3.5">
				<div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted border">
					<span className="text-xs text-muted-foreground font-medium">{t("finance.invoices.columns.number")}</span>
					<span className="text-sm font-bold font-mono text-card-foreground tracking-wide">
						{isEditMode && invoice ? invoice.invoiceNo : `INV-${new Date().getFullYear()}-XXXX`}
					</span>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<Label className="text-xs text-muted-foreground">{t("finance.invoices.issueDate")}</Label>
						<Input type="date" value={issueDate} onChange={(e: any) => onIssueDateChange(e.target.value)} required className="rounded-xl mt-1 h-9" />
					</div>
					<div>
						<Label className="text-xs text-muted-foreground">{t("finance.invoices.dueDate")}</Label>
						<Input type="date" value={dueDate} onChange={(e: any) => onDueDateChange(e.target.value)} required className="rounded-xl mt-1 h-9" />
					</div>
				</div>

				<div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${showProjectLink ? "bg-chart-4/15 border-chart-4/40" : "bg-muted/50 border-dashed"}`}>
					<div className="flex items-center gap-2">
						<FolderOpen className={`h-4 w-4 ${showProjectLink ? "text-chart-4" : "text-muted-foreground"}`} />
						<span className={`text-sm font-medium ${showProjectLink ? "text-chart-4 dark:text-chart-4" : "text-muted-foreground"}`}>{t("finance.invoices.project")}</span>
					</div>
					<Switch checked={showProjectLink} onCheckedChange={onShowProjectLinkChange} />
				</div>
				{showProjectLink && (
					<Select value={projectId ?? "none"} onValueChange={onProjectIdChange}>
						<SelectTrigger className="rounded-xl h-9">
							<SelectValue placeholder={t("finance.invoices.selectProject")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="none">{t("finance.invoices.noProject")}</SelectItem>
							{projects.map((project) => (
								<SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				<div className="flex items-center gap-2 pt-1">
					<Badge variant="secondary" className="text-xs font-medium">{currency}</Badge>
					<div className="px-2.5 py-1 rounded-lg bg-chart-4/15 dark:bg-chart-4/20 border border-chart-4 dark:border-chart-4/40 text-xs font-bold text-chart-4 dark:text-chart-4">
						{t("finance.invoices.vatPercent")} {vatPercent}%
					</div>
				</div>
			</div>
		</div>
	);
}

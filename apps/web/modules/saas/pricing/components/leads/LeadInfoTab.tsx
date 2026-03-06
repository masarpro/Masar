"use client";

import {
	Building2,
	Calendar,
	CalendarDays,
	FolderKanban,
	Mail,
	MapPin,
	Phone,
	Ruler,
	Settings,
	Tag,
	User,
	Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDate } from "@saas/finance/lib/utils";

interface LeadInfoTabProps {
	lead: {
		name: string;
		phone?: string | null;
		email?: string | null;
		company?: string | null;
		clientType: string;
		projectType?: string | null;
		projectLocation?: string | null;
		estimatedArea?: number | null;
		estimatedValue?: number | null;
		source: string;
		priority: string;
		notes?: string | null;
		lostReason?: string | null;
		expectedCloseDate?: string | Date | null;
		createdAt: string | Date;
		updatedAt: string | Date;
		createdBy: { id: string; name: string };
		assignedTo?: { id: string; name: string } | null;
	};
}

function InfoRow({ icon: Icon, label, value, dir }: { icon: typeof User; label: string; value?: string | null; dir?: string }) {
	if (!value) return null;
	return (
		<div className="flex items-start gap-3">
			<Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
			<div className="min-w-0">
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className="text-sm font-medium text-foreground" dir={dir}>{value}</p>
			</div>
		</div>
	);
}

export function LeadInfoTab({ lead }: LeadInfoTabProps) {
	const t = useTranslations();

	return (
		<div className="space-y-4">
			{/* Client Info */}
			<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
					<div className="h-[30px] w-[30px] rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
						<User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 className="text-sm font-semibold text-foreground">
						{t("pricing.leads.form.clientInfo")}
					</h3>
				</div>
				<div className="p-5 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<InfoRow icon={User} label={t("pricing.leads.form.name")} value={lead.name} />
						<InfoRow icon={Phone} label={t("pricing.leads.form.phone")} value={lead.phone} dir="ltr" />
						<InfoRow icon={Mail} label={t("pricing.leads.form.email")} value={lead.email} dir="ltr" />
						<InfoRow icon={Building2} label={t("pricing.leads.form.company")} value={lead.company} />
						<InfoRow
							icon={Tag}
							label={t("pricing.leads.form.clientType")}
							value={t(`pricing.leads.clientType.${lead.clientType}`)}
						/>
						<InfoRow
							icon={Tag}
							label={t("pricing.leads.form.source")}
							value={t(`pricing.leads.source.${lead.source}`)}
						/>
					</div>
				</div>
			</div>

			{/* Project Info */}
			<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
					<div className="h-[30px] w-[30px] rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
						<FolderKanban className="h-4 w-4 text-violet-600 dark:text-violet-400" />
					</div>
					<h3 className="text-sm font-semibold text-foreground">
						{t("pricing.leads.form.projectInfo")}
					</h3>
				</div>
				<div className="p-5 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						{lead.projectType && (
							<InfoRow
								icon={Tag}
								label={t("pricing.leads.form.projectType")}
								value={t(`pricing.leads.projectType.${lead.projectType}`)}
							/>
						)}
						<InfoRow icon={MapPin} label={t("pricing.leads.form.projectLocation")} value={lead.projectLocation} />
						{lead.estimatedArea && (
							<InfoRow
								icon={Ruler}
								label={t("pricing.leads.form.estimatedArea")}
								value={`${new Intl.NumberFormat("en-SA").format(lead.estimatedArea)} ${t("pricing.leads.area")}`}
							/>
						)}
						{lead.estimatedValue && (
							<InfoRow
								icon={Wallet}
								label={t("pricing.leads.form.estimatedValue")}
								value={`${new Intl.NumberFormat("en-SA").format(lead.estimatedValue)} ر.س`}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Management Info */}
			<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
					<div className="h-[30px] w-[30px] rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
						<Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
					</div>
					<h3 className="text-sm font-semibold text-foreground">
						{t("pricing.leads.detail.managementInfo")}
					</h3>
				</div>
				<div className="p-5 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<InfoRow
							icon={User}
							label={t("pricing.leads.form.assignedTo")}
							value={lead.assignedTo?.name ?? t("pricing.leads.unassigned")}
						/>
						<InfoRow
							icon={User}
							label={t("pricing.leads.detail.createdBy")}
							value={lead.createdBy.name}
						/>
						<InfoRow
							icon={Calendar}
							label={t("pricing.leads.detail.createdAt")}
							value={formatDate(lead.createdAt)}
						/>
						<InfoRow
							icon={Calendar}
							label={t("pricing.leads.detail.updatedAt")}
							value={formatDate(lead.updatedAt)}
						/>
						{lead.expectedCloseDate && (
							<InfoRow
								icon={CalendarDays}
								label={t("pricing.leads.form.expectedCloseDate")}
								value={formatDate(lead.expectedCloseDate)}
							/>
						)}
					</div>

					{lead.notes && (
						<div className="pt-2 border-t border-slate-100 dark:border-slate-800">
							<p className="text-xs text-muted-foreground mb-1">{t("pricing.leads.form.notes")}</p>
							<p className="text-sm text-foreground whitespace-pre-wrap">{lead.notes}</p>
						</div>
					)}

					{lead.lostReason && (
						<div className="pt-2 border-t border-slate-100 dark:border-slate-800">
							<p className="text-xs text-muted-foreground mb-1">{t("pricing.leads.detail.lostReason")}</p>
							<p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{lead.lostReason}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

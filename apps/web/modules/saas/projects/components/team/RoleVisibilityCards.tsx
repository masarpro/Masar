"use client";

import {
	Briefcase,
	UserCircle,
	HardHat,
	Calculator,
	Eye,
	Check,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	type ProjectRole,
	ROLE_SECTION_VISIBILITY,
} from "../../lib/role-visibility";

const roleIcons: Record<ProjectRole, typeof UserCircle> = {
	MANAGER: Briefcase,
	ENGINEER: UserCircle,
	SUPERVISOR: HardHat,
	ACCOUNTANT: Calculator,
	VIEWER: Eye,
};

const roleCardColors: Record<ProjectRole, { bg: string; iconBg: string; iconColor: string; border: string }> = {
	MANAGER: {
		bg: "bg-purple-50/80 dark:bg-purple-950/20",
		iconBg: "bg-purple-100 dark:bg-purple-900/30",
		iconColor: "text-purple-600 dark:text-purple-400",
		border: "border-purple-200/50 dark:border-purple-800/50",
	},
	ENGINEER: {
		bg: "bg-blue-50/80 dark:bg-blue-950/20",
		iconBg: "bg-blue-100 dark:bg-blue-900/30",
		iconColor: "text-blue-600 dark:text-blue-400",
		border: "border-blue-200/50 dark:border-blue-800/50",
	},
	SUPERVISOR: {
		bg: "bg-orange-50/80 dark:bg-orange-950/20",
		iconBg: "bg-orange-100 dark:bg-orange-900/30",
		iconColor: "text-orange-600 dark:text-orange-400",
		border: "border-orange-200/50 dark:border-orange-800/50",
	},
	ACCOUNTANT: {
		bg: "bg-green-50/80 dark:bg-green-950/20",
		iconBg: "bg-green-100 dark:bg-green-900/30",
		iconColor: "text-green-600 dark:text-green-400",
		border: "border-green-200/50 dark:border-green-800/50",
	},
	VIEWER: {
		bg: "bg-slate-50/80 dark:bg-slate-950/20",
		iconBg: "bg-slate-100 dark:bg-slate-800/50",
		iconColor: "text-slate-600 dark:text-slate-400",
		border: "border-slate-200/50 dark:border-slate-800/50",
	},
};

const ALL_SECTIONS = [
	"overview",
	"field",
	"supervisor",
	"finance",
	"finance/expenses",
	"finance/payments",
	"finance/claims",
	"timeline",
	"changes",
	"documents",
	"chat",
	"updates",
	"owner",
	"insights",
	"team",
];

const roles: ProjectRole[] = [
	"MANAGER",
	"ENGINEER",
	"SUPERVISOR",
	"ACCOUNTANT",
	"VIEWER",
];

export function RoleVisibilityCards() {
	const t = useTranslations();

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
				{t("projects.team.rolePermissions")}
			</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{roles.map((role) => {
					const Icon = roleIcons[role];
					const colors = roleCardColors[role];
					const visibleSections = ROLE_SECTION_VISIBILITY[role];

					return (
						<div
							key={role}
							className={`backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border ${colors.border} rounded-2xl shadow-lg shadow-black/5 overflow-hidden`}
						>
							{/* Role Header */}
							<div className={`${colors.bg} p-4 border-b ${colors.border}`}>
								<div className="flex items-center gap-3">
									<div className={`rounded-xl p-2.5 ${colors.iconBg}`}>
										<Icon className={`h-5 w-5 ${colors.iconColor}`} />
									</div>
									<div>
										<h4 className="font-semibold text-slate-900 dark:text-slate-100">
											{t(`projects.team.roles.${role}`)}
										</h4>
										<p className="text-xs text-slate-500 dark:text-slate-400">
											{t(`projects.team.roleDescriptions.${role}`)}
										</p>
									</div>
								</div>
							</div>

							{/* Sections List */}
							<div className="p-4">
								<div className="space-y-1.5">
									{ALL_SECTIONS.map((section) => {
										const isVisible = visibleSections.includes(section);
										return (
											<div
												key={section}
												className="flex items-center gap-2 text-xs"
											>
												{isVisible ? (
													<Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
												) : (
													<X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
												)}
												<span
													className={
														isVisible
															? "text-slate-700 dark:text-slate-300"
															: "text-slate-400 dark:text-slate-600"
													}
												>
													{t(`projects.sections.${section.replace("/", "_")}`)}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

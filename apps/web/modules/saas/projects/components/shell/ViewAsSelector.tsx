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
	Briefcase,
	UserCircle,
	HardHat,
	Calculator,
	Eye,
	ScanEye,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useProjectRole } from "../../hooks/use-project-role";
import type { ProjectRole } from "../../lib/role-visibility";

const roleIcons: Record<ProjectRole, typeof UserCircle> = {
	MANAGER: Briefcase,
	ENGINEER: UserCircle,
	SUPERVISOR: HardHat,
	ACCOUNTANT: Calculator,
	VIEWER: Eye,
};

const roleColors: Record<ProjectRole, string> = {
	MANAGER: "text-purple-600 dark:text-purple-400",
	ENGINEER: "text-blue-600 dark:text-blue-400",
	SUPERVISOR: "text-orange-600 dark:text-orange-400",
	ACCOUNTANT: "text-green-600 dark:text-green-400",
	VIEWER: "text-slate-600 dark:text-slate-400",
};

const roles: ProjectRole[] = [
	"MANAGER",
	"ENGINEER",
	"SUPERVISOR",
	"ACCOUNTANT",
	"VIEWER",
];

export function ViewAsSelector() {
	const t = useTranslations();
	const { isManager, isViewAsActive, viewAsRole, setViewAs } =
		useProjectRole();

	if (!isManager) return null;

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className={`rounded-lg gap-1.5 text-xs ${
							isViewAsActive
								? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
								: "border-slate-200 dark:border-slate-700"
						}`}
					>
						<ScanEye className="h-3.5 w-3.5" />
						{isViewAsActive
							? t(`projects.team.roles.${viewAsRole}`)
							: t("projects.viewAs.button")}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-[200px]">
					{roles.map((role) => {
						const Icon = roleIcons[role];
						const isSelected = isViewAsActive && viewAsRole === role;
						return (
							<DropdownMenuItem
								key={role}
								onClick={() => setViewAs(role === "MANAGER" ? null : role)}
								className={`gap-2 ${isSelected ? "bg-accent" : ""}`}
							>
								<Icon
									className={`h-4 w-4 ${roleColors[role]}`}
								/>
								<span>{t(`projects.team.roles.${role}`)}</span>
								{role === "MANAGER" && (
									<span className="ms-auto text-[10px] text-slate-400">
										{t("projects.viewAs.default")}
									</span>
								)}
							</DropdownMenuItem>
						);
					})}
					{isViewAsActive && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setViewAs(null)}
								className="gap-2 text-amber-600"
							>
								<X className="h-4 w-4" />
								{t("projects.viewAs.exit")}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Preview mode indicator banner */}
			{isViewAsActive && (
				<div className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					<Eye className="h-3 w-3" />
					{t("projects.viewAs.previewMode")}
				</div>
			)}
		</div>
	);
}

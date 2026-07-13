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
	MANAGER: "text-chart-4",
	ENGINEER: "text-chart-4 dark:text-chart-4",
	SUPERVISOR: "text-chart-1",
	ACCOUNTANT: "text-success",
	VIEWER: "text-muted-foreground",
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
								? "border-chart-1 bg-chart-1/15 text-chart-1"
								: "border-border"
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
									<span className="ms-auto text-[10px] text-muted-foreground">
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
								className="gap-2 text-chart-1"
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
				<div className="flex items-center gap-1.5 rounded-lg bg-chart-1/15 px-2.5 py-1 text-xs font-medium text-chart-1">
					<Eye className="h-3 w-3" />
					{t("projects.viewAs.previewMode")}
				</div>
			)}
		</div>
	);
}

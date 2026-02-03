"use client";

import { Badge } from "@ui/components/badge";
import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon, ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type HealthStatus = "ON_TRACK" | "AT_RISK" | "DELAYED";

interface TimelineHealthBadgeProps {
	status: HealthStatus;
	showIcon?: boolean;
	size?: "sm" | "md" | "lg";
}

export function TimelineHealthBadge({
	status,
	showIcon = true,
	size = "md",
}: TimelineHealthBadgeProps) {
	const t = useTranslations();

	const sizeClasses = {
		sm: "text-xs py-0.5 px-2",
		md: "text-sm py-1 px-3",
		lg: "text-base py-1.5 px-4",
	};

	const iconSize = {
		sm: "h-3 w-3",
		md: "h-4 w-4",
		lg: "h-5 w-5",
	};

	switch (status) {
		case "ON_TRACK":
			return (
				<Badge
					variant="default"
					className={`bg-green-500 hover:bg-green-600 ${sizeClasses[size]}`}
				>
					{showIcon && <CheckCircleIcon className={`${iconSize[size]} mr-1`} />}
					{t("timeline.health.onTrack")}
				</Badge>
			);
		case "AT_RISK":
			return (
				<Badge
					variant="default"
					className={`bg-orange-500 hover:bg-orange-600 ${sizeClasses[size]}`}
				>
					{showIcon && (
						<AlertTriangleIcon className={`${iconSize[size]} mr-1`} />
					)}
					{t("timeline.health.atRisk")}
				</Badge>
			);
		case "DELAYED":
			return (
				<Badge
					variant="default"
					className={`bg-red-500 hover:bg-red-600 ${sizeClasses[size]}`}
				>
					{showIcon && <XCircleIcon className={`${iconSize[size]} mr-1`} />}
					{t("timeline.health.delayed")}
				</Badge>
			);
		default:
			return (
				<Badge variant="secondary" className={sizeClasses[size]}>
					{showIcon && <ClockIcon className={`${iconSize[size]} mr-1`} />}
					{t("timeline.health.planned")}
				</Badge>
			);
	}
}

interface MilestoneStatusBadgeProps {
	status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
	size?: "sm" | "md" | "lg";
}

export function MilestoneStatusBadge({
	status,
	size = "md",
}: MilestoneStatusBadgeProps) {
	const t = useTranslations();

	const sizeClasses = {
		sm: "text-xs py-0.5 px-2",
		md: "text-sm py-1 px-3",
		lg: "text-base py-1.5 px-4",
	};

	switch (status) {
		case "COMPLETED":
			return (
				<Badge
					variant="default"
					className={`bg-green-500 hover:bg-green-600 ${sizeClasses[size]}`}
				>
					{t("timeline.status.completed")}
				</Badge>
			);
		case "IN_PROGRESS":
			return (
				<Badge
					variant="default"
					className={`bg-blue-500 hover:bg-blue-600 ${sizeClasses[size]}`}
				>
					{t("timeline.status.inProgress")}
				</Badge>
			);
		case "DELAYED":
			return (
				<Badge
					variant="default"
					className={`bg-red-500 hover:bg-red-600 ${sizeClasses[size]}`}
				>
					{t("timeline.status.delayed")}
				</Badge>
			);
		case "PLANNED":
		default:
			return (
				<Badge variant="secondary" className={sizeClasses[size]}>
					{t("timeline.status.planned")}
				</Badge>
			);
	}
}

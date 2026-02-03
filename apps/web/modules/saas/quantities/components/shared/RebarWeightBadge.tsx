"use client";

import { Scale } from "lucide-react";

interface RebarWeightBadgeProps {
	weight: number;
	showTons?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function RebarWeightBadge({
	weight,
	showTons = true,
	size = "md",
	className,
}: RebarWeightBadgeProps) {
	const tons = weight / 1000;

	const sizeClasses = {
		sm: "px-3 py-1.5 text-sm",
		md: "px-4 py-2 text-base",
		lg: "px-5 py-2.5 text-lg",
	};

	return (
		<div className="flex justify-center mt-4">
			<div
				className={`inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold dark:bg-red-950 dark:text-red-300 dark:border-red-800 ${sizeClasses[size]} ${className || ""}`}
			>
				<Scale className="h-4 w-4" />
				<span>وزن الحديد: {weight.toFixed(2)} كجم</span>
				{showTons && (
					<span className="text-sm font-normal opacity-80">
						({tons.toFixed(3)} طن)
					</span>
				)}
			</div>
		</div>
	);
}

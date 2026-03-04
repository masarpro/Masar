"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useFeatureAccess, type FeatureKey } from "../hooks/use-feature-access";
import { UpgradeDialog } from "./UpgradeDialog";
import { LockIcon } from "lucide-react";

export function UpgradeGate({
	feature,
	children,
}: {
	feature: FeatureKey;
	children: ReactNode;
}) {
	const { allowed, reasonAr, checking } = useFeatureAccess(feature);
	const [dialogOpen, setDialogOpen] = useState(false);

	// While checking or if allowed, render children normally
	if (checking || allowed) {
		return <>{children}</>;
	}

	// Blocked: wrap children in a click-intercepting container
	return (
		<>
			<div
				className="relative inline-flex cursor-pointer"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setDialogOpen(true);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setDialogOpen(true);
					}
				}}
				role="button"
				tabIndex={0}
			>
				<div className="pointer-events-none opacity-60">
					{children}
				</div>
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="flex size-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
						<LockIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
					</div>
				</div>
			</div>

			<UpgradeDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				reasonAr={reasonAr}
			/>
		</>
	);
}

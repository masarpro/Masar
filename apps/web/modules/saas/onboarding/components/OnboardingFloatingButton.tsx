"use client";

import { cn } from "@ui/lib";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOnboardingOverlay } from "./OnboardingOverlayProvider";

export function OnboardingFloatingButton() {
	const { isModalOpen, showReminder, openModal } = useOnboardingOverlay();
	const t = useTranslations();

	// Don't render when modal is open
	if (isModalOpen) return null;

	return (
		<div className="fixed bottom-20 end-6 z-[60] md:bottom-6">
			{/* Reminder bubble */}
			{showReminder && (
				<div className="absolute -top-12 end-0 whitespace-nowrap rounded-lg bg-card px-3 py-2 text-sm font-medium shadow-lg border border-border/50 animate-in fade-in-0 slide-in-from-bottom-2">
					{t("onboarding.modal.reminder")}
					<div className="absolute -bottom-1 end-5 h-2 w-2 rotate-45 bg-card border-b border-r border-border/50" />
				</div>
			)}

			{/* Button */}
			<button
				type="button"
				onClick={openModal}
				aria-label={t("onboarding.modal.setupOrg")}
				className={cn(
					"flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95",
					showReminder && "animate-bounce",
				)}
			>
				<Building2 size={24} />
			</button>
		</div>
	);
}

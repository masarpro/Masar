"use client";

import { Progress } from "@ui/components/progress";
import { Button } from "@ui/components/button";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import type { PropsWithChildren } from "react";

interface WizardModalShellProps {
	currentStep: number;
	totalSteps: number;
	stepLabel: string;
	onPrevious?: () => void;
}

export function WizardModalShell({
	currentStep,
	totalSteps,
	stepLabel,
	onPrevious,
	children,
}: PropsWithChildren<WizardModalShellProps>) {
	const t = useTranslations();
	const progressValue = ((currentStep + 1) / totalSteps) * 100;

	return (
		<div className="flex flex-col">
			{/* Progress bar + step label */}
			<div className="flex items-center justify-between px-6 pb-2">
				<span className="text-muted-foreground text-sm">{stepLabel}</span>
			</div>
			<div className="px-6">
				<Progress value={progressValue} className="h-1 rounded-full" />
			</div>

			{/* Scrollable content */}
			<main className="max-h-[60vh] overflow-y-auto px-4 py-6 md:px-6">
				<div className="mx-auto w-full max-w-2xl">{children}</div>
			</main>

			{/* Footer navigation */}
			{onPrevious && (
				<footer className="border-t px-6 py-3">
					<div className="mx-auto flex max-w-2xl justify-start">
						<Button variant="ghost" size="sm" onClick={onPrevious}>
							<ChevronRight className="ml-1 h-4 w-4 rotate-180" />
							{t("onboarding.wizard.nav.previous")}
						</Button>
					</div>
				</footer>
			)}
		</div>
	);
}

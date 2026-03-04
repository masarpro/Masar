"use client";

import { Logo } from "@shared/components/Logo";
import { Progress } from "@ui/components/progress";
import { Button } from "@ui/components/button";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import type { PropsWithChildren } from "react";

interface WizardShellProps {
	currentStep: number;
	totalSteps: number;
	stepLabel: string;
	onPrevious?: () => void;
}

export function WizardShell({
	currentStep,
	totalSteps,
	stepLabel,
	onPrevious,
	children,
}: PropsWithChildren<WizardShellProps>) {
	const t = useTranslations();
	const progressValue = ((currentStep + 1) / totalSteps) * 100;

	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/30">
			{/* Header */}
			<header className="flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
				<Logo />
				<div className="flex items-center gap-3">
					<span className="text-muted-foreground text-sm">{stepLabel}</span>
				</div>
			</header>

			{/* Progress bar */}
			<div className="px-6">
				<Progress value={progressValue} className="h-1 rounded-none" />
			</div>

			{/* Content */}
			<main className="flex flex-1 items-center justify-center px-4 py-8">
				<div className="w-full max-w-2xl">{children}</div>
			</main>

			{/* Footer navigation */}
			{onPrevious && (
				<footer className="border-t bg-background/80 px-6 py-4 backdrop-blur-sm">
					<div className="mx-auto flex max-w-2xl justify-start">
						<Button variant="ghost" onClick={onPrevious}>
							<ChevronRight className="ml-1 h-4 w-4 rotate-180" />
							{t("onboarding.wizard.nav.previous")}
						</Button>
					</div>
				</footer>
			)}
		</div>
	);
}

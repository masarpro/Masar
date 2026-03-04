"use client";

import { Button } from "@ui/components/button";
import { Building2, FileText, FolderPlus } from "lucide-react";
import { useTranslations } from "next-intl";

interface WelcomeStepProps {
	onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
	const t = useTranslations();

	const features = [
		{
			icon: Building2,
			label: t("onboarding.wizard.welcome.step1"),
		},
		{
			icon: FileText,
			label: t("onboarding.wizard.welcome.step2"),
		},
		{
			icon: FolderPlus,
			label: t("onboarding.wizard.welcome.step3"),
		},
	];

	return (
		<div className="flex flex-col items-center text-center">
			<h1 className="text-3xl font-bold md:text-4xl">
				{t("onboarding.wizard.welcome.title")}
			</h1>
			<p className="mt-3 text-lg text-muted-foreground">
				{t("onboarding.wizard.welcome.subtitle")}
			</p>

			<div className="mt-10 flex flex-wrap justify-center gap-6">
				{features.map((feature) => (
					<div
						key={feature.label}
						className="flex flex-col items-center gap-2 rounded-xl border bg-card p-6 shadow-sm"
					>
						<feature.icon className="h-8 w-8 text-primary" />
						<span className="text-sm font-medium">{feature.label}</span>
					</div>
				))}
			</div>

			<Button size="lg" className="mt-10 px-10 text-lg" onClick={onNext}>
				{t("onboarding.wizard.welcome.cta")}
			</Button>
		</div>
	);
}

"use client";

import { Button } from "@ui/components/button";
import { CheckCircle, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface CompletionStepProps {
	companyName: string;
	selectedTemplateName: string | null;
	createdProjectSlug: string | null;
	inviteCount: number;
	skippedSteps: string[];
	organizationSlug: string;
	onComplete: () => void;
}

export function CompletionStep({
	companyName,
	selectedTemplateName,
	createdProjectSlug,
	inviteCount,
	skippedSteps,
	organizationSlug,
	onComplete,
}: CompletionStepProps) {
	const t = useTranslations();
	const [completing, setCompleting] = useState(false);

	// Auto-complete on mount
	useEffect(() => {
		const timer = setTimeout(() => {
			// Don't auto-complete, let user click
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	const handleComplete = async () => {
		setCompleting(true);
		await onComplete();
	};

	const summaryItems = [
		{
			label: t("onboarding.wizard.completion.companyInfo"),
			value: companyName,
			done: true,
		},
		{
			label: t("onboarding.wizard.completion.template"),
			value: selectedTemplateName || "—",
			done: !!selectedTemplateName,
		},
		{
			label: t("onboarding.wizard.completion.project"),
			value: createdProjectSlug || "—",
			done: !!createdProjectSlug,
		},
		{
			label: t("onboarding.wizard.completion.team"),
			value: skippedSteps.includes("inviteTeam")
				? t("onboarding.wizard.completion.skipped")
				: t("onboarding.wizard.completion.invitesSent", {
						count: inviteCount,
					}),
			done: !skippedSteps.includes("inviteTeam"),
			skipped: skippedSteps.includes("inviteTeam"),
		},
	];

	return (
		<div className="flex flex-col items-center text-center">
			<div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
				<CheckCircle className="h-10 w-10 text-green-600" />
			</div>

			<h2 className="mt-6 text-3xl font-bold">
				{t("onboarding.wizard.completion.title")}
			</h2>
			<p className="mt-2 text-muted-foreground">
				{t("onboarding.wizard.completion.subtitle")}
			</p>

			<div className="mt-8 w-full max-w-md space-y-3">
				{summaryItems.map((item) => (
					<div
						key={item.label}
						className="flex items-center gap-3 rounded-lg border p-3"
					>
						{item.skipped ? (
							<SkipForward className="h-5 w-5 shrink-0 text-muted-foreground" />
						) : (
							<CheckCircle
								className={`h-5 w-5 shrink-0 ${item.done ? "text-green-500" : "text-muted-foreground"}`}
							/>
						)}
						<span className="flex-1 text-start text-sm font-medium">
							{item.label}
						</span>
						<span className="text-sm text-muted-foreground">
							{item.value}
						</span>
					</div>
				))}
			</div>

			<div className="mt-8 flex flex-col items-center gap-3">
				<Button
					size="lg"
					className="px-10 text-lg"
					onClick={handleComplete}
					loading={completing}
				>
					{t("onboarding.wizard.completion.goToProject")}
				</Button>
				<button
					type="button"
					onClick={handleComplete}
					className="text-sm text-muted-foreground underline-offset-4 hover:underline"
				>
					{t("onboarding.wizard.completion.goToDashboard")}
				</button>
			</div>
		</div>
	);
}

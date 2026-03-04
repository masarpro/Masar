"use client";

import { authClient } from "@repo/auth/client";
import { useRouter } from "@shared/hooks/router";
import { clearCache } from "@shared/lib/cache";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { WIZARD_STEPS } from "../lib/wizard-steps";
import { WizardShell } from "./WizardShell";
import { WizardModalShell } from "./WizardModalShell";
import { WelcomeStep } from "./steps/WelcomeStep";
import { CompanyInfoStep } from "./steps/CompanyInfoStep";
import { TemplateStep } from "./steps/TemplateStep";
import { FirstProjectStep } from "./steps/FirstProjectStep";
import { InviteTeamStep } from "./steps/InviteTeamStep";
import { CompletionStep } from "./steps/CompletionStep";

interface OnboardingWizardProps {
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
	variant?: "page" | "modal";
	onDismiss?: () => void;
}

export function OnboardingWizard({
	organizationId,
	organizationSlug,
	organizationName,
	variant = "page",
	onDismiss,
}: OnboardingWizardProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [currentStep, setCurrentStep] = useState(0);
	const [skippedSteps, setSkippedSteps] = useState<string[]>([]);

	// Shared state between steps
	const [companyName, setCompanyName] = useState(organizationName);
	const [companyLogo, setCompanyLogo] = useState<string | null>(null);
	const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
	const [createdProjectSlug, setCreatedProjectSlug] = useState<string | null>(
		null,
	);
	const [inviteCount, setInviteCount] = useState(0);
	const [selectedTemplateName, setSelectedTemplateName] = useState<
		string | null
	>(null);

	const completeWizardMutation = useMutation(
		orpc.onboarding.completeWizard.mutationOptions(),
	);

	const handleNext = useCallback(() => {
		setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
	}, []);

	const handlePrevious = useCallback(() => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	}, []);

	const handleSkip = useCallback(
		(stepId: string) => {
			setSkippedSteps((prev) => [...prev, stepId]);
			handleNext();
		},
		[handleNext],
	);

	const handleComplete = useCallback(async () => {
		try {
			await completeWizardMutation.mutateAsync({
				organizationId,
				skippedSteps,
			});
			await authClient.updateUser({ onboardingComplete: true });
			await clearCache();
			queryClient.invalidateQueries();

			if (variant === "modal") {
				onDismiss?.();
				if (createdProjectId && createdProjectSlug) {
					router.replace(
						`/app/${organizationSlug}/projects/${createdProjectSlug}`,
					);
				}
				return;
			}

			if (createdProjectId && createdProjectSlug) {
				router.replace(
					`/app/${organizationSlug}/projects/${createdProjectSlug}`,
				);
			} else {
				router.replace(`/app/${organizationSlug}`);
			}
		} catch {
			if (variant === "modal") {
				onDismiss?.();
				return;
			}
			router.replace(`/app/${organizationSlug}`);
		}
	}, [
		completeWizardMutation,
		organizationId,
		organizationSlug,
		skippedSteps,
		createdProjectId,
		createdProjectSlug,
		queryClient,
		router,
		variant,
		onDismiss,
	]);

	const stepComponents = [
		<WelcomeStep key="welcome" onNext={handleNext} />,
		<CompanyInfoStep
			key="companyInfo"
			organizationId={organizationId}
			organizationName={organizationName}
			onNext={handleNext}
			onCompanyUpdate={(name, logo) => {
				setCompanyName(name);
				setCompanyLogo(logo ?? null);
			}}
		/>,
		<TemplateStep
			key="template"
			organizationId={organizationId}
			onNext={handleNext}
			onTemplateSelected={(name) => setSelectedTemplateName(name)}
		/>,
		<FirstProjectStep
			key="firstProject"
			organizationId={organizationId}
			onNext={handleNext}
			onProjectCreated={(id, slug) => {
				setCreatedProjectId(id);
				setCreatedProjectSlug(slug);
			}}
		/>,
		<InviteTeamStep
			key="inviteTeam"
			organizationId={organizationId}
			onNext={handleNext}
			onSkip={() => handleSkip("inviteTeam")}
			onInvitesSent={(count) => setInviteCount(count)}
		/>,
		<CompletionStep
			key="completion"
			companyName={companyName}
			selectedTemplateName={selectedTemplateName}
			createdProjectSlug={createdProjectSlug}
			inviteCount={inviteCount}
			skippedSteps={skippedSteps}
			organizationSlug={organizationSlug}
			onComplete={handleComplete}
		/>,
	];

	const Shell = variant === "modal" ? WizardModalShell : WizardShell;

	return (
		<Shell
			currentStep={currentStep}
			totalSteps={WIZARD_STEPS.length}
			onPrevious={currentStep > 0 && currentStep < WIZARD_STEPS.length - 1 ? handlePrevious : undefined}
			stepLabel={t("onboarding.step", {
				step: currentStep + 1,
				total: WIZARD_STEPS.length,
			})}
		>
			{stepComponents[currentStep]}
		</Shell>
	);
}

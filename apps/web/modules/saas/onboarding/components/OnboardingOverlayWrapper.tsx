"use client";

import type { PropsWithChildren } from "react";
import { OnboardingOverlayProvider } from "./OnboardingOverlayProvider";
import { OnboardingModal } from "./OnboardingModal";
import { OnboardingFloatingButton } from "./OnboardingFloatingButton";

interface OnboardingOverlayWrapperProps {
	shouldShow: boolean;
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
}

export function OnboardingOverlayWrapper({
	shouldShow,
	organizationId,
	organizationSlug,
	organizationName,
	children,
}: PropsWithChildren<OnboardingOverlayWrapperProps>) {
	if (!shouldShow) {
		return <>{children}</>;
	}

	return (
		<OnboardingOverlayProvider>
			{children}
			<OnboardingModal
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				organizationName={organizationName}
			/>
			<OnboardingFloatingButton />
		</OnboardingOverlayProvider>
	);
}

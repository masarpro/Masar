"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ui/components/button";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOnboardingOverlay } from "./OnboardingOverlayProvider";
import { OnboardingWizard } from "./OnboardingWizard";

interface OnboardingModalProps {
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
}

export function OnboardingModal({
	organizationId,
	organizationSlug,
	organizationName,
}: OnboardingModalProps) {
	const { isModalOpen, dismissModal } = useOnboardingOverlay();
	const t = useTranslations();

	return (
		<Dialog.Root open={isModalOpen} onOpenChange={(open) => !open && dismissModal()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-[70] bg-background/60 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
				<Dialog.Content className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-6">
					<div className="relative flex h-full w-full flex-col overflow-hidden bg-card/95 shadow-2xl backdrop-blur-xl md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-2xl md:border md:border-border/50">
						{/* Header */}
						<div className="flex items-center justify-between border-b px-6 py-4">
							<Dialog.Title className="text-lg font-semibold">
								{t("onboarding.modal.title")}
							</Dialog.Title>
							<Button
								variant="ghost"
								size="sm"
								onClick={dismissModal}
								className="gap-1 text-muted-foreground"
							>
								{t("onboarding.modal.later")}
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* Wizard content */}
						<div className="flex-1 overflow-hidden">
							<OnboardingWizard
								organizationId={organizationId}
								organizationSlug={organizationSlug}
								organizationName={organizationName}
								variant="modal"
								onDismiss={dismissModal}
							/>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

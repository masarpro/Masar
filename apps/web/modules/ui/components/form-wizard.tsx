"use client";

import { Button } from "@ui/components/button";
import type { ReactNode } from "react";
import { useState } from "react";

export type WizardStep = {
	title: string;
	description?: string;
	content: ReactNode;
	validate?: () => Promise<boolean> | boolean;
};

type FormWizardProps = {
	steps: WizardStep[];
	onComplete: () => void;
	isSubmitting?: boolean;
	submitLabel?: string;
	previousLabel?: string;
	nextLabel?: string;
};

export function FormWizard({
	steps,
	onComplete,
	isSubmitting,
	submitLabel = "حفظ",
	previousLabel = "السابق",
	nextLabel = "التالي",
}: FormWizardProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const isLastStep = currentStep === steps.length - 1;

	const handleNext = async () => {
		const step = steps[currentStep];
		if (step.validate) {
			const isValid = await step.validate();
			if (!isValid) return;
		}
		if (isLastStep) {
			onComplete();
		} else {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handleBack = () => {
		setCurrentStep((prev) => Math.max(0, prev - 1));
	};

	return (
		<div className="space-y-6">
			{/* Progress Steps */}
			<nav
				aria-label="خطوات النموذج"
				className="flex items-center justify-center gap-2"
			>
				{steps.map((step, i) => (
					<div key={i} className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => i < currentStep && setCurrentStep(i)}
							disabled={i > currentStep}
							className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors
								${i === currentStep ? "bg-primary text-primary-foreground" : ""}
								${i < currentStep ? "bg-primary/20 text-primary cursor-pointer" : ""}
								${i > currentStep ? "bg-muted text-muted-foreground" : ""}
							`}
							aria-current={i === currentStep ? "step" : undefined}
							aria-label={`${step.title} - خطوة ${i + 1} من ${steps.length}`}
						>
							{i < currentStep ? "\u2713" : i + 1}
						</button>
						{i < steps.length - 1 && (
							<div
								className={`h-0.5 w-8 ${i < currentStep ? "bg-primary" : "bg-muted"}`}
							/>
						)}
					</div>
				))}
			</nav>

			{/* Step Title */}
			<div className="text-center">
				<h3 className="text-lg font-semibold">
					{steps[currentStep].title}
				</h3>
				{steps[currentStep].description && (
					<p className="text-sm text-muted-foreground">
						{steps[currentStep].description}
					</p>
				)}
			</div>

			{/* Step Content */}
			<div className="min-h-[200px]">{steps[currentStep].content}</div>

			{/* Navigation Buttons */}
			<div className="flex items-center justify-between border-t pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={handleBack}
					disabled={currentStep === 0}
				>
					{previousLabel}
				</Button>
				<span className="text-sm text-muted-foreground">
					{currentStep + 1} من {steps.length}
				</span>
				<Button
					type="button"
					onClick={handleNext}
					disabled={isSubmitting}
				>
					{isSubmitting
						? "جاري الحفظ..."
						: isLastStep
							? submitLabel
							: nextLabel}
				</Button>
			</div>
		</div>
	);
}

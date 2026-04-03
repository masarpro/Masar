"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@ui/lib";

interface TemplateStepProps {
	organizationId: string;
	onNext: () => void;
	onTemplateSelected: (name: string) => void;
}

export function TemplateStep({
	organizationId,
	onNext,
	onTemplateSelected,
}: TemplateStepProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
		null,
	);

	// Seed templates first, then list them
	const seedMutation = useMutation(
		orpc.company.templates.seed.mutationOptions(),
	);

	const {
		data: templatesData,
		isLoading,
		refetch,
	} = useQuery({
		...orpc.company.templates.list.queryOptions({
			input: {
				organizationId,
				templateType: "INVOICE",
			},
		}),
		staleTime: STALE_TIMES.TEMPLATES,
	});

	const templates = templatesData?.templates ?? [];

	// Seed default templates if none exist
	useEffect(() => {
		if (templatesData && templates.length === 0 && !seedMutation.isPending) {
			seedMutation
				.mutateAsync({ organizationId })
				.then(() => refetch())
				.catch(() => {});
		}
	}, [templatesData, templates.length, organizationId, seedMutation, refetch]);

	// Auto-select the default template
	useEffect(() => {
		if (templates.length > 0 && !selectedTemplateId) {
			const defaultTemplate = templates.find(
				(tmpl: any) => tmpl.isDefault,
			);
			if (defaultTemplate) {
				setSelectedTemplateId(defaultTemplate.id);
			}
		}
	}, [templates, selectedTemplateId]);

	const setDefaultMutation = useMutation(
		orpc.onboarding.setDefaultTemplate.mutationOptions(),
	);

	const handleContinue = async () => {
		if (!selectedTemplateId) return;

		try {
			await setDefaultMutation.mutateAsync({
				organizationId,
				templateId: selectedTemplateId,
			});

			const selected = templates.find(
				(tmpl: any) => tmpl.id === selectedTemplateId,
			);
			if (selected) {
				onTemplateSelected(selected.name);
			}

			queryClient.invalidateQueries({
				queryKey: ["finance", "templates"],
			});
			onNext();
		} catch {
			toast.error("فشل تعيين القالب الافتراضي");
		}
	};

	// Get template color from settings
	const getTemplateColor = (template: (typeof templates)[number]) => {
		const settings = template.settings as Record<string, unknown> | null;
		return (settings?.primaryColor as string) || "#1a1a1a";
	};

	return (
		<div>
			<h2 className="text-2xl font-bold">
				{t("onboarding.wizard.template.title")}
			</h2>
			<p className="mt-1 text-muted-foreground">
				{t("onboarding.wizard.template.subtitle")}
			</p>

			{isLoading || seedMutation.isPending ? (
				<div className="mt-10 flex flex-col items-center gap-3">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					<span className="text-sm text-muted-foreground">
						{t("onboarding.wizard.template.noTemplates")}
					</span>
				</div>
			) : (
				<>
					<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
						{templates.map((template: any) => {
							const isSelected = selectedTemplateId === template.id;
							const color = getTemplateColor(template);

							return (
								<button
									key={template.id}
									type="button"
									onClick={() => setSelectedTemplateId(template.id)}
									className={cn(
										"relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all",
										isSelected
											? "border-primary bg-primary/5 shadow-md"
											: "border-muted hover:border-primary/30",
									)}
								>
									{isSelected && (
										<div className="absolute top-3 left-3">
											<CheckCircle className="h-5 w-5 text-primary" />
										</div>
									)}

									{/* Mini template preview */}
									<div
										className="flex h-32 w-full flex-col rounded-lg border bg-white p-3"
										style={{ borderTopColor: color, borderTopWidth: "3px" }}
									>
										<div className="flex items-center justify-between">
											<div
												className="h-2 w-16 rounded"
												style={{ backgroundColor: color }}
											/>
											<div className="h-2 w-8 rounded bg-muted" />
										</div>
										<div className="mt-3 space-y-1.5">
											<div className="h-1.5 w-full rounded bg-muted/60" />
											<div className="h-1.5 w-3/4 rounded bg-muted/40" />
											<div className="h-1.5 w-5/6 rounded bg-muted/60" />
										</div>
										<div className="mt-auto flex justify-between">
											<div className="h-1.5 w-12 rounded bg-muted/40" />
											<div
												className="h-1.5 w-16 rounded"
												style={{ backgroundColor: color, opacity: 0.3 }}
											/>
										</div>
									</div>

									<span className="font-medium">{template.name}</span>

									{isSelected && (
										<span className="text-xs text-primary">
											{t("onboarding.wizard.template.selected")}
										</span>
									)}
								</button>
							);
						})}
					</div>

					<div className="mt-6 flex justify-end">
						<Button
							size="lg"
							onClick={handleContinue}
							disabled={!selectedTemplateId}
							loading={setDefaultMutation.isPending}
						>
							{t("onboarding.wizard.nav.next")}
						</Button>
					</div>
				</>
			)}
		</div>
	);
}

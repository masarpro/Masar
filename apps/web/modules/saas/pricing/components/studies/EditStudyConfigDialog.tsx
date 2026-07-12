"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { cn } from "@ui/lib";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
	GOALS,
	SCOPE_ITEMS,
	type NewStudyType,
} from "../../lib/study-create-config";

interface EditStudyConfigDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	studyId: string;
	organizationId: string;
	currentStudyType: string;
	currentWorkScopes: string[];
}

export function EditStudyConfigDialog({
	open,
	onOpenChange,
	studyId,
	organizationId,
	currentStudyType,
	currentWorkScopes,
}: EditStudyConfigDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [selectedType, setSelectedType] = useState<NewStudyType>(
		currentStudyType as NewStudyType,
	);
	const [scopes, setScopes] = useState<Record<string, boolean>>({
		STRUCTURAL: currentWorkScopes.includes("STRUCTURAL"),
		FINISHING: currentWorkScopes.includes("FINISHING"),
		MEP: currentWorkScopes.includes("MEP"),
		CUSTOM: currentWorkScopes.includes("CUSTOM"),
	});

	// Reset state when dialog opens
	useEffect(() => {
		if (open) {
			setSelectedType(currentStudyType as NewStudyType);
			setScopes({
				STRUCTURAL: currentWorkScopes.includes("STRUCTURAL"),
				FINISHING: currentWorkScopes.includes("FINISHING"),
				MEP: currentWorkScopes.includes("MEP"),
				CUSTOM: currentWorkScopes.includes("CUSTOM"),
			});
		}
	}, [open, currentStudyType, currentWorkScopes]);

	const selectedGoal = GOALS.find((g) => g.studyType === selectedType);
	const showScope = selectedGoal?.showScope ?? false;

	const updateMutation = useMutation(
		orpc.pricing.studies.updateConfig.mutationOptions({
			onSuccess: () => {
				toast.success(t("common.saved"));
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.studies.key(),
				});
				onOpenChange(false);
			},
			onError: () => {
				toast.error(t("common.error"));
			},
		}),
	);

	const handleSubmit = () => {
		const workScopes: string[] = [];
		if (showScope) {
			for (const [key, enabled] of Object.entries(scopes)) {
				if (enabled) workScopes.push(key);
			}
		}

		(updateMutation as any).mutate({
			studyId,
			organizationId,
			studyType: selectedType,
			workScopes,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="rounded-2xl sm:max-w-lg" dir="rtl">
				<DialogHeader className="text-start">
					<DialogTitle className="text-xl font-bold">
						{t("pricing.studies.create.editConfig")}
					</DialogTitle>
					<DialogDescription>
						{t("pricing.studies.create.selectGoalDescription")}
					</DialogDescription>
				</DialogHeader>

				{/* Study type selection */}
				<div className="space-y-3 py-2">
					{GOALS.map((goal) => {
						const Icon = goal.icon;
						const isSelected = selectedType === goal.studyType;

						return (
							<button
								key={goal.studyType}
								type="button"
								onClick={() => setSelectedType(goal.studyType)}
								className={cn(
									"w-full flex items-center gap-3 rounded-xl border-2 p-3 text-start transition-all",
									isSelected
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/30",
								)}
							>
								<div
									className={cn(
										"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
										isSelected
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground",
									)}
								>
									<Icon className="h-4 w-4" />
								</div>
								<div className="flex-1 min-w-0">
									<div className={cn("font-semibold text-sm", isSelected ? "text-primary" : "text-foreground")}>
										{t(`pricing.studies.create.goals.${goal.goalKey}.title`)}
									</div>
									<div className="text-xs text-muted-foreground">
										{t(`pricing.studies.create.goals.${goal.goalKey}.description`)}
									</div>
								</div>
							</button>
						);
					})}
				</div>

				{/* Scopes selection */}
				{showScope && (
					<div className="space-y-3 py-2">
						<p className="text-sm font-medium">{t("pricing.studies.create.selectScope")}</p>
						<div className="grid grid-cols-2 gap-2">
							{SCOPE_ITEMS.map((item) => (
								<label
									key={item.key}
									className={cn(
										"flex items-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all",
										scopes[item.key]
											? "border-primary bg-primary/5"
											: "border-border hover:border-primary/30",
									)}
								>
									<Checkbox
										checked={scopes[item.key]}
										onCheckedChange={(checked: any) =>
											setScopes({ ...scopes, [item.key]: !!checked })
										}
									/>
									<span className="text-sm">{item.icon}</span>
									<span className="text-sm font-medium">
										{t(item.labelKey)}
									</span>
								</label>
							))}
						</div>
					</div>
				)}

				<DialogFooter className="gap-2 pt-2 flex-row-reverse sm:flex-row-reverse">
					<Button
						onClick={handleSubmit}
						disabled={updateMutation.isPending}
						className="rounded-xl px-6 gap-2"
					>
						{updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
						{t("common.save")}
					</Button>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="rounded-xl px-6"
					>
						{t("common.cancel")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

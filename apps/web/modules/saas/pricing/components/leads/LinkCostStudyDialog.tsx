"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@ui/components/dialog";
import { Calculator, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface LinkCostStudyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	leadId: string;
	organizationId: string;
}

export function LinkCostStudyDialog({ open, onOpenChange, leadId, organizationId }: LinkCostStudyDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	// Fetch available cost studies
	const { data } = useQuery({
		...orpc.pricing.studies.list.queryOptions({
			input: { organizationId },
		}),
		enabled: open,
	});

	const linkMutation = useMutation(
		orpc.pricing.leads.linkCostStudy.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.leads.detail.activity.costStudyLinked"));
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.getById.queryOptions({ input: { organizationId, leadId } }).queryKey,
				});
				onOpenChange(false);
				setSelectedId(null);
			},
			onError: () => {
				toast.error(t("pricing.leads.detail.unlinkError"));
			},
		}),
	);

	const studies = data?.costStudies ?? [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md rounded-2xl">
				<DialogHeader>
					<DialogTitle>{t("pricing.leads.detail.linkCostStudy")}</DialogTitle>
				</DialogHeader>
				<div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
					{studies.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							{t("pricing.leads.detail.noStudiesAvailable")}
						</p>
					) : (
						studies.map((study: any) => (
							<button
								key={study.id}
								type="button"
								onClick={() => setSelectedId(study.id)}
								className={`w-full rounded-xl border-2 p-3 text-start transition-all ${
									selectedId === study.id
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/30"
								}`}
							>
								<div className="flex items-center gap-2">
									<Calculator className="h-4 w-4 text-primary shrink-0" />
									<div className="min-w-0">
										<p className="text-sm font-medium truncate">{study.name || "\u2014"}</p>
										<p className="text-xs text-muted-foreground">
											{new Intl.NumberFormat("en-SA").format(Number(study.totalCost || 0))} ر.س
										</p>
									</div>
								</div>
							</button>
						))
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
						{t("pricing.leads.form.cancel")}
					</Button>
					<Button
						className="rounded-xl"
						onClick={() => selectedId && linkMutation.mutate({ organizationId, leadId, costStudyId: selectedId })}
						disabled={!selectedId || linkMutation.isPending}
					>
						{linkMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
						{t("pricing.leads.detail.link")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

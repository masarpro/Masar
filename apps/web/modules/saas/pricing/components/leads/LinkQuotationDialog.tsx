"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@ui/components/dialog";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface LinkQuotationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	leadId: string;
	organizationId: string;
}

export function LinkQuotationDialog({ open, onOpenChange, leadId, organizationId }: LinkQuotationDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	// Fetch available quotations
	const { data } = useQuery({
		...orpc.pricing.quotations.list.queryOptions({
			input: { organizationId },
		}),
		enabled: open,
	});

	const linkMutation = useMutation(
		orpc.pricing.leads.linkQuotation.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.leads.detail.activity.quotationLinked"));
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

	const quotations = data?.quotations ?? [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md rounded-2xl">
				<DialogHeader>
					<DialogTitle>{t("pricing.leads.detail.linkQuotation")}</DialogTitle>
				</DialogHeader>
				<div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
					{quotations.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							{t("pricing.leads.detail.noQuotationsAvailable")}
						</p>
					) : (
						quotations.map((q: any) => (
							<button
								key={q.id}
								type="button"
								onClick={() => setSelectedId(q.id)}
								className={`w-full rounded-xl border-2 p-3 text-start transition-all ${
									selectedId === q.id
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/30"
								}`}
							>
								<div className="flex items-center gap-2">
									<FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
									<div className="min-w-0">
										<p className="text-sm font-medium truncate">
											{q.quotationNo || t("pricing.leads.detail.quotation")}
										</p>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span>{new Intl.NumberFormat("en-SA").format(Number(q.totalAmount || 0))} ر.س</span>
											{q.status && (
												<span className="inline-flex rounded-md bg-muted/50 px-2 py-0.5 text-xs font-medium">
													{q.status}
												</span>
											)}
										</div>
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
						onClick={() => selectedId && linkMutation.mutate({ organizationId, leadId, quotationId: selectedId })}
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

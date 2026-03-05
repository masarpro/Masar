"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUSES = ["NEW", "STUDYING", "QUOTED", "NEGOTIATING", "WON", "LOST"] as const;

interface UpdateLeadStatusDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	leadId: string;
	organizationId: string;
	currentStatus: string;
}

export function UpdateLeadStatusDialog({
	open,
	onOpenChange,
	leadId,
	organizationId,
	currentStatus,
}: UpdateLeadStatusDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [status, setStatus] = useState(currentStatus);
	const [lostReason, setLostReason] = useState("");

	useEffect(() => {
		if (open) {
			setStatus(currentStatus);
			setLostReason("");
		}
	}, [open, currentStatus]);

	const mutation = useMutation(
		orpc.pricing.leads.updateStatus.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.leads.detail.statusUpdated"));
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.getById.queryOptions({ input: { organizationId, leadId } }).queryKey,
				});
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.list.queryOptions({ input: { organizationId } }).queryKey,
				});
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.getStats.queryOptions({ input: { organizationId } }).queryKey,
				});
				onOpenChange(false);
			},
			onError: () => {
				toast.error(t("pricing.leads.detail.statusUpdateError"));
			},
		}),
	);

	const handleSubmit = () => {
		if (status === currentStatus) {
			onOpenChange(false);
			return;
		}
		if (status === "LOST" && !lostReason.trim()) {
			toast.error(t("pricing.leads.detail.lostReasonRequired"));
			return;
		}
		mutation.mutate({
			organizationId,
			leadId,
			status: status as any,
			lostReason: status === "LOST" ? lostReason.trim() : undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md rounded-2xl">
				<DialogHeader>
					<DialogTitle>{t("pricing.leads.detail.changeStatus")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div>
						<Label>{t("pricing.leads.detail.newStatus")}</Label>
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger className="mt-1.5 rounded-xl">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										{t(`pricing.leads.status.${s}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{status === "LOST" && (
						<div>
							<Label>{t("pricing.leads.detail.lostReason")} *</Label>
							<Textarea
								value={lostReason}
								onChange={(e) => setLostReason(e.target.value)}
								placeholder={t("pricing.leads.detail.lostReasonPlaceholder")}
								className="mt-1.5 rounded-xl"
								rows={3}
							/>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						className="rounded-xl"
						onClick={() => onOpenChange(false)}
					>
						{t("pricing.leads.form.cancel")}
					</Button>
					<Button
						className="rounded-xl"
						onClick={handleSubmit}
						disabled={mutation.isPending || status === currentStatus}
					>
						{mutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
						{t("pricing.leads.detail.updateStatus")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

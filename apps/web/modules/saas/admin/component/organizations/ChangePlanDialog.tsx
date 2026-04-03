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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function ChangePlanDialog({
	open,
	onOpenChange,
	organizationId,
	currentPlan,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	currentPlan: string;
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [plan, setPlan] = useState(currentPlan);
	const [reason, setReason] = useState("");

	const mutation = useMutation({
		mutationFn: (input: {
			organizationId: string;
			plan: "FREE" | "PRO";
			reason?: string;
		}) =>
			orpc.superAdmin.organizations.changePlan.call(input),
		onSuccess: () => {
			toast.success(t("admin.organizations.planChanged"));
			queryClient.invalidateQueries({
				queryKey: orpc.superAdmin.organizations.list.key(),
			});
			onOpenChange(false);
		},
		onError: () => {
			toast.error(t("admin.organizations.planChangeFailed"));
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("admin.organizations.changePlan")}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>{t("admin.organizations.selectPlan")}</Label>
						<Select value={plan} onValueChange={setPlan}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="FREE">Free</SelectItem>
								<SelectItem value="PRO">Pro</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>{t("admin.organizations.reason")}</Label>
						<Textarea
							value={reason}
							onChange={(e: any) => setReason(e.target.value)}
							placeholder={t(
								"admin.organizations.reasonPlaceholder",
							)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t("common.cancel")}
					</Button>
					<Button
						onClick={() =>
							mutation.mutate({
								organizationId,
								plan: plan as "FREE" | "PRO",
								reason: reason || undefined,
							})
						}
						disabled={mutation.isPending || plan === currentPlan}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

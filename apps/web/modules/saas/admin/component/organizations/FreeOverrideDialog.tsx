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
import { Switch } from "@ui/components/switch";
import { Textarea } from "@ui/components/textarea";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function FreeOverrideDialog({
	open,
	onOpenChange,
	organizationId,
	currentOverride,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	currentOverride: boolean;
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [isFreeOverride, setIsFreeOverride] = useState(currentOverride);
	const [reason, setReason] = useState("");

	const mutation = useMutation({
		mutationFn: (input: {
			organizationId: string;
			isFreeOverride: boolean;
			reason: string;
		}) =>
			orpc.superAdmin.organizations.setFreeOverride.call(input),
		onSuccess: () => {
			toast.success(t("admin.organizations.overrideUpdated"));
			queryClient.invalidateQueries({
				queryKey: orpc.superAdmin.organizations.list.key(),
			});
			onOpenChange(false);
		},
		onError: () => {
			toast.error(t("admin.organizations.overrideFailed"));
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("admin.organizations.freeOverride")}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="flex items-center justify-between">
						<Label>
							{t("admin.organizations.enableFreeOverride")}
						</Label>
						<Switch
							checked={isFreeOverride}
							onCheckedChange={setIsFreeOverride}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("admin.organizations.reason")}</Label>
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t(
								"admin.organizations.overrideReasonPlaceholder",
							)}
							required
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
								isFreeOverride,
								reason,
							})
						}
						disabled={mutation.isPending || !reason.trim()}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

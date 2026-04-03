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
import { Textarea } from "@ui/components/textarea";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function SuspendOrgDialog({
	open,
	onOpenChange,
	organizationId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState("");

	const mutation = useMutation({
		mutationFn: (input: { organizationId: string; reason: string }) =>
			orpc.superAdmin.organizations.suspend.call(input),
		onSuccess: () => {
			toast.success(t("admin.organizations.suspended"));
			queryClient.invalidateQueries({
				queryKey: orpc.superAdmin.organizations.list.key(),
			});
			onOpenChange(false);
		},
		onError: () => {
			toast.error(t("admin.organizations.suspendFailed"));
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("admin.organizations.suspendOrg")}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>{t("admin.organizations.reason")}</Label>
						<Textarea
							value={reason}
							onChange={(e: any) => setReason(e.target.value)}
							placeholder={t(
								"admin.organizations.suspendReasonPlaceholder",
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
						variant="error"
						onClick={() =>
							mutation.mutate({ organizationId, reason })
						}
						disabled={mutation.isPending || !reason.trim()}
					>
						{t("admin.organizations.suspend")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

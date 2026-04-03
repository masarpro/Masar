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
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function UpdateLimitsDialog({
	open,
	onOpenChange,
	organizationId,
	currentLimits,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	currentLimits: {
		maxUsers: number;
		maxProjects: number;
		maxStorage: number;
	};
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [maxUsers, setMaxUsers] = useState(currentLimits.maxUsers);
	const [maxProjects, setMaxProjects] = useState(currentLimits.maxProjects);
	const [maxStorage, setMaxStorage] = useState(currentLimits.maxStorage);

	const mutation = useMutation({
		mutationFn: (input: {
			organizationId: string;
			maxUsers?: number;
			maxProjects?: number;
			maxStorage?: number;
		}) =>
			orpc.superAdmin.organizations.updateLimits.call(input),
		onSuccess: () => {
			toast.success(t("admin.organizations.limitsUpdated"));
			queryClient.invalidateQueries({
				queryKey: orpc.superAdmin.organizations.list.key(),
			});
			onOpenChange(false);
		},
		onError: () => {
			toast.error(t("admin.organizations.limitsUpdateFailed"));
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("admin.organizations.updateLimits")}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>{t("admin.organizations.maxUsers")}</Label>
						<Input
							type="number"
							min={1}
							value={maxUsers}
							onChange={(e: any) =>
								setMaxUsers(Number(e.target.value))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("admin.organizations.maxProjects")}</Label>
						<Input
							type="number"
							min={1}
							value={maxProjects}
							onChange={(e: any) =>
								setMaxProjects(Number(e.target.value))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>
							{t("admin.organizations.maxStorage")} (GB)
						</Label>
						<Input
							type="number"
							min={1}
							value={maxStorage}
							onChange={(e: any) =>
								setMaxStorage(Number(e.target.value))
							}
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
								maxUsers,
								maxProjects,
								maxStorage,
							})
						}
						disabled={mutation.isPending}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

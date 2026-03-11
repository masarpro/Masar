"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { FolderKanban, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface ConvertToProjectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	leadId: string;
	leadName: string;
	organizationId: string;
	organizationSlug: string;
}

export function ConvertToProjectDialog({
	open,
	onOpenChange,
	leadId,
	leadName,
	organizationId,
	organizationSlug,
}: ConvertToProjectDialogProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [projectName, setProjectName] = useState(`${leadName} - مشروع`);

	const convertMutation = useMutation(
		orpc.pricing.leads.convertToProject.mutationOptions({
			onSuccess: (data: any) => {
				toast.success(t("pricing.leads.messages.convertSuccess"));
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
				router.push(`/app/${organizationSlug}/projects/${data.slug}`);
			},
			onError: (error: any) => {
				const msg = error?.message || error?.data?.message;
				toast.error(msg || t("pricing.leads.messages.convertError"));
			},
		}),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md rounded-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FolderKanban className="h-5 w-5 text-primary" />
						{t("pricing.leads.detail.convertToProject")}
					</DialogTitle>
					<DialogDescription>
						{t("pricing.leads.detail.convertDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div>
						<Label htmlFor="projectName">{t("pricing.leads.detail.projectName")}</Label>
						<Input
							id="projectName"
							value={projectName}
							onChange={(e: any) => setProjectName(e.target.value)}
							className="mt-1.5 rounded-xl"
						/>
					</div>
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
						onClick={() =>
							(convertMutation as any).mutate({
								organizationId,
								leadId,
								projectName: projectName.trim() || undefined,
							})
						}
						disabled={convertMutation.isPending}
					>
						{convertMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
						{t("pricing.leads.detail.convertToProject")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

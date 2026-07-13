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
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const FOLDER_COLORS = [
	{ key: "slate", swatch: "bg-muted" },
	{ key: "blue", swatch: "bg-chart-4" },
	{ key: "purple", swatch: "bg-chart-4" },
	{ key: "green", swatch: "bg-success" },
	{ key: "amber", swatch: "bg-chart-1" },
	{ key: "pink", swatch: "bg-pink-500" },
	{ key: "cyan", swatch: "bg-chart-4" },
	{ key: "red", swatch: "bg-destructive" },
];

interface FolderFormDialogProps {
	organizationId: string;
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** عند التمرير = وضع التعديل */
	folder?: { id: string; name: string; color?: string | null } | null;
}

export function FolderFormDialog({
	organizationId,
	projectId,
	open,
	onOpenChange,
	folder,
}: FolderFormDialogProps) {
	const t = useTranslations("projects.documents");
	const tCommon = useTranslations("common");
	const queryClient = useQueryClient();
	const isEdit = !!folder;

	const [name, setName] = useState("");
	const [color, setColor] = useState<string>("slate");

	useEffect(() => {
		if (open) {
			setName(folder?.name ?? "");
			setColor(folder?.color ?? "slate");
		}
	}, [open, folder]);

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: [["projectDocuments", "listFolders"]] });
	};

	const createMutation = useMutation(
		orpc.projectDocuments.createFolder.mutationOptions({
			onSuccess: () => {
				toast.success(t("folderCreated"));
				invalidate();
				onOpenChange(false);
			},
			onError: (error: any) => toast.error(error.message || t("folderSaveError")),
		}),
	);

	const renameMutation = useMutation(
		orpc.projectDocuments.renameFolder.mutationOptions({
			onSuccess: () => {
				toast.success(t("folderRenamed"));
				invalidate();
				onOpenChange(false);
			},
			onError: (error: any) => toast.error(error.message || t("folderSaveError")),
		}),
	);

	const isPending = createMutation.isPending || renameMutation.isPending;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			toast.error(t("folderNameRequired"));
			return;
		}
		if (isEdit && folder) {
			renameMutation.mutate({ organizationId, projectId, folderId: folder.id, name: trimmed, color });
		} else {
			createMutation.mutate({ organizationId, projectId, name: trimmed, color });
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEdit ? t("renameFolder") : t("newFolder")}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="folder-name">{t("folderName")}</Label>
						<Input
							id="folder-name"
							value={name}
							onChange={(e: any) => setName(e.target.value)}
							placeholder={t("folderNamePlaceholder")}
							className="rounded-xl"
							autoFocus
							maxLength={100}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("folderColor")}</Label>
						<div className="flex flex-wrap gap-2">
							{FOLDER_COLORS.map((c) => (
								<button
									key={c.key}
									type="button"
									onClick={() => setColor(c.key)}
									aria-label={c.key}
									className={cn(
										"h-8 w-8 rounded-full transition-transform",
										c.swatch,
										color === c.key
											? "ring-2 ring-offset-2 ring-primary scale-110 ring-offset-background"
											: "hover:scale-105",
									)}
								/>
							))}
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							className="rounded-xl"
							onClick={() => onOpenChange(false)}
						>
							{tCommon("cancel")}
						</Button>
						<Button type="submit" className="rounded-xl" disabled={isPending}>
							{isPending ? tCommon("saving") : tCommon("save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

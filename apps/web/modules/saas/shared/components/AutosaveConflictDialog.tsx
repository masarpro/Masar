"use client";

import { useTranslations } from "next-intl";
import { CircleAlert } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";

interface AutosaveConflictDialogProps {
	open: boolean;
	onReload: () => void;
	onOverwrite: () => void;
}

export function AutosaveConflictDialog({
	open,
	onReload,
	onOverwrite,
}: AutosaveConflictDialogProps) {
	const t = useTranslations();

	return (
		<Dialog open={open} onOpenChange={() => {}}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-chart-1">
						<CircleAlert className="h-5 w-5" />
						{t("autosave.conflictTitle")}
					</DialogTitle>
					<DialogDescription className="text-start pt-2">
						{t("autosave.conflictMessage")}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-2">
					<Button type="button" variant="outline" onClick={onOverwrite}>
						{t("autosave.conflictOverwrite")}
					</Button>
					<Button type="button" onClick={onReload}>
						{t("autosave.conflictReload")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { CheckIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface Baseline {
	id: string;
	name: string;
	createdAt: string;
	isActive: boolean;
}

interface BaselineManagementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	baselines: Baseline[];
	onCreate: (name: string) => void;
	onActivate: (id: string) => void;
	onDelete: (id: string) => void;
	isLoading?: boolean;
}

export function BaselineManagementDialog({
	open,
	onOpenChange,
	baselines,
	onCreate,
	onActivate,
	onDelete,
	isLoading,
}: BaselineManagementDialogProps) {
	const t = useTranslations();
	const [newName, setNewName] = useState("");

	const handleCreate = () => {
		if (newName.trim()) {
			onCreate(newName.trim());
			setNewName("");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{t("execution.advanced.baseline.title")}
					</DialogTitle>
					<DialogDescription>
						{t("execution.advanced.baseline.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Create new baseline */}
					<div className="flex gap-2">
						<Input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder={t(
								"execution.advanced.baseline.namePlaceholder",
							)}
							onKeyDown={(e) => e.key === "Enter" && handleCreate()}
						/>
						<Button
							size="sm"
							onClick={handleCreate}
							disabled={!newName.trim() || isLoading}
						>
							<PlusIcon className="h-4 w-4 me-1" />
							{t("execution.advanced.baseline.createNew")}
						</Button>
					</div>

					{/* Baselines list */}
					{baselines.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-6">
							{t("execution.advanced.baseline.noBaselines")}
						</p>
					) : (
						<div className="space-y-2 max-h-[300px] overflow-y-auto">
							{baselines.map((baseline) => (
								<div
									key={baseline.id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">
											{baseline.name}
										</span>
										{baseline.isActive && (
											<Badge variant="secondary" className="text-[10px]">
												{t("execution.advanced.baseline.active")}
											</Badge>
										)}
									</div>
									<div className="flex items-center gap-1">
										<span className="text-xs text-muted-foreground me-2">
											{new Date(baseline.createdAt).toLocaleDateString("ar-SA")}
										</span>
										{!baseline.isActive && (
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7"
												onClick={() => onActivate(baseline.id)}
												title={t("execution.advanced.baseline.activate")}
											>
												<CheckIcon className="h-3.5 w-3.5" />
											</Button>
										)}
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-destructive"
											onClick={() => onDelete(baseline.id)}
											title={t("execution.advanced.baseline.delete")}
										>
											<TrashIcon className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

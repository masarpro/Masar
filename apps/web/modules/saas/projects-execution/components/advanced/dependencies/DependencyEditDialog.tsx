"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useTranslations } from "next-intl";
import type { DependencyType, GanttDependency } from "../../../lib/gantt-types";

interface DependencyEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	dependency: GanttDependency | null;
	onSave: (id: string, type: DependencyType, lag: number) => void;
}

const DEPENDENCY_TYPES: DependencyType[] = [
	"FINISH_TO_START",
	"START_TO_START",
	"FINISH_TO_FINISH",
	"START_TO_FINISH",
];

export function DependencyEditDialog({
	open,
	onOpenChange,
	dependency,
	onSave,
}: DependencyEditDialogProps) {
	const t = useTranslations();
	const [type, setType] = useState<DependencyType>(
		dependency?.type ?? "FINISH_TO_START",
	);
	const [lag, setLag] = useState(dependency?.lag ?? 0);

	const handleSave = () => {
		if (!dependency) return;
		onSave(dependency.id, type, lag);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("execution.advanced.dependency.editTitle")}
					</DialogTitle>
					<DialogDescription>
						{t("execution.advanced.dependency.editDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>{t("execution.dependency.type")}</Label>
						<Select
							value={type}
							onValueChange={(v) => setType(v as DependencyType)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{DEPENDENCY_TYPES.map((dt) => (
									<SelectItem key={dt} value={dt}>
										{t(`execution.dependency.types.${dt}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("execution.dependency.lagDays")}</Label>
						<Input
							type="number"
							value={lag}
							onChange={(e) => setLag(Number(e.target.value))}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("execution.advanced.dependency.cancel")}
					</Button>
					<Button onClick={handleSave}>
						{t("execution.advanced.dependency.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

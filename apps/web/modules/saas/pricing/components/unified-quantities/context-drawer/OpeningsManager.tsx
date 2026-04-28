"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ContextOpening } from "../hooks/useContext";
import { OpeningFormDialog } from "./OpeningFormDialog";

interface Props {
	costStudyId: string;
	organizationId: string;
	openings: ContextOpening[];
	onUpsert: (input: Record<string, unknown>) => Promise<unknown>;
	onDelete: (input: { id: string; organizationId: string }) => Promise<unknown>;
}

const TYPE_LABEL: Record<string, string> = {
	door: "باب",
	window: "نافذة",
	arch: "قوس",
	skylight: "سكاي لايت",
	custom: "مخصّص",
};

const fmt = (n: unknown) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n ?? 0));

export function OpeningsManager({
	costStudyId,
	organizationId,
	openings,
	onUpsert,
	onDelete,
}: Props) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<ContextOpening | null>(null);

	const handleAdd = () => {
		setEditing(null);
		setDialogOpen(true);
	};
	const handleEdit = (op: ContextOpening) => {
		setEditing(op);
		setDialogOpen(true);
	};

	const totalArea = openings.reduce(
		(sum, o) => sum + Number(o.computedArea ?? 0) * o.count,
		0,
	);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div>
					<h4 className="text-sm font-semibold">
						الفتحات ({openings.length})
					</h4>
					<p className="text-xs text-muted-foreground">
						إجمالي المساحة:{" "}
						<span className="tabular-nums">{fmt(totalArea)}</span> م²
					</p>
				</div>
				<Button size="sm" onClick={handleAdd}>
					<Plus className="me-2 h-4 w-4" />
					إضافة فتحة
				</Button>
			</div>

			{openings.length === 0 ? (
				<Card className="p-6 text-center text-sm text-muted-foreground">
					لا توجد فتحات بعد.
				</Card>
			) : (
				<div className="space-y-2">
					{openings.map((o) => (
						<Card
							key={o.id}
							className="flex items-center justify-between gap-3 p-3"
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<p className="font-medium">{o.name}</p>
									<span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
										{TYPE_LABEL[o.openingType] ?? o.openingType}
									</span>
									{o.isExterior && (
										<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
											خارجية
										</span>
									)}
									{!o.deductFromInteriorFinishes && (
										<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
											بلا خصم داخلي
										</span>
									)}
								</div>
								<p className="text-xs text-muted-foreground tabular-nums">
									{fmt(o.width)} × {fmt(o.height)} م × {o.count} ={" "}
									{fmt(Number(o.computedArea) * o.count)} م²
								</p>
							</div>
							<div className="flex flex-shrink-0 gap-1">
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleEdit(o)}
								>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										onDelete({ id: o.id, organizationId })
									}
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}

			<OpeningFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				costStudyId={costStudyId}
				organizationId={organizationId}
				opening={editing}
				onSave={onUpsert}
			/>
		</div>
	);
}

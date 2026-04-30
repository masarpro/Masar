"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ContextSpace } from "../hooks/useContext";
import { SpaceFormDialog } from "./SpaceFormDialog";

interface Props {
	costStudyId: string;
	organizationId: string;
	spaces: ContextSpace[];
	onUpsert: (input: Record<string, unknown>) => Promise<unknown>;
	onDelete: (input: { id: string; organizationId: string }) => Promise<unknown>;
}

const fmt = (n: unknown) =>
	n != null
		? new Intl.NumberFormat("en-US", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(Number(n))
		: "—";

export function SpacesManager({
	costStudyId,
	organizationId,
	spaces,
	onUpsert,
	onDelete,
}: Props) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<ContextSpace | null>(null);

	const handleAdd = () => {
		setEditing(null);
		setDialogOpen(true);
	};
	const handleEdit = (space: ContextSpace) => {
		setEditing(space);
		setDialogOpen(true);
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div>
					<h4 className="text-sm font-semibold">الغرف ({spaces.length})</h4>
					<p className="text-xs text-muted-foreground">
						حدّد الغرف الرطبة (مطبخ/حمام) للاستفادة من خصم MINUS_WET_AREAS
					</p>
				</div>
				<Button size="sm" onClick={handleAdd}>
					<Plus className="me-2 h-4 w-4" />
					إضافة غرفة
				</Button>
			</div>

			{spaces.length === 0 ? (
				<Card className="p-6 text-center text-sm text-muted-foreground">
					لا توجد غرف بعد. اضغط "إضافة غرفة".
				</Card>
			) : (
				<div className="space-y-2">
					{spaces.map((s) => (
						<Card
							key={s.id}
							className="flex items-center justify-between gap-3 p-3"
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<p className="font-medium">{s.name}</p>
									{s.isWetArea && (
										<span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
											رطبة
										</span>
									)}
									{s.isExterior && (
										<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
											خارجية
										</span>
									)}
								</div>
								<p className="text-xs text-muted-foreground tabular-nums">
									{s.floorLabel ? `${s.floorLabel} · ` : ""}
									{fmt(s.length)} × {fmt(s.width)} × {fmt(s.height)} م ·
									الأرضية {fmt(s.computedFloorArea)} م²
								</p>
							</div>
							<div className="flex flex-shrink-0 gap-1">
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleEdit(s)}
								>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										onDelete({ id: s.id, organizationId })
									}
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}

			<SpaceFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				costStudyId={costStudyId}
				organizationId={organizationId}
				space={editing}
				onSave={onUpsert}
			/>
		</div>
	);
}

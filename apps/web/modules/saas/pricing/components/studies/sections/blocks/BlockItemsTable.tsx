"use client";

import { Button } from "@ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber } from "../../../../lib/utils";
import type { BlockItemsTableProps } from "./types";

export function BlockItemsTable({ items, onEdit, onDelete, isDeletePending }: BlockItemsTableProps) {
	const t = useTranslations();

	return (
		<div className="border rounded-lg overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="text-right">{t("pricing.studies.structural.itemName")}</TableHead>
						<TableHead className="text-right">{t("pricing.studies.area")}</TableHead>
						<TableHead className="text-right">{t("pricing.studies.structural.thickness")}</TableHead>
						<TableHead className="text-right">{t("pricing.studies.structural.quantity")}</TableHead>
						<TableHead className="w-12"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item) => (
						<TableRow key={item.id}>
							<TableCell className="font-medium">{item.name}</TableCell>
							<TableCell>
								{formatNumber(
									(item.dimensions?.length || 0) * (item.dimensions?.height || 0)
								)}{" "}
								{t("pricing.studies.units.m2")}
							</TableCell>
							<TableCell>
								{item.dimensions?.thickness || 0} {t("pricing.studies.units.cm")}
							</TableCell>
							<TableCell>
								{item.quantity} {t("pricing.studies.units.piece")}
							</TableCell>
							<TableCell>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											onEdit(
												item.id,
												String(item.dimensions?.wallCategory || ""),
												String(item.dimensions?.floor || ""),
												""
											);
										}}
										title={t("common.edit")}
									>
										<Pencil className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onDelete(item.id)}
										disabled={isDeletePending}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

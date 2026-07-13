"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Edit,
	FileText,
	Plus,
	Trash2,
} from "lucide-react";
import { CO_STATUS_STYLES, formatCurrency } from "./subcontract-shared";

interface ChangeOrder {
	id: string;
	orderNo: number;
	description: string;
	amount: number;
	status: string;
	[key: string]: unknown;
}

export interface SubcontractChangeOrdersSectionProps {
	changeOrders: ChangeOrder[] | null | undefined;
	onAdd: () => void;
	onEdit: (co: ChangeOrder) => void;
	onDelete: (changeOrderId: string) => void;
}

export const SubcontractChangeOrdersSection = React.memo(function SubcontractChangeOrdersSection({
	changeOrders,
	onAdd,
	onEdit,
	onDelete,
}: SubcontractChangeOrdersSectionProps) {
	const t = useTranslations();

	return (
		<div className="overflow-hidden rounded-2xl border border-chart-1 bg-white dark:border-chart-1 dark:bg-muted">
			<div className="flex items-center justify-between border-b border-chart-1 p-5 dark:border-chart-1">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-chart-1/20 p-2 dark:bg-chart-1/25">
						<FileText className="h-5 w-5 text-chart-1 dark:text-chart-1" />
					</div>
					<h2 className="font-semibold text-chart-1 dark:text-chart-1">
						{t("subcontracts.detail.changeOrdersSection")}
					</h2>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="rounded-xl border-chart-1 text-chart-1 hover:bg-chart-1/20 dark:border-chart-1 dark:text-chart-1"
					onClick={onAdd}
				>
					<Plus className="me-1 h-4 w-4" />
					{t("subcontracts.detail.addChangeOrder")}
				</Button>
			</div>
			<div className="p-4">
				{!changeOrders || changeOrders.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						{t("subcontracts.detail.noChangeOrders")}
					</p>
				) : (
					<div className="space-y-2">
						{changeOrders.map((co) => {
							const coStyle = CO_STATUS_STYLES[co.status] ?? CO_STATUS_STYLES.DRAFT;
							return (
								<div
									key={co.id}
									className="flex items-center justify-between rounded-xl bg-muted p-3 dark:bg-muted"
								>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<span className="text-xs font-medium text-muted-foreground">#{co.orderNo}</span>
											<Badge className={`border-0 text-[10px] ${coStyle.bg} ${coStyle.text}`}>
												{t(`subcontracts.detail.coStatus.${co.status}`)}
											</Badge>
										</div>
										<p className="mt-0.5 text-sm text-muted-foreground dark:text-muted-foreground">
											{co.description}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<span className={`font-semibold ${co.amount >= 0 ? "text-chart-4" : "text-destructive"}`}>
											{co.amount >= 0 ? "+" : ""}
											{formatCurrency(co.amount)}
										</span>
										<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(co)}>
											<Edit className="h-3 w-3" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-destructive hover:text-destructive"
											onClick={() => onDelete(co.id)}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
});

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
		<div className="overflow-hidden rounded-2xl border border-amber-200/50 bg-white dark:border-amber-800/30 dark:bg-slate-900/50">
			<div className="flex items-center justify-between border-b border-amber-100 p-5 dark:border-amber-800/30">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
						<FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</div>
					<h2 className="font-semibold text-amber-700 dark:text-amber-300">
						{t("subcontracts.detail.changeOrdersSection")}
					</h2>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
					onClick={onAdd}
				>
					<Plus className="me-1 h-4 w-4" />
					{t("subcontracts.detail.addChangeOrder")}
				</Button>
			</div>
			<div className="p-4">
				{!changeOrders || changeOrders.length === 0 ? (
					<p className="py-6 text-center text-sm text-slate-500">
						{t("subcontracts.detail.noChangeOrders")}
					</p>
				) : (
					<div className="space-y-2">
						{changeOrders.map((co) => {
							const coStyle = CO_STATUS_STYLES[co.status] ?? CO_STATUS_STYLES.DRAFT;
							return (
								<div
									key={co.id}
									className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
								>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<span className="text-xs font-medium text-slate-500">#{co.orderNo}</span>
											<Badge className={`border-0 text-[10px] ${coStyle.bg} ${coStyle.text}`}>
												{t(`subcontracts.detail.coStatus.${co.status}`)}
											</Badge>
										</div>
										<p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
											{co.description}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<span className={`font-semibold ${co.amount >= 0 ? "text-sky-600" : "text-red-600"}`}>
											{co.amount >= 0 ? "+" : ""}
											{formatCurrency(co.amount)}
										</span>
										<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(co)}>
											<Edit className="h-3 w-3" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-red-500 hover:text-red-600"
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

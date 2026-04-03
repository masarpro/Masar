"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Play, Pause, Trash2, RefreshCw } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting } from "./formatters";
import { toast } from "sonner";

interface RecurringJournalTemplatesProps {
	organizationId: string;
	organizationSlug: string;
}

export function RecurringJournalTemplates({
	organizationId,
}: RecurringJournalTemplatesProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const { data: templates, isLoading } = useQuery(
		orpc.accounting.recurring.list.queryOptions({
			input: { organizationId },
		}),
	);

	const generateMutation = useMutation(
		orpc.accounting.recurring.generate.mutationOptions({
			onSuccess: (result: any) => {
				queryClient.invalidateQueries({ queryKey: ["orpc", "accounting"] });
				if (result.generated === 0) {
					toast.info(t("finance.accounting.recurring.noTemplatesDue"));
				} else {
					toast.success(t("finance.accounting.recurring.generatedSuccess", { count: result.generated }));
				}
			},
			onError: () => toast.error(t("common.error")),
		}),
	);

	const toggleMutation = useMutation(
		orpc.accounting.recurring.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["orpc", "accounting"] });
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.accounting.recurring.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["orpc", "accounting"] });
				toast.success(t("common.deleted"));
			},
		}),
	);

	if (isLoading) return <DashboardSkeleton />;

	const dueCount = (templates ?? []).filter((t: any) =>
		t.isActive && t.nextDueDate && new Date(t.nextDueDate) <= new Date(),
	).length;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-bold">{t("finance.accounting.recurring.title")}</h3>
				<Button
					size="sm"
					className="rounded-xl"
					onClick={() => generateMutation.mutate({ organizationId })}
					disabled={generateMutation.isPending}
				>
					<RefreshCw className={`h-4 w-4 me-1 ${generateMutation.isPending ? "animate-spin" : ""}`} />
					{t("finance.accounting.recurring.generate")}
					{dueCount > 0 && (
						<Badge variant="destructive" className="ms-1 text-[10px] px-1.5">{dueCount}</Badge>
					)}
				</Button>
			</div>

			{/* Templates Table */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{(!templates || templates.length === 0) ? (
						<div className="text-center py-12 text-slate-500">
							{t("finance.accounting.recurring.noTemplates")}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.accounting.description")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.amount")}</TableHead>
									<TableHead>{t("finance.accounting.recurring.frequency")}</TableHead>
									<TableHead>{t("finance.accounting.recurring.nextDue")}</TableHead>
									<TableHead className="text-center">{t("finance.accounting.isActive")}</TableHead>
									<TableHead className="w-20" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{templates.map((template: any) => {
									const isDue = template.isActive && template.nextDueDate && new Date(template.nextDueDate) <= new Date();
									return (
										<TableRow key={template.id}>
											<TableCell className="text-sm">{template.description}</TableCell>
											<TableCell className="text-end font-medium">{formatAccounting(template.totalAmount)}</TableCell>
											<TableCell>
												<Badge variant="outline" className="text-[10px]">
													{t(`finance.accounting.frequency.${template.frequency}`)}
												</Badge>
											</TableCell>
											<TableCell className="text-sm">
												{template.nextDueDate ? (
													<span className={isDue ? "text-red-600 font-medium" : "text-slate-500"}>
														{new Date(template.nextDueDate).toLocaleDateString("en-SA")}
														{isDue && " ⏰"}
													</span>
												) : "—"}
											</TableCell>
											<TableCell className="text-center">
												<Badge variant={template.isActive ? "default" : "secondary"} className="text-[10px]">
													{template.isActive ? t("finance.accounting.recurring.active") : t("finance.accounting.recurring.inactive")}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex gap-1">
													<Button
														variant="ghost"
														size="sm"
														className="h-7 w-7 p-0"
														onClick={() => toggleMutation.mutate({
															organizationId, id: template.id, isActive: !template.isActive,
														})}
													>
														{template.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
														onClick={() => {
															if (confirm(t("finance.accounting.confirmDelete"))) {
																deleteMutation.mutate({ organizationId, id: template.id });
															}
														}}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

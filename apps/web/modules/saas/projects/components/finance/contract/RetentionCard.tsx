"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface RetentionData {
	value: number;
	retentionPercent?: number | null;
	retentionCap?: number | null;
	retentionReleaseDays?: number | null;
}

interface RetentionCardProps {
	organizationId: string;
	projectId: string;
	data: RetentionData | null;
	retentionAmount: number;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function RetentionCard({
	organizationId,
	projectId,
	data,
	retentionAmount,
}: RetentionCardProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [retentionPercent, setRetentionPercent] = useState(
		data?.retentionPercent?.toString() ?? "",
	);
	const [retentionCap, setRetentionCap] = useState(
		data?.retentionCap?.toString() ?? "",
	);
	const [retentionReleaseDays, setRetentionReleaseDays] = useState(
		data?.retentionReleaseDays?.toString() ?? "",
	);

	const { mutate: upsert, isPending } = useMutation({
		...orpc.projectContract.upsert.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.contract.saved"));
			queryClient.invalidateQueries({
				queryKey: orpc.projectContract.get.queryOptions({
					input: { organizationId, projectId },
				}).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.projectContract.getSummary.queryOptions({
					input: { organizationId, projectId },
				}).queryKey,
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleSave = () => {
		if (!data) return;
		upsert({
			organizationId,
			projectId,
			value: data.value,
			retentionPercent: retentionPercent
				? Number.parseFloat(retentionPercent)
				: null,
			retentionCap: retentionCap
				? Number.parseFloat(retentionCap)
				: null,
			retentionReleaseDays: retentionReleaseDays
				? Number.parseInt(retentionReleaseDays)
				: null,
		});
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-lg">
					{t("projects.contract.retention.title")}
				</CardTitle>
				<Button
					onClick={handleSave}
					disabled={isPending || !data}
					size="sm"
				>
					<Save className="mr-2 h-4 w-4" />
					{t("projects.contract.save")}
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label>{t("projects.contract.retention.percent")}</Label>
					<Input
						type="number"
						value={retentionPercent}
						onChange={(e) => setRetentionPercent(e.target.value)}
						min={0}
						max={100}
						step={0.5}
						placeholder="10"
					/>
				</div>

				<div className="space-y-2">
					<Label>{t("projects.contract.retention.cap")}</Label>
					<Input
						type="number"
						value={retentionCap}
						onChange={(e) => setRetentionCap(e.target.value)}
						min={0}
						step={0.01}
					/>
				</div>

				<div className="space-y-2">
					<Label>{t("projects.contract.retention.releaseDays")}</Label>
					<Input
						type="number"
						value={retentionReleaseDays}
						onChange={(e) => setRetentionReleaseDays(e.target.value)}
						min={0}
						step={1}
						placeholder="365"
					/>
				</div>

				{retentionAmount > 0 && (
					<div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
						<p className="text-sm text-amber-600 dark:text-amber-400">
							{t("projects.contract.retention.amount")}
						</p>
						<p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
							{formatCurrency(retentionAmount)}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

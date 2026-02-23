"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface ContractData {
	contractNo?: string | null;
	title?: string | null;
	clientName?: string | null;
	description?: string | null;
	status: string;
	value: number;
	currency: string;
	signedDate?: string | Date | null;
	startDate?: string | Date | null;
	endDate?: string | Date | null;
	notes?: string | null;
}

interface ContractInfoCardProps {
	organizationId: string;
	projectId: string;
	data: ContractData | null;
}

const CONTRACT_STATUSES = ["DRAFT", "ACTIVE", "SUSPENDED", "CLOSED"] as const;

function toDateInputValue(date: string | Date | null | undefined): string {
	if (!date) return "";
	const d = new Date(date);
	return d.toISOString().split("T")[0];
}

export function ContractInfoCard({
	organizationId,
	projectId,
	data,
}: ContractInfoCardProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [contractNo, setContractNo] = useState(data?.contractNo ?? "");
	const [title, setTitle] = useState(data?.title ?? "");
	const [clientName, setClientName] = useState(data?.clientName ?? "");
	const [description, setDescription] = useState(data?.description ?? "");
	const [status, setStatus] = useState(data?.status ?? "DRAFT");
	const [value, setValue] = useState(data?.value?.toString() ?? "0");
	const [signedDate, setSignedDate] = useState(
		toDateInputValue(data?.signedDate),
	);
	const [startDate, setStartDate] = useState(
		toDateInputValue(data?.startDate),
	);
	const [endDate, setEndDate] = useState(toDateInputValue(data?.endDate));
	const [notes, setNotes] = useState(data?.notes ?? "");

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
		upsert({
			organizationId,
			projectId,
			contractNo: contractNo || null,
			title: title || null,
			clientName: clientName || null,
			description: description || null,
			status: status as "DRAFT" | "ACTIVE" | "SUSPENDED" | "CLOSED",
			value: Number.parseFloat(value) || 0,
			signedDate: signedDate ? new Date(signedDate) : null,
			startDate: startDate ? new Date(startDate) : null,
			endDate: endDate ? new Date(endDate) : null,
			notes: notes || null,
		});
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-lg">
					{t("projects.contract.info.title")}
				</CardTitle>
				<Button onClick={handleSave} disabled={isPending} size="sm">
					<Save className="mr-2 h-4 w-4" />
					{t("projects.contract.save")}
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Row 1: Contract No + Title */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label>{t("projects.contract.info.contractNo")}</Label>
						<Input
							value={contractNo}
							onChange={(e) => setContractNo(e.target.value)}
							placeholder="CON-001"
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("projects.contract.info.contractTitle")}</Label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>
				</div>

				{/* Row 2: Client Name + Status */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label>{t("projects.contract.info.clientName")}</Label>
						<Input
							value={clientName}
							onChange={(e) => setClientName(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("projects.contract.status.DRAFT").replace("مسودة", "الحالة")}</Label>
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CONTRACT_STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										{t(`projects.contract.status.${s}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Row 3: Value */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label>{t("projects.contract.info.value")}</Label>
						<Input
							type="number"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							min={0}
							step={0.01}
						/>
					</div>
				</div>

				{/* Row 4: Dates */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div className="space-y-2">
						<Label>{t("projects.contract.info.signedDate")}</Label>
						<Input
							type="date"
							value={signedDate}
							onChange={(e) => setSignedDate(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("projects.contract.info.startDate")}</Label>
						<Input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("projects.contract.info.endDate")}</Label>
						<Input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
						/>
					</div>
				</div>

				{/* Row 5: Description */}
				<div className="space-y-2">
					<Label>{t("projects.contract.info.description")}</Label>
					<Textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={2}
					/>
				</div>

				{/* Row 6: Notes */}
				<div className="space-y-2">
					<Label>{t("projects.contract.info.notes")}</Label>
					<Textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={2}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

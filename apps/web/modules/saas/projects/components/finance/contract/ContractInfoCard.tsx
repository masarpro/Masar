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
import { Building2, CreditCard, Mail, Phone, Save, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	ClientSelector,
	type Client,
} from "@saas/finance/components/shared/ClientSelector";
import { InlineClientForm } from "@saas/finance/components/clients/InlineClientForm";

interface ContractData {
	contractNo?: string | null;
	title?: string | null;
	clientName?: string | null;
	clientId?: string | null;
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

	// ─── Client state ──────────────────────────────────────
	const [clientId, setClientId] = useState<string | undefined>(data?.clientId ?? undefined);
	const [clientName, setClientName] = useState(data?.clientName ?? "");
	const [clientCompany, setClientCompany] = useState("");
	const [clientPhone, setClientPhone] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [clientTaxNumber, setClientTaxNumber] = useState("");
	const [showInlineClientForm, setShowInlineClientForm] = useState(false);

	const clearClient = useCallback(() => {
		setClientId(undefined);
		setClientName("");
		setClientCompany("");
		setClientPhone("");
		setClientEmail("");
		setClientTaxNumber("");
	}, []);

	const handleClientSelect = useCallback((client: Client | null) => {
		if (client) {
			setClientId(client.id);
			setClientName(client.name);
			setClientCompany(client.company ?? "");
			setClientPhone(client.phone ?? "");
			setClientEmail(client.email ?? "");
			setClientTaxNumber(client.taxNumber ?? "");
			setShowInlineClientForm(false);
		} else {
			clearClient();
		}
	}, [clearClient]);

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

	const { mutate: updateProject } = useMutation(
		orpc.projects.update.mutationOptions({
			onError: (error) => {
				console.error("[ContractInfoCard] Failed to update project client:", error);
			},
		}),
	);

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

		// Also update the project's clientId and clientName
		updateProject({
			organizationId,
			id: projectId,
			clientId: clientId ?? null,
			clientName: clientName || undefined,
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

				{/* Row 2: Client + Status */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label>{t("projects.contract.info.clientName")}</Label>
						<div className="flex items-center gap-2">
							<div className="flex-1">
								<ClientSelector
									organizationId={organizationId}
									onSelect={handleClientSelect}
									selectedClientId={clientId}
								/>
							</div>
							<Button
								type="button"
								variant={showInlineClientForm ? "secondary" : "outline"}
								size="sm"
								className="rounded-xl gap-2 shrink-0"
								onClick={() => {
									setShowInlineClientForm(!showInlineClientForm);
									if (!showInlineClientForm) {
										clearClient();
									}
								}}
							>
								<UserPlus className="h-4 w-4" />
							</Button>
						</div>

						{showInlineClientForm ? (
							<InlineClientForm
								organizationId={organizationId}
								onSuccess={(client) => {
									setClientId(client.id);
									setClientName(client.name);
									setClientCompany(client.company ?? "");
									setClientPhone(client.phone ?? "");
									setClientEmail(client.email ?? "");
									setClientTaxNumber(client.taxNumber ?? "");
									setShowInlineClientForm(false);
								}}
								onCancel={() => setShowInlineClientForm(false)}
							/>
						) : clientId && clientName ? (
							<div className="rounded-xl border bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden">
								<div className="flex items-center justify-between p-3 border-b border-blue-100 dark:border-blue-900/50">
									<div className="flex items-center gap-3">
										<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
											{clientName.charAt(0).toUpperCase()}
										</div>
										<div>
											<p className="font-semibold text-sm text-foreground">{clientName}</p>
											{clientCompany && clientCompany !== clientName && (
												<p className="text-xs text-muted-foreground flex items-center gap-1">
													<Building2 className="h-3 w-3" />
													{clientCompany}
												</p>
											)}
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={clearClient}
										className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								{(clientPhone || clientEmail || clientTaxNumber) && (
									<div className="p-3 flex flex-wrap gap-3">
										{clientPhone && (
											<div className="flex items-center gap-2 text-sm">
												<div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
													<Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
												</div>
												<span className="text-muted-foreground text-xs">{clientPhone}</span>
											</div>
										)}
										{clientEmail && (
											<div className="flex items-center gap-2 text-sm">
												<div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
													<Mail className="h-3 w-3 text-violet-600 dark:text-violet-400" />
												</div>
												<span className="text-muted-foreground text-xs">{clientEmail}</span>
											</div>
										)}
										{clientTaxNumber && (
											<div className="flex items-center gap-2 text-sm">
												<div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
													<CreditCard className="h-3 w-3 text-amber-600 dark:text-amber-400" />
												</div>
												<span className="text-muted-foreground text-xs font-mono">{clientTaxNumber}</span>
											</div>
										)}
									</div>
								)}
							</div>
						) : null}
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

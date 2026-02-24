"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Switch } from "@ui/components/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import {
	Save,
	Loader2,
	User,
	Building,
	FileText,
	Plus,
	Trash2,
	ArrowRight,
} from "lucide-react";

interface SubcontractFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

const TERM_TYPES = [
	"ADVANCE",
	"MILESTONE",
	"MONTHLY",
	"COMPLETION",
	"CUSTOM",
] as const;

interface PaymentTerm {
	id?: string;
	type: (typeof TERM_TYPES)[number];
	label: string;
	percent: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function SubcontractForm({
	organizationId,
	organizationSlug,
	projectId,
}: SubcontractFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// Form state
	const [name, setName] = useState("");
	const [contractorType, setContractorType] = useState<
		"COMPANY" | "INDIVIDUAL"
	>("COMPANY");
	const [companyName, setCompanyName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [taxNumber, setTaxNumber] = useState("");
	const [crNumber, setCrNumber] = useState("");
	const [value, setValue] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [signedDate, setSignedDate] = useState("");
	const [status, setStatus] = useState<string>("DRAFT");
	const [includesVat, setIncludesVat] = useState(false);
	const [vatPercent, setVatPercent] = useState("15");
	const [retentionPercent, setRetentionPercent] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<string>("");
	const [scopeOfWork, setScopeOfWork] = useState("");
	const [notes, setNotes] = useState("");
	const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);

	// Generate contract number
	const { data: contractNoData } = useQuery(
		orpc.subcontracts.generateContractNo.queryOptions({
			input: { organizationId },
		}),
	);

	// Calculate totals
	const numericValue = Number.parseFloat(value) || 0;
	const totalWithVat = includesVat
		? numericValue * (1 + Number.parseFloat(vatPercent || "15") / 100)
		: numericValue;
	const retentionAmount = retentionPercent
		? (totalWithVat * Number.parseFloat(retentionPercent)) / 100
		: 0;
	const termsTotal = useMemo(
		() =>
			paymentTerms.reduce((sum, term) => {
				const pct = Number.parseFloat(term.percent) || 0;
				return sum + (totalWithVat * pct) / 100;
			}, 0),
		[paymentTerms, totalWithVat],
	);

	const createMutation = useMutation({
		...orpc.subcontracts.create.mutationOptions(),
		onSuccess: async (data) => {
			// Save payment terms if any
			if (paymentTerms.length > 0) {
				try {
					await queryClient.fetchQuery(
						orpc.subcontracts.setPaymentTerms.queryOptions({
							input: {
								organizationId,
								projectId,
								contractId: data.id,
								terms: paymentTerms.map((term, i) => ({
									type: term.type,
									label: term.label || null,
									percent: Number.parseFloat(term.percent) || null,
									sortOrder: i,
								})),
							},
						}),
					);
				} catch {
					// Terms will be saved on detail page
				}
			}
			toast.success(t("subcontracts.notifications.created"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			router.push(
				`/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${data.id}`,
			);
		},
		onError: (error) => {
			toast.error(
				error.message || t("subcontracts.notifications.createError"),
			);
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name || !value) {
			toast.error(t("subcontracts.validation.requiredFields"));
			return;
		}
		createMutation.mutate({
			organizationId,
			projectId,
			contractNo: contractNoData?.contractNo,
			name,
			contractorType,
			companyName: companyName || null,
			phone: phone || null,
			email: email || null,
			taxNumber: taxNumber || null,
			crNumber: crNumber || null,
			status: status as
				| "DRAFT"
				| "ACTIVE"
				| "SUSPENDED"
				| "COMPLETED"
				| "TERMINATED",
			value: numericValue,
			startDate: startDate ? new Date(startDate) : null,
			endDate: endDate ? new Date(endDate) : null,
			signedDate: signedDate ? new Date(signedDate) : null,
			includesVat,
			vatPercent: includesVat ? Number.parseFloat(vatPercent) : null,
			retentionPercent: retentionPercent
				? Number.parseFloat(retentionPercent)
				: null,
			paymentMethod: (paymentMethod as (typeof PAYMENT_METHODS)[number]) || null,
			scopeOfWork: scopeOfWork || null,
			notes: notes || null,
		});
	}

	function addTerm() {
		setPaymentTerms([
			...paymentTerms,
			{ type: "MILESTONE", label: "", percent: "" },
		]);
	}

	function removeTerm(index: number) {
		setPaymentTerms(paymentTerms.filter((_, i) => i !== index));
	}

	function updateTerm(
		index: number,
		field: keyof PaymentTerm,
		val: string,
	) {
		const updated = [...paymentTerms];
		updated[index] = { ...updated[index], [field]: val };
		setPaymentTerms(updated);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6 pb-24">
			{/* Section 1: Contractor Info */}
			<div className="overflow-hidden rounded-2xl border border-orange-200/50 bg-white dark:border-orange-800/30 dark:bg-slate-900/50">
				<div className="flex items-center gap-3 border-b border-orange-200/50 p-5 dark:border-orange-800/30">
					<div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/50">
						<User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
					</div>
					<h2 className="font-semibold text-orange-700 dark:text-orange-300">
						{t("subcontracts.form.contractorInfo")}
					</h2>
				</div>
				<div className="space-y-5 p-5">
					{/* Name & Type */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("subcontracts.form.name")}</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t("subcontracts.form.namePlaceholder")}
								className="rounded-xl"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("subcontracts.form.contractorType")}</Label>
							<Select
								value={contractorType}
								onValueChange={(v) =>
									setContractorType(v as "COMPANY" | "INDIVIDUAL")
								}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="COMPANY">
										{t("subcontracts.form.company")}
									</SelectItem>
									<SelectItem value="INDIVIDUAL">
										{t("subcontracts.form.individual")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					{/* Company Name (if company) */}
					{contractorType === "COMPANY" && (
						<div className="space-y-2">
							<Label>{t("subcontracts.form.companyName")}</Label>
							<Input
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
								placeholder={t("subcontracts.form.companyNamePlaceholder")}
								className="rounded-xl"
							/>
						</div>
					)}
					{/* Contact Info */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("subcontracts.form.phone")}</Label>
							<Input
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="05xxxxxxxx"
								className="rounded-xl"
								dir="ltr"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("subcontracts.form.email")}</Label>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="email@example.com"
								className="rounded-xl"
								dir="ltr"
							/>
						</div>
					</div>
					{/* Tax & CR */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("subcontracts.form.taxNumber")}</Label>
							<Input
								value={taxNumber}
								onChange={(e) => setTaxNumber(e.target.value)}
								className="rounded-xl"
								dir="ltr"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("subcontracts.form.crNumber")}</Label>
							<Input
								value={crNumber}
								onChange={(e) => setCrNumber(e.target.value)}
								className="rounded-xl"
								dir="ltr"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Section 2: Contract Details */}
			<div className="overflow-hidden rounded-2xl border border-amber-200/50 bg-white dark:border-amber-800/30 dark:bg-slate-900/50">
				<div className="flex items-center gap-3 border-b border-amber-200/50 p-5 dark:border-amber-800/30">
					<div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/50">
						<FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</div>
					<h2 className="font-semibold text-amber-700 dark:text-amber-300">
						{t("subcontracts.form.contractDetails")}
					</h2>
				</div>
				<div className="space-y-5 p-5">
					{/* Value & Status */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("subcontracts.form.value")}</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									value={value}
									onChange={(e) => setValue(e.target.value)}
									placeholder="0.00"
									className="rounded-xl pl-12"
									dir="ltr"
									required
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
									ر.س
								</span>
							</div>
						</div>
						<div className="space-y-2">
							<Label>{t("subcontracts.form.status")}</Label>
							<Select
								value={status}
								onValueChange={setStatus}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="DRAFT">
										{t("subcontracts.status.DRAFT")}
									</SelectItem>
									<SelectItem value="ACTIVE">
										{t("subcontracts.status.ACTIVE")}
									</SelectItem>
									<SelectItem value="SUSPENDED">
										{t("subcontracts.status.SUSPENDED")}
									</SelectItem>
									<SelectItem value="COMPLETED">
										{t("subcontracts.status.COMPLETED")}
									</SelectItem>
									<SelectItem value="TERMINATED">
										{t("subcontracts.status.TERMINATED")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Dates */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label>{t("subcontracts.form.startDate")}</Label>
							<Input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="rounded-xl"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("subcontracts.form.endDate")}</Label>
							<Input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="rounded-xl"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("subcontracts.form.signedDate")}</Label>
							<Input
								type="date"
								value={signedDate}
								onChange={(e) => setSignedDate(e.target.value)}
								className="rounded-xl"
							/>
						</div>
					</div>

					{/* VAT & Retention */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
							<Switch
								checked={includesVat}
								onCheckedChange={setIncludesVat}
							/>
							<Label className="cursor-pointer">
								{t("subcontracts.form.includesVat")}
							</Label>
						</div>
						{includesVat && (
							<div className="space-y-2">
								<Label>{t("subcontracts.form.vatPercent")}</Label>
								<Input
									type="number"
									min="0"
									max="100"
									step="0.01"
									value={vatPercent}
									onChange={(e) => setVatPercent(e.target.value)}
									className="rounded-xl"
									dir="ltr"
								/>
							</div>
						)}
						<div className="space-y-2">
							<Label>{t("subcontracts.form.retentionPercent")}</Label>
							<Input
								type="number"
								min="0"
								max="100"
								step="0.01"
								value={retentionPercent}
								onChange={(e) =>
									setRetentionPercent(e.target.value)
								}
								placeholder="10"
								className="rounded-xl"
								dir="ltr"
							/>
						</div>
					</div>

					{/* Payment Method */}
					<div className="space-y-2">
						<Label>{t("subcontracts.form.paymentMethod")}</Label>
						<Select
							value={paymentMethod}
							onValueChange={setPaymentMethod}
						>
							<SelectTrigger className="rounded-xl">
								<SelectValue
									placeholder={t(
										"subcontracts.form.selectPaymentMethod",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{PAYMENT_METHODS.map((method) => (
									<SelectItem key={method} value={method}>
										{t(`subcontracts.paymentMethods.${method}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{/* Section 3: Payment Terms */}
			<div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-white dark:border-violet-800/30 dark:bg-slate-900/50">
				<div className="flex items-center justify-between border-b border-violet-200/50 p-5 dark:border-violet-800/30">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/50">
							<Building className="h-5 w-5 text-violet-600 dark:text-violet-400" />
						</div>
						<h2 className="font-semibold text-violet-700 dark:text-violet-300">
							{t("subcontracts.form.paymentTerms")}
						</h2>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="rounded-xl"
						onClick={addTerm}
					>
						<Plus className="me-1 h-4 w-4" />
						{t("subcontracts.form.addTerm")}
					</Button>
				</div>
				<div className="p-5">
					{paymentTerms.length === 0 ? (
						<p className="text-center text-sm text-slate-500 dark:text-slate-400">
							{t("subcontracts.form.noTerms")}
						</p>
					) : (
						<div className="space-y-3">
							{paymentTerms.map((term, index) => (
								<div
									key={index}
									className="flex items-end gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
								>
									<div className="flex-1 space-y-2">
										<Label className="text-xs">
											{t("subcontracts.form.termType")}
										</Label>
										<Select
											value={term.type}
											onValueChange={(v) =>
												updateTerm(index, "type", v)
											}
										>
											<SelectTrigger className="h-9 rounded-lg">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{TERM_TYPES.map((tt) => (
													<SelectItem key={tt} value={tt}>
														{t(`subcontracts.termTypes.${tt}`)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="flex-[2] space-y-2">
										<Label className="text-xs">
											{t("subcontracts.form.termLabel")}
										</Label>
										<Input
											value={term.label}
											onChange={(e) =>
												updateTerm(
													index,
													"label",
													e.target.value,
												)
											}
											placeholder={t(
												"subcontracts.form.termLabelPlaceholder",
											)}
											className="h-9 rounded-lg"
										/>
									</div>
									<div className="w-24 space-y-2">
										<Label className="text-xs">%</Label>
										<Input
											type="number"
											min="0"
											max="100"
											step="0.01"
											value={term.percent}
											onChange={(e) =>
												updateTerm(
													index,
													"percent",
													e.target.value,
												)
											}
											className="h-9 rounded-lg"
											dir="ltr"
										/>
									</div>
									<div className="min-w-[80px] text-end text-sm font-medium text-slate-600 dark:text-slate-400">
										{formatCurrency(
											(totalWithVat *
												(Number.parseFloat(term.percent) || 0)) /
												100,
										)}
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-9 w-9 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
										onClick={() => removeTerm(index)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
							{/* Terms total */}
							<div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
								<span className="text-sm font-medium text-slate-600 dark:text-slate-400">
									{t("subcontracts.form.termsTotal")}
								</span>
								<span className="font-semibold text-violet-600 dark:text-violet-400">
									{formatCurrency(termsTotal)}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Section 4: Scope & Notes */}
			<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
				<div className="space-y-5 p-5">
					<div className="space-y-2">
						<Label>{t("subcontracts.form.scopeOfWork")}</Label>
						<Textarea
							value={scopeOfWork}
							onChange={(e) => setScopeOfWork(e.target.value)}
							placeholder={t(
								"subcontracts.form.scopeOfWorkPlaceholder",
							)}
							className="min-h-24 rounded-xl"
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("subcontracts.form.notes")}</Label>
						<Textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t("subcontracts.form.notesPlaceholder")}
							className="min-h-20 rounded-xl"
						/>
					</div>
				</div>
			</div>

			{/* Sticky Summary & Save Bar */}
			<div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
				<div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
					<div className="flex items-center gap-4 text-sm">
						<span className="text-slate-500">
							{t("subcontracts.form.total")}:
						</span>
						<span className="font-bold text-orange-600">
							{formatCurrency(totalWithVat)}
						</span>
						{retentionAmount > 0 && (
							<>
								<ArrowRight className="h-4 w-4 text-slate-400" />
								<span className="text-slate-500">
									{t("subcontracts.form.retention")}:
								</span>
								<span className="font-medium text-amber-600">
									{formatCurrency(retentionAmount)}
								</span>
							</>
						)}
					</div>
					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							className="rounded-xl"
							onClick={() => router.back()}
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							className="rounded-xl"
							disabled={createMutation.isPending}
						>
							{createMutation.isPending ? (
								<>
									<Loader2 className="me-2 h-4 w-4 animate-spin" />
									{t("common.saving")}
								</>
							) : (
								<>
									<Save className="me-2 h-4 w-4" />
									{t("common.save")}
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import { Save, User, FileText, Receipt } from "lucide-react";
import { ItemsEditor } from "../shared/ItemsEditor";
import { AmountSummary } from "../shared/AmountSummary";
import { ClientSelector, type Client } from "../shared/ClientSelector";
import { calculateTotals } from "../../lib/utils";

interface CreateInvoiceFormProps {
	organizationId: string;
	organizationSlug: string;
}

interface InvoiceItem {
	id: string;
	description: string;
	quantity: number;
	unit: string;
	unitPrice: number;
}

export function CreateInvoiceForm({
	organizationId,
	organizationSlug,
}: CreateInvoiceFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();
	const quotationId = searchParams.get("quotationId");

	// Form state
	const [invoiceType, setInvoiceType] = useState<"STANDARD" | "TAX" | "SIMPLIFIED">("STANDARD");
	const [clientId, setClientId] = useState<string | undefined>();
	const [clientName, setClientName] = useState("");
	const [clientCompany, setClientCompany] = useState("");
	const [clientPhone, setClientPhone] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [clientAddress, setClientAddress] = useState("");
	const [clientTaxNumber, setClientTaxNumber] = useState("");
	const [projectId, setProjectId] = useState<string | undefined>();
	const [issueDate, setIssueDate] = useState(() => {
		return new Date().toISOString().split("T")[0];
	});
	const [dueDate, setDueDate] = useState(() => {
		const date = new Date();
		date.setDate(date.getDate() + 30);
		return date.toISOString().split("T")[0];
	});
	const [paymentTerms, setPaymentTerms] = useState("");
	const [notes, setNotes] = useState("");
	const [vatPercent, setVatPercent] = useState(15);
	const [discountPercent, setDiscountPercent] = useState(0);
	const [items, setItems] = useState<InvoiceItem[]>([
		{ id: "1", description: "", quantity: 1, unit: "", unitPrice: 0 },
	]);

	// Fetch quotation data if converting from quotation
	const { data: quotation } = useQuery({
		...orpc.finance.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId ?? "" },
		}),
		enabled: !!quotationId,
	});

	// Pre-fill form with quotation data
	useEffect(() => {
		if (quotation) {
			setClientId(quotation.clientId ?? undefined);
			setClientName(quotation.clientName);
			setClientCompany(quotation.clientCompany ?? "");
			setClientPhone(quotation.clientPhone ?? "");
			setClientEmail(quotation.clientEmail ?? "");
			setClientAddress(quotation.clientAddress ?? "");
			setClientTaxNumber(quotation.clientTaxNumber ?? "");
			setProjectId(quotation.projectId ?? undefined);
			setVatPercent(quotation.vatPercent);
			setDiscountPercent(quotation.discountPercent);
			setPaymentTerms(quotation.paymentTerms ?? "");
			setNotes(quotation.notes ?? "");
			setItems(
				quotation.items.map((item, index) => ({
					id: String(index + 1),
					description: item.description,
					quantity: item.quantity,
					unit: item.unit ?? "",
					unitPrice: item.unitPrice,
				})),
			);
		}
	}, [quotation]);

	// Fetch projects for dropdown
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);
	const projects = projectsData?.projects ?? [];

	// Calculate totals
	const totals = calculateTotals(items, discountPercent, vatPercent);

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.create({
				organizationId,
				invoiceType,
				clientId,
				clientName,
				clientCompany,
				clientPhone,
				clientEmail,
				clientAddress,
				clientTaxNumber,
				projectId: projectId === "none" ? undefined : projectId,
				quotationId: quotationId ?? undefined,
				issueDate: new Date(issueDate).toISOString(),
				dueDate: new Date(dueDate).toISOString(),
				paymentTerms,
				notes,
				vatPercent,
				discountPercent,
				items: items
					.filter((item) => item.description.trim())
					.map((item) => ({
						description: item.description,
						quantity: item.quantity,
						unit: item.unit || undefined,
						unitPrice: item.unitPrice,
					})),
			});
		},
		onSuccess: (data) => {
			toast.success(t("finance.invoices.createSuccess"));
			router.push(`/app/${organizationSlug}/finance/invoices/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.createError"));
		},
	});

	const handleClientSelect = (client: Client | null) => {
		if (client) {
			setClientId(client.id);
			setClientName(client.name);
			setClientCompany(client.company ?? "");
			setClientPhone(client.phone ?? "");
			setClientEmail(client.email ?? "");
			setClientAddress(client.address ?? "");
			setClientTaxNumber(client.taxNumber ?? "");
		} else {
			setClientId(undefined);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!clientName.trim()) {
			toast.error(t("finance.invoices.errors.clientRequired"));
			return;
		}

		const validItems = items.filter((item) => item.description.trim());
		if (validItems.length === 0) {
			toast.error(t("finance.invoices.errors.itemsRequired"));
			return;
		}

		// Validate tax invoice requirements
		if (invoiceType === "TAX" && !clientTaxNumber.trim()) {
			toast.error(t("finance.invoices.errors.taxNumberRequired"));
			return;
		}

		// Validate dates: dueDate must be after issueDate
		const issueDateObj = new Date(issueDate);
		const dueDateObj = new Date(dueDate);
		if (dueDateObj <= issueDateObj) {
			toast.error(t("finance.invoices.errors.dueDateMustBeAfterIssueDate"));
			return;
		}

		createMutation.mutate();
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Quotation Reference Banner */}
			{quotation && (
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
					<Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					<div>
						<p className="font-medium text-blue-900 dark:text-blue-100">
							{t("finance.invoices.fromQuotation")}
						</p>
						<p className="text-sm text-blue-700 dark:text-blue-300">
							{quotation.quotationNo}
						</p>
					</div>
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Client Information */}
				<Card className="lg:col-span-2 rounded-2xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							{t("finance.invoices.clientInfo")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<ClientSelector
							organizationId={organizationId}
							onSelect={handleClientSelect}
							selectedClientId={clientId}
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label>{t("finance.invoices.clientName")} *</Label>
								<Input
									value={clientName}
									onChange={(e) => setClientName(e.target.value)}
									placeholder={t("finance.invoices.clientNamePlaceholder")}
									required
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.invoices.clientCompany")}</Label>
								<Input
									value={clientCompany}
									onChange={(e) => setClientCompany(e.target.value)}
									placeholder={t("finance.invoices.clientCompanyPlaceholder")}
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.invoices.clientPhone")}</Label>
								<Input
									value={clientPhone}
									onChange={(e) => setClientPhone(e.target.value)}
									placeholder="05xxxxxxxx"
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.invoices.clientEmail")}</Label>
								<Input
									type="email"
									value={clientEmail}
									onChange={(e) => setClientEmail(e.target.value)}
									placeholder="email@example.com"
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>
									{t("finance.invoices.clientTaxNumber")}
									{invoiceType === "TAX" && " *"}
								</Label>
								<Input
									value={clientTaxNumber}
									onChange={(e) => setClientTaxNumber(e.target.value)}
									placeholder={t("finance.invoices.taxNumberPlaceholder")}
									required={invoiceType === "TAX"}
									className="rounded-xl mt-1"
								/>
							</div>
						</div>
						<div>
							<Label>{t("finance.invoices.clientAddress")}</Label>
							<Textarea
								value={clientAddress}
								onChange={(e) => setClientAddress(e.target.value)}
								placeholder={t("finance.invoices.addressPlaceholder")}
								rows={2}
								className="rounded-xl mt-1"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Invoice Settings */}
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							{t("finance.invoices.settings")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label>{t("finance.invoices.invoiceType")} *</Label>
							<Select
								value={invoiceType}
								onValueChange={(v) => setInvoiceType(v as typeof invoiceType)}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="STANDARD">
										{t("finance.invoices.types.standard")}
									</SelectItem>
									<SelectItem value="TAX">
										{t("finance.invoices.types.tax")}
									</SelectItem>
									<SelectItem value="SIMPLIFIED">
										{t("finance.invoices.types.simplified")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("finance.invoices.project")}</Label>
							<Select value={projectId ?? "none"} onValueChange={setProjectId}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("finance.invoices.selectProject")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="none">
										{t("finance.invoices.noProject")}
									</SelectItem>
									{projects.map((project) => (
										<SelectItem key={project.id} value={project.id}>
											{project.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("finance.invoices.issueDate")} *</Label>
							<Input
								type="date"
								value={issueDate}
								onChange={(e) => setIssueDate(e.target.value)}
								required
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.dueDate")} *</Label>
							<Input
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								required
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.vatPercent")}</Label>
							<Input
								type="number"
								min="0"
								max="100"
								value={vatPercent}
								onChange={(e) => setVatPercent(Number(e.target.value))}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.discountPercent")}</Label>
							<Input
								type="number"
								min="0"
								max="100"
								value={discountPercent}
								onChange={(e) => setDiscountPercent(Number(e.target.value))}
								className="rounded-xl mt-1"
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Items */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.invoices.items")}</CardTitle>
				</CardHeader>
				<CardContent>
					<ItemsEditor items={items} onChange={setItems} />
				</CardContent>
			</Card>

			{/* Amount Summary */}
			<div className="flex justify-end">
				<AmountSummary
					subtotal={totals.subtotal}
					discountPercent={discountPercent}
					discountAmount={totals.discountAmount}
					vatPercent={vatPercent}
					vatAmount={totals.vatAmount}
					totalAmount={totals.totalAmount}
				/>
			</div>

			{/* Terms & Notes */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.invoices.terms")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>{t("finance.invoices.paymentTerms")}</Label>
						<Textarea
							value={paymentTerms}
							onChange={(e) => setPaymentTerms(e.target.value)}
							placeholder={t("finance.invoices.paymentTermsPlaceholder")}
							rows={2}
							className="rounded-xl mt-1"
						/>
					</div>
					<div>
						<Label>{t("finance.invoices.notes")}</Label>
						<Textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t("finance.invoices.notesPlaceholder")}
							rows={2}
							className="rounded-xl mt-1"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Submit */}
			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
					className="rounded-xl"
				>
					{t("common.cancel")}
				</Button>
				<Button
					type="submit"
					disabled={createMutation.isPending}
					className="rounded-xl"
				>
					<Save className="h-4 w-4 me-2" />
					{createMutation.isPending
						? t("common.saving")
						: t("finance.invoices.save")}
				</Button>
			</div>
		</form>
	);
}

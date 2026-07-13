"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { DisplayConfig } from "./QuotationCustomizer";
import type { QuotationFormatType } from "./QuotationFormatSelector";

interface QuotationDataFormProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
	format: QuotationFormatType;
	displayConfig: DisplayConfig;
	grandTotal: number;
	buildingArea: number;
	lumpSumDescription?: string;
	onBack: () => void;
}

type DiscountType = "none" | "percent" | "amount";

export function QuotationDataForm({
	organizationId,
	organizationSlug,
	studyId,
	format,
	displayConfig,
	grandTotal,
	buildingArea,
	lumpSumDescription,
	onBack,
}: QuotationDataFormProps) {
	const t = useTranslations("pricing.quotationBuilder");
	const router = useRouter();
	const queryClient = useQueryClient();

	// Client fields
	const [clientName, setClientName] = useState("");
	const [clientCompany, setClientCompany] = useState("");
	const [clientPhone, setClientPhone] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [clientTaxNumber, setClientTaxNumber] = useState("");

	// Details
	const [validDays, setValidDays] = useState("30");

	// Discount
	const [discountType, setDiscountType] = useState<DiscountType>("none");
	const [discountValue, setDiscountValue] = useState("");

	// Terms
	const [paymentTerms, setPaymentTerms] = useState("");
	const [deliveryTerms, setDeliveryTerms] = useState("");
	const [warrantyTerms, setWarrantyTerms] = useState("");
	const [notes, setNotes] = useState("");

	// Fetch existing clients
	const { data: clients } = useQuery(
		orpc.pricing.quotations.list.queryOptions({
			input: { organizationId, limit: 1, offset: 0 },
		}),
	);

	const fmt = (n: number) =>
		Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

	// Compute amounts
	const subtotal = grandTotal;
	let discountAmount = 0;
	if (discountType === "percent" && discountValue) {
		discountAmount = subtotal * (Number(discountValue) / 100);
	} else if (discountType === "amount" && discountValue) {
		discountAmount = Number(discountValue);
	}
	const afterDiscount = subtotal - discountAmount;
	const vatAmount = afterDiscount * 0.15;
	const totalAmount = afterDiscount + vatAmount;

	// Create mutation
	const createMutation = useMutation(
		orpc.pricing.studies.createStudyQuotation.mutationOptions({
			onSuccess: (data: any) => {
				toast.success(t("toasts.createSuccess"));
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.key(),
				});
				router.push(
					`/app/${organizationSlug}/pricing/quotations/${data.quotationId}`,
				);
			},
			onError: () => {
				toast.error(t("toasts.createError"));
			},
		}),
	);

	const handleSubmit = () => {
		if (!clientName.trim()) {
			toast.error(t("toasts.clientNameRequired"));
			return;
		}

		(createMutation as any).mutate({
			organizationId,
			studyId,
			format,
			displayConfig: {
				...displayConfig,
				totalArea: buildingArea,
				pricePerSqm: buildingArea > 0 ? grandTotal / buildingArea : 0,
				lumpSumAmount: grandTotal,
				lumpSumDescription: lumpSumDescription ?? "",
			},
			clientData: {
				name: clientName,
				company: clientCompany || undefined,
				phone: clientPhone || undefined,
				email: clientEmail || undefined,
				taxNumber: clientTaxNumber || undefined,
			},
			validDays: Number(validDays) || 30,
			discountType,
			discountValue: discountValue ? Number(discountValue) : undefined,
			paymentTerms: paymentTerms || undefined,
			deliveryTerms: deliveryTerms || undefined,
			warrantyTerms: warrantyTerms || undefined,
			notes: notes || undefined,
		});
	};

	return (
		<div className="space-y-5">
			{/* Client data */}
			<div className="rounded-xl border border-border bg-card p-5 space-y-4">
				<h4 className="font-semibold text-sm">{t("sections.clientInfo")}</h4>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.clientName")} *</Label>
						<Input
							value={clientName}
							onChange={(e: any) => setClientName(e.target.value)}
							placeholder={t("placeholders.clientName")}
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.company")}</Label>
						<Input
							value={clientCompany}
							onChange={(e: any) => setClientCompany(e.target.value)}
							placeholder={t("placeholders.company")}
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.phone")}</Label>
						<Input
							value={clientPhone}
							onChange={(e: any) => setClientPhone(e.target.value)}
							placeholder="05xxxxxxxx"
							dir="ltr"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.email")}</Label>
						<Input
							value={clientEmail}
							onChange={(e: any) => setClientEmail(e.target.value)}
							placeholder="email@example.com"
							dir="ltr"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.taxNumber")}</Label>
						<Input
							value={clientTaxNumber}
							onChange={(e: any) => setClientTaxNumber(e.target.value)}
							placeholder="300xxxxxxxxx"
							dir="ltr"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.validUntil")}</Label>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								value={validDays}
								onChange={(e: any) => setValidDays(e.target.value)}
								className="h-10 w-20 rounded-lg"
								dir="ltr"
							/>
							<span className="text-sm text-muted-foreground">{t("fields.days")}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Amounts */}
			<div className="rounded-xl border border-border bg-card p-5 space-y-4">
				<h4 className="font-semibold text-sm">{t("sections.amounts")}</h4>
				<div className="space-y-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("totals.subtotal")}</span>
						<span className="font-medium" dir="ltr">{fmt(subtotal)} {t("currency")}</span>
					</div>

					{/* Discount */}
					<div className="space-y-2">
						<Label className="text-xs">{t("totals.discount")}</Label>
						<div className="flex gap-2">
							{(["none", "percent", "amount"] as const).map((dt) => (
								<button
									key={dt}
									type="button"
									onClick={() => {
										setDiscountType(dt);
										setDiscountValue("");
									}}
									className={cn(
										"px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
										discountType === dt
											? "border-primary bg-primary/5 text-primary"
											: "border-border hover:border-muted-foreground/30",
									)}
								>
									{dt === "none" ? t("discount.none") : dt === "percent" ? t("discount.percent") : t("discount.amount")}
								</button>
							))}
							{discountType !== "none" && (
								<Input
									type="number"
									value={discountValue}
									onChange={(e: any) => setDiscountValue(e.target.value)}
									className="h-8 w-24 rounded-lg"
									dir="ltr"
									placeholder={discountType === "percent" ? "%" : t("currency")}
								/>
							)}
						</div>
					</div>

					{discountAmount > 0 && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">{t("totals.discount")}</span>
							<span className="text-destructive" dir="ltr">-{fmt(discountAmount)} {t("currency")}</span>
						</div>
					)}
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("totals.afterDiscount")}</span>
						<span dir="ltr">{fmt(afterDiscount)} {t("currency")}</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("totals.vat", { percent: 15 })}</span>
						<span dir="ltr">{fmt(vatAmount)} {t("currency")}</span>
					</div>
					<div className="flex items-center justify-between text-sm border-t border-border pt-2">
						<span className="font-semibold">{t("totals.grandTotal")}</span>
						<span className="text-lg font-bold text-primary" dir="ltr">
							{fmt(totalAmount)} {t("currency")}
						</span>
					</div>
				</div>
			</div>

			{/* Terms */}
			<div className="rounded-xl border border-border bg-card p-5 space-y-4">
				<h4 className="font-semibold text-sm">{t("sections.termsShort")}</h4>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.paymentTerms")}</Label>
						<Input
							value={paymentTerms}
							onChange={(e: any) => setPaymentTerms(e.target.value)}
							placeholder={t("placeholders.paymentTerms")}
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.deliveryTerms")}</Label>
						<Input
							value={deliveryTerms}
							onChange={(e: any) => setDeliveryTerms(e.target.value)}
							placeholder={t("placeholders.deliveryTerms")}
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.warrantyTerms")}</Label>
						<Input
							value={warrantyTerms}
							onChange={(e: any) => setWarrantyTerms(e.target.value)}
							placeholder={t("placeholders.warrantyTerms")}
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">{t("fields.notes")}</Label>
						<Input
							value={notes}
							onChange={(e: any) => setNotes(e.target.value)}
							placeholder={t("placeholders.notes")}
							className="rounded-lg"
						/>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 justify-between">
				<Button variant="outline" onClick={onBack} className="rounded-xl">
					← {t("actions.back")}
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={createMutation.isPending || !clientName.trim()}
					className="gap-2 rounded-xl"
				>
					{createMutation.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Send className="h-4 w-4" />
					)}
					{t("actions.issueQuotation")}
				</Button>
			</div>
		</div>
	);
}

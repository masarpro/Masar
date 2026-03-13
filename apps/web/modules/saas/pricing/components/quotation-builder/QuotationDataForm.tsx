"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import { Loader2, Send } from "lucide-react";
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
				toast.success("تم إنشاء عرض السعر بنجاح");
				queryClient.invalidateQueries({
					queryKey: ["pricing"],
				});
				router.push(
					`/app/${organizationSlug}/pricing/quotations/${data.quotationId}`,
				);
			},
			onError: () => {
				toast.error("حدث خطأ أثناء إنشاء عرض السعر");
			},
		}),
	);

	const handleSubmit = () => {
		if (!clientName.trim()) {
			toast.error("يرجى إدخال اسم العميل");
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
				<h4 className="font-semibold text-sm">بيانات العميل</h4>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<Label className="text-xs">اسم العميل *</Label>
						<Input
							value={clientName}
							onChange={(e: any) => setClientName(e.target.value)}
							placeholder="أحمد محمد"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">الشركة</Label>
						<Input
							value={clientCompany}
							onChange={(e: any) => setClientCompany(e.target.value)}
							placeholder="شركة البناء الحديث"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">الهاتف</Label>
						<Input
							value={clientPhone}
							onChange={(e: any) => setClientPhone(e.target.value)}
							placeholder="05xxxxxxxx"
							dir="ltr"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">البريد الإلكتروني</Label>
						<Input
							value={clientEmail}
							onChange={(e: any) => setClientEmail(e.target.value)}
							placeholder="email@example.com"
							dir="ltr"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">الرقم الضريبي</Label>
						<Input
							value={clientTaxNumber}
							onChange={(e: any) => setClientTaxNumber(e.target.value)}
							placeholder="300xxxxxxxxx"
							dir="ltr"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">صالح حتى</Label>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								value={validDays}
								onChange={(e: any) => setValidDays(e.target.value)}
								className="h-10 w-20 rounded-lg"
								dir="ltr"
							/>
							<span className="text-sm text-muted-foreground">يوم</span>
						</div>
					</div>
				</div>
			</div>

			{/* Amounts */}
			<div className="rounded-xl border border-border bg-card p-5 space-y-4">
				<h4 className="font-semibold text-sm">المبالغ</h4>
				<div className="space-y-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">المجموع الفرعي</span>
						<span className="font-medium" dir="ltr">{fmt(subtotal)} ر.س</span>
					</div>

					{/* Discount */}
					<div className="space-y-2">
						<Label className="text-xs">الخصم</Label>
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
									{dt === "none" ? "بدون" : dt === "percent" ? "نسبة %" : "مبلغ"}
								</button>
							))}
							{discountType !== "none" && (
								<Input
									type="number"
									value={discountValue}
									onChange={(e: any) => setDiscountValue(e.target.value)}
									className="h-8 w-24 rounded-lg"
									dir="ltr"
									placeholder={discountType === "percent" ? "%" : "ر.س"}
								/>
							)}
						</div>
					</div>

					{discountAmount > 0 && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">الخصم</span>
							<span className="text-red-500" dir="ltr">-{fmt(discountAmount)} ر.س</span>
						</div>
					)}
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">بعد الخصم</span>
						<span dir="ltr">{fmt(afterDiscount)} ر.س</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">ضريبة القيمة المضافة (15%)</span>
						<span dir="ltr">{fmt(vatAmount)} ر.س</span>
					</div>
					<div className="flex items-center justify-between text-sm border-t border-border pt-2">
						<span className="font-semibold">الإجمالي النهائي</span>
						<span className="text-lg font-bold text-primary" dir="ltr">
							{fmt(totalAmount)} ر.س
						</span>
					</div>
				</div>
			</div>

			{/* Terms */}
			<div className="rounded-xl border border-border bg-card p-5 space-y-4">
				<h4 className="font-semibold text-sm">الشروط</h4>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<Label className="text-xs">شروط الدفع</Label>
						<Input
							value={paymentTerms}
							onChange={(e: any) => setPaymentTerms(e.target.value)}
							placeholder="50% مقدم — 50% عند الانتهاء"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">مدة التنفيذ</Label>
						<Input
							value={deliveryTerms}
							onChange={(e: any) => setDeliveryTerms(e.target.value)}
							placeholder="6 أشهر من تاريخ التعاقد"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">شروط الضمان</Label>
						<Input
							value={warrantyTerms}
							onChange={(e: any) => setWarrantyTerms(e.target.value)}
							placeholder="سنة واحدة على الأعمال"
							className="rounded-lg"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">ملاحظات</Label>
						<Input
							value={notes}
							onChange={(e: any) => setNotes(e.target.value)}
							placeholder="ملاحظات إضافية..."
							className="rounded-lg"
						/>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 justify-between">
				<Button variant="outline" onClick={onBack} className="rounded-xl">
					← رجوع
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
					إصدار عرض السعر
				</Button>
			</div>
		</div>
	);
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Label } from "@ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";

interface VendorFormProps {
	organizationId: string;
	organizationSlug: string;
	initialData?: {
		id: string;
		name: string;
		type: string;
		contactPerson?: string | null;
		phone?: string | null;
		email?: string | null;
		address?: string | null;
		taxNumber?: string | null;
		crNumber?: string | null;
		categories?: string | null;
		notes?: string | null;
	};
}

export function VendorForm({ organizationId, organizationSlug, initialData }: VendorFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const isEdit = !!initialData;

	const [name, setName] = useState(initialData?.name ?? "");
	const [type, setType] = useState(initialData?.type ?? "SUPPLIER");
	const [contactPerson, setContactPerson] = useState(initialData?.contactPerson ?? "");
	const [phone, setPhone] = useState(initialData?.phone ?? "");
	const [email, setEmail] = useState(initialData?.email ?? "");
	const [address, setAddress] = useState(initialData?.address ?? "");
	const [taxNumber, setTaxNumber] = useState(initialData?.taxNumber ?? "");
	const [crNumber, setCrNumber] = useState(initialData?.crNumber ?? "");
	const [categories, setCategories] = useState(initialData?.categories ?? "");
	const [notes, setNotes] = useState(initialData?.notes ?? "");

	const basePath = `/app/${organizationSlug}/procurement/vendors`;

	const mutation = useMutation({
		mutationFn: async () => {
			const payload = {
				organizationId,
				name,
				type: type as any,
				contactPerson: contactPerson || undefined,
				phone: phone || undefined,
				email: email || undefined,
				address: address || undefined,
				taxNumber: taxNumber || undefined,
				crNumber: crNumber || undefined,
				categories: categories || undefined,
				notes: notes || undefined,
			};

			if (isEdit) {
				return orpcClient.procurement.vendors.update({
					...payload,
					vendorId: initialData.id,
				});
			}
			return orpcClient.procurement.vendors.create(payload);
		},
		onSuccess: () => {
			toast.success(t("procurement.vendorSaved"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			router.push(basePath);
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	return (
		<div className="max-w-2xl space-y-6">
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("procurement.vendorInfo")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("procurement.vendorName")} *</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="rounded-xl"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.vendorType")}</Label>
							<Select value={type} onValueChange={setType}>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="SUPPLIER">{t("procurement.vendorTypes.SUPPLIER")}</SelectItem>
									<SelectItem value="SUBCONTRACTOR_VENDOR">{t("procurement.vendorTypes.SUBCONTRACTOR_VENDOR")}</SelectItem>
									<SelectItem value="EQUIPMENT_VENDOR">{t("procurement.vendorTypes.EQUIPMENT_VENDOR")}</SelectItem>
									<SelectItem value="SERVICE_VENDOR">{t("procurement.vendorTypes.SERVICE_VENDOR")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("procurement.contactPerson")}</Label>
							<Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="rounded-xl" />
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.phone")}</Label>
							<Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" dir="ltr" />
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("procurement.email")}</Label>
							<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" dir="ltr" />
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.taxNumber")}</Label>
							<Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} className="rounded-xl" dir="ltr" />
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("procurement.crNumber")}</Label>
							<Input value={crNumber} onChange={(e) => setCrNumber(e.target.value)} className="rounded-xl" dir="ltr" />
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.categories")}</Label>
							<Input value={categories} onChange={(e) => setCategories(e.target.value)} className="rounded-xl" />
						</div>
					</div>

					<div className="space-y-2">
						<Label>{t("procurement.address")}</Label>
						<Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl" rows={2} />
					</div>

					<div className="space-y-2">
						<Label>{t("procurement.notes")}</Label>
						<Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" rows={3} />
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end gap-3">
				<Button variant="outline" className="rounded-xl" onClick={() => router.push(basePath)}>
					{t("common.cancel")}
				</Button>
				<Button
					className="rounded-xl"
					onClick={() => mutation.mutate()}
					disabled={!name || mutation.isPending}
				>
					{mutation.isPending ? t("common.saving") : t("procurement.actions.save")}
				</Button>
			</div>
		</div>
	);
}

"use client";

import { useTranslations } from "next-intl";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { User, Building2, Phone, Smartphone, Mail } from "lucide-react";
import type { ClientFormData, ClientType } from "../ClientForm";

interface ClientInfoSectionProps {
	formData: ClientFormData;
	setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
}

export function ClientInfoSection({
	formData,
	setFormData,
}: ClientInfoSectionProps) {
	const t = useTranslations();

	const handleClientTypeChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			clientType: value as ClientType,
		}));
	};

	return (
		<Card className="rounded-2xl">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-lg">
					<User className="h-5 w-5 text-primary" />
					{t("finance.clients.sections.clientInfo")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* نوع العميل */}
				<div>
					<Label className="mb-2 block">
						{t("finance.clients.clientType")}
					</Label>
					<Tabs
						value={formData.clientType}
						onValueChange={handleClientTypeChange}
						className="w-full"
					>
						<TabsList className="grid w-full grid-cols-2 max-w-md rounded-xl">
							<TabsTrigger value="INDIVIDUAL" className="rounded-xl">
								<User className="h-4 w-4 me-2" />
								{t("finance.clients.types.individual")}
							</TabsTrigger>
							<TabsTrigger value="COMMERCIAL" className="rounded-xl">
								<Building2 className="h-4 w-4 me-2" />
								{t("finance.clients.types.commercial")}
							</TabsTrigger>
						</TabsList>

						{/* حقول الفرد */}
						<TabsContent value="INDIVIDUAL" className="mt-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<Label>{t("finance.clients.firstName")} *</Label>
									<Input
										value={formData.firstName}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												firstName: e.target.value,
											}))
										}
										placeholder={t("finance.clients.firstNamePlaceholder")}
										className="rounded-xl mt-1"
										required={formData.clientType === "INDIVIDUAL"}
									/>
								</div>
								<div>
									<Label>{t("finance.clients.lastName")} *</Label>
									<Input
										value={formData.lastName}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												lastName: e.target.value,
											}))
										}
										placeholder={t("finance.clients.lastNamePlaceholder")}
										className="rounded-xl mt-1"
										required={formData.clientType === "INDIVIDUAL"}
									/>
								</div>
							</div>
						</TabsContent>

						{/* حقول الشركة */}
						<TabsContent value="COMMERCIAL" className="mt-4">
							<div>
								<Label>{t("finance.clients.businessName")} *</Label>
								<Input
									value={formData.businessName}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											businessName: e.target.value,
										}))
									}
									placeholder={t("finance.clients.businessNamePlaceholder")}
									className="rounded-xl mt-1"
									required={formData.clientType === "COMMERCIAL"}
								/>
							</div>
						</TabsContent>
					</Tabs>
				</div>

				{/* الهاتف والجوال */}
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<Label className="flex items-center gap-2">
							<Phone className="h-4 w-4 text-slate-400" />
							{t("finance.clients.phone")}
						</Label>
						<Input
							value={formData.phone}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									phone: e.target.value,
								}))
							}
							placeholder="011XXXXXXX"
							className="rounded-xl mt-1"
							dir="ltr"
						/>
					</div>
					<div>
						<Label className="flex items-center gap-2">
							<Smartphone className="h-4 w-4 text-slate-400" />
							{t("finance.clients.mobile")}
						</Label>
						<Input
							value={formData.mobile}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									mobile: e.target.value,
								}))
							}
							placeholder="05XXXXXXXX"
							className="rounded-xl mt-1"
							dir="ltr"
						/>
					</div>
				</div>

				{/* البريد الإلكتروني */}
				<div>
					<Label className="flex items-center gap-2">
						<Mail className="h-4 w-4 text-slate-400" />
						{t("finance.clients.email")}
					</Label>
					<Input
						type="email"
						value={formData.email}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								email: e.target.value,
							}))
						}
						placeholder="email@example.com"
						className="rounded-xl mt-1 max-w-md"
						dir="ltr"
					/>
				</div>
			</CardContent>
		</Card>
	);
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Tabs, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import { toast } from "sonner";
import { Plus, User, Building2 } from "lucide-react";

interface ClientsHeaderActionsProps {
	organizationSlug: string;
	organizationId?: string;
}

interface QuickClientFormData {
	clientType: "INDIVIDUAL" | "COMMERCIAL";
	firstName: string;
	lastName: string;
	businessName: string;
	phone: string;
	mobile: string;
	email: string;
}

const emptyQuickFormData: QuickClientFormData = {
	clientType: "INDIVIDUAL",
	firstName: "",
	lastName: "",
	businessName: "",
	phone: "",
	mobile: "",
	email: "",
};

export function ClientsHeaderActions({
	organizationSlug,
	organizationId,
}: ClientsHeaderActionsProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [quickDialogOpen, setQuickDialogOpen] = useState(false);
	const [quickFormData, setQuickFormData] = useState<QuickClientFormData>(emptyQuickFormData);

	// Quick create mutation
	const quickCreateMutation = useMutation({
		mutationFn: async () => {
			if (!organizationId) {
				throw new Error("Organization ID is required");
			}

			const name =
				quickFormData.clientType === "COMMERCIAL"
					? quickFormData.businessName
					: `${quickFormData.firstName} ${quickFormData.lastName}`.trim();

			if (!name) {
				throw new Error(t("finance.clients.errors.nameRequired"));
			}

			return orpcClient.finance.clients.create({
				organizationId,
				clientType: quickFormData.clientType,
				firstName: quickFormData.firstName || undefined,
				lastName: quickFormData.lastName || undefined,
				businessName: quickFormData.businessName || undefined,
				name,
				phone: quickFormData.phone || undefined,
				mobile: quickFormData.mobile || undefined,
				email: quickFormData.email || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.clients.createSuccess"));
			setQuickDialogOpen(false);
			resetQuickForm();
			queryClient.invalidateQueries({
				queryKey: ["finance", "clients"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.createError"));
		},
	});

	const resetQuickForm = () => {
		setQuickFormData(emptyQuickFormData);
	};

	const handleQuickSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		quickCreateMutation.mutate();
	};

	return (
		<>
			<div className="flex gap-2">
				{organizationId && (
					<Button
						variant="outline"
						onClick={() => setQuickDialogOpen(true)}
						className="rounded-xl"
					>
						<Plus className="h-4 w-4 me-2" />
						{t("finance.clients.quickAdd")}
					</Button>
				)}
				<Button
					onClick={() =>
						router.push(`/app/${organizationSlug}/finance/clients/new`)
					}
					className="rounded-xl"
				>
					<Plus className="h-4 w-4 me-2" />
					{t("finance.clients.addClient")}
				</Button>
			</div>

			{/* Quick Add Dialog */}
			<Dialog open={quickDialogOpen} onOpenChange={setQuickDialogOpen}>
				<DialogContent className="sm:max-w-lg rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("finance.clients.quickAdd")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleQuickSubmit} className="space-y-4">
						{/* Client Type */}
						<div>
							<Label className="mb-2 block">{t("finance.clients.clientType")}</Label>
							<Tabs
								value={quickFormData.clientType}
								onValueChange={(value) =>
									setQuickFormData({
										...quickFormData,
										clientType: value as "INDIVIDUAL" | "COMMERCIAL",
									})
								}
								className="w-full"
							>
								<TabsList className="grid w-full grid-cols-2 rounded-xl">
									<TabsTrigger value="INDIVIDUAL" className="rounded-xl">
										<User className="h-4 w-4 me-2" />
										{t("finance.clients.types.individual")}
									</TabsTrigger>
									<TabsTrigger value="COMMERCIAL" className="rounded-xl">
										<Building2 className="h-4 w-4 me-2" />
										{t("finance.clients.types.commercial")}
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						{/* Name Fields */}
						{quickFormData.clientType === "INDIVIDUAL" ? (
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<Label>{t("finance.clients.firstName")} *</Label>
									<Input
										value={quickFormData.firstName}
										onChange={(e) =>
											setQuickFormData({
												...quickFormData,
												firstName: e.target.value,
											})
										}
										placeholder={t("finance.clients.firstNamePlaceholder")}
										required
										className="rounded-xl mt-1"
									/>
								</div>
								<div>
									<Label>{t("finance.clients.lastName")} *</Label>
									<Input
										value={quickFormData.lastName}
										onChange={(e) =>
											setQuickFormData({
												...quickFormData,
												lastName: e.target.value,
											})
										}
										placeholder={t("finance.clients.lastNamePlaceholder")}
										required
										className="rounded-xl mt-1"
									/>
								</div>
							</div>
						) : (
							<div>
								<Label>{t("finance.clients.businessName")} *</Label>
								<Input
									value={quickFormData.businessName}
									onChange={(e) =>
										setQuickFormData({
											...quickFormData,
											businessName: e.target.value,
										})
									}
									placeholder={t("finance.clients.businessNamePlaceholder")}
									required
									className="rounded-xl mt-1"
								/>
							</div>
						)}

						{/* Contact */}
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label>{t("finance.clients.mobile")}</Label>
								<Input
									value={quickFormData.mobile}
									onChange={(e) =>
										setQuickFormData({
											...quickFormData,
											mobile: e.target.value,
										})
									}
									placeholder="05XXXXXXXX"
									className="rounded-xl mt-1"
									dir="ltr"
								/>
							</div>
							<div>
								<Label>{t("finance.clients.email")}</Label>
								<Input
									type="email"
									value={quickFormData.email}
									onChange={(e) =>
										setQuickFormData({
											...quickFormData,
											email: e.target.value,
										})
									}
									placeholder="email@example.com"
									className="rounded-xl mt-1"
									dir="ltr"
								/>
							</div>
						</div>

						<div className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
							{t("finance.clients.quickAddHint")}
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setQuickDialogOpen(false)}
								className="rounded-xl"
							>
								{t("common.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={quickCreateMutation.isPending}
								className="rounded-xl"
							>
								{quickCreateMutation.isPending
									? t("common.saving")
									: t("finance.clients.addClient")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}

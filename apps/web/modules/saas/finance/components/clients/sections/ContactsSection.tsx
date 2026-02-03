"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Checkbox } from "@ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { toast } from "sonner";
import {
	Users2,
	Plus,
	MoreVertical,
	Pencil,
	Trash2,
	Star,
	Phone,
	Smartphone,
	Mail,
} from "lucide-react";
import type { ClientContact } from "../ClientForm";

interface ContactsSectionProps {
	contacts: ClientContact[];
	setContacts: React.Dispatch<React.SetStateAction<ClientContact[]>>;
	organizationId: string;
	clientId?: string;
	mode: "create" | "edit";
}

const emptyContact: ClientContact = {
	name: "",
	position: "",
	phone: "",
	mobile: "",
	email: "",
	isPrimary: false,
	notes: "",
};

export function ContactsSection({
	contacts,
	setContacts,
	organizationId,
	clientId,
	mode,
}: ContactsSectionProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [contactForm, setContactForm] = useState<ClientContact>(emptyContact);

	// إنشاء جهة اتصال (في وضع التعديل)
	const createContactMutation = useMutation({
		mutationFn: async (contact: ClientContact) => {
			if (!clientId) return null;
			return orpcClient.finance.clients.contacts.create({
				organizationId,
				clientId,
				name: contact.name,
				position: contact.position || undefined,
				phone: contact.phone || undefined,
				mobile: contact.mobile || undefined,
				email: contact.email || undefined,
				isPrimary: contact.isPrimary,
				notes: contact.notes || undefined,
			});
		},
		onSuccess: (newContact) => {
			if (newContact) {
				toast.success(t("finance.clients.contacts.createSuccess"));
				queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
			}
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.contacts.createError"));
		},
	});

	// تحديث جهة اتصال (في وضع التعديل)
	const updateContactMutation = useMutation({
		mutationFn: async (contact: ClientContact) => {
			if (!clientId || !contact.id) return null;
			return orpcClient.finance.clients.contacts.update({
				organizationId,
				clientId,
				contactId: contact.id,
				name: contact.name,
				position: contact.position || undefined,
				phone: contact.phone || undefined,
				mobile: contact.mobile || undefined,
				email: contact.email || undefined,
				isPrimary: contact.isPrimary,
				notes: contact.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.clients.contacts.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.contacts.updateError"));
		},
	});

	// حذف جهة اتصال (في وضع التعديل)
	const deleteContactMutation = useMutation({
		mutationFn: async (contactId: string) => {
			if (!clientId) return;
			return orpcClient.finance.clients.contacts.delete({
				organizationId,
				clientId,
				contactId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.clients.contacts.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.contacts.deleteError"));
		},
	});

	const handleOpenAdd = () => {
		setEditingIndex(null);
		setContactForm(emptyContact);
		setDialogOpen(true);
	};

	const handleOpenEdit = (index: number) => {
		setEditingIndex(index);
		setContactForm(contacts[index]);
		setDialogOpen(true);
	};

	const handleSave = async () => {
		if (!contactForm.name.trim()) {
			toast.error(t("finance.clients.contacts.nameRequired"));
			return;
		}

		if (mode === "create") {
			// في وضع الإنشاء، نحفظ في الحالة المحلية فقط
			if (editingIndex !== null) {
				const newContacts = [...contacts];
				newContacts[editingIndex] = contactForm;
				setContacts(newContacts);
			} else {
				setContacts([...contacts, contactForm]);
			}
		} else {
			// في وضع التعديل، نحفظ مباشرة في قاعدة البيانات
			if (editingIndex !== null && contactForm.id) {
				await updateContactMutation.mutateAsync(contactForm);
				const newContacts = [...contacts];
				newContacts[editingIndex] = contactForm;
				setContacts(newContacts);
			} else {
				const newContact = await createContactMutation.mutateAsync(contactForm);
				if (newContact) {
					setContacts([...contacts, { ...contactForm, id: newContact.id }]);
				}
			}
		}

		setDialogOpen(false);
		setContactForm(emptyContact);
		setEditingIndex(null);
	};

	const handleDelete = async (index: number) => {
		const contact = contacts[index];

		if (mode === "edit" && contact.id) {
			await deleteContactMutation.mutateAsync(contact.id);
		}

		const newContacts = contacts.filter((_, i) => i !== index);
		setContacts(newContacts);
	};

	const handleSetPrimary = (index: number) => {
		const newContacts = contacts.map((c, i) => ({
			...c,
			isPrimary: i === index,
		}));
		setContacts(newContacts);

		// في وضع التعديل، نحدث في قاعدة البيانات
		if (mode === "edit" && contacts[index].id && clientId) {
			orpcClient.finance.clients.contacts
				.setPrimary({
					organizationId,
					clientId,
					contactId: contacts[index].id!,
				})
				.then(() => {
					queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
				})
				.catch((error: any) => {
					toast.error(error.message);
				});
		}
	};

	return (
		<Card className="rounded-2xl">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Users2 className="h-5 w-5 text-primary" />
						{t("finance.clients.sections.contacts")}
					</CardTitle>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleOpenAdd}
						className="rounded-xl"
					>
						<Plus className="h-4 w-4 me-2" />
						{t("finance.clients.contacts.add")}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{contacts.length === 0 ? (
					<div className="text-center py-8 text-slate-500">
						<Users2 className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
						<p>{t("finance.clients.contacts.noContacts")}</p>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("finance.clients.contacts.name")}</TableHead>
								<TableHead>{t("finance.clients.contacts.position")}</TableHead>
								<TableHead>{t("finance.clients.contacts.contact")}</TableHead>
								<TableHead className="text-center">
									{t("finance.clients.contacts.primary")}
								</TableHead>
								<TableHead className="w-[50px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{contacts.map((contact, index) => (
								<TableRow key={contact.id || index}>
									<TableCell>
										<span className="font-medium">{contact.name}</span>
									</TableCell>
									<TableCell>
										{contact.position || (
											<span className="text-slate-400">-</span>
										)}
									</TableCell>
									<TableCell>
										<div className="space-y-1">
											{contact.phone && (
												<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
													<Phone className="h-3 w-3" />
													{contact.phone}
												</div>
											)}
											{contact.mobile && (
												<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
													<Smartphone className="h-3 w-3" />
													{contact.mobile}
												</div>
											)}
											{contact.email && (
												<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
													<Mail className="h-3 w-3" />
													{contact.email}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell className="text-center">
										{contact.isPrimary ? (
											<Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mx-auto" />
										) : (
											<button
												type="button"
												onClick={() => handleSetPrimary(index)}
												className="text-slate-300 hover:text-yellow-500 transition-colors"
											>
												<Star className="h-5 w-5 mx-auto" />
											</button>
										)}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="rounded-xl">
												<DropdownMenuItem onClick={() => handleOpenEdit(index)}>
													<Pencil className="h-4 w-4 me-2" />
													{t("common.edit")}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleDelete(index)}
													className="text-red-600"
												>
													<Trash2 className="h-4 w-4 me-2" />
													{t("common.delete")}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>

			{/* Dialog إضافة/تعديل جهة اتصال */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-lg rounded-2xl">
					<DialogHeader>
						<DialogTitle>
							{editingIndex !== null
								? t("finance.clients.contacts.edit")
								: t("finance.clients.contacts.add")}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label>{t("finance.clients.contacts.name")} *</Label>
								<Input
									value={contactForm.name}
									onChange={(e) =>
										setContactForm((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									placeholder={t("finance.clients.contacts.namePlaceholder")}
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.clients.contacts.position")}</Label>
								<Input
									value={contactForm.position}
									onChange={(e) =>
										setContactForm((prev) => ({
											...prev,
											position: e.target.value,
										}))
									}
									placeholder={t("finance.clients.contacts.positionPlaceholder")}
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.clients.phone")}</Label>
								<Input
									value={contactForm.phone}
									onChange={(e) =>
										setContactForm((prev) => ({
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
								<Label>{t("finance.clients.mobile")}</Label>
								<Input
									value={contactForm.mobile}
									onChange={(e) =>
										setContactForm((prev) => ({
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
						<div>
							<Label>{t("finance.clients.email")}</Label>
							<Input
								type="email"
								value={contactForm.email}
								onChange={(e) =>
									setContactForm((prev) => ({
										...prev,
										email: e.target.value,
									}))
								}
								placeholder="email@example.com"
								className="rounded-xl mt-1"
								dir="ltr"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								id="isPrimary"
								checked={contactForm.isPrimary}
								onCheckedChange={(checked) =>
									setContactForm((prev) => ({
										...prev,
										isPrimary: checked as boolean,
									}))
								}
							/>
							<Label htmlFor="isPrimary" className="cursor-pointer">
								{t("finance.clients.contacts.markAsPrimary")}
							</Label>
						</div>
						<div>
							<Label>{t("finance.clients.notes")}</Label>
							<Textarea
								value={contactForm.notes}
								onChange={(e) =>
									setContactForm((prev) => ({
										...prev,
										notes: e.target.value,
									}))
								}
								placeholder={t("finance.clients.contacts.notesPlaceholder")}
								rows={2}
								className="rounded-xl mt-1"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setDialogOpen(false)}
							className="rounded-xl"
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="button"
							onClick={handleSave}
							className="rounded-xl"
							disabled={
								createContactMutation.isPending ||
								updateContactMutation.isPending
							}
						>
							{createContactMutation.isPending || updateContactMutation.isPending
								? t("common.saving")
								: t("common.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}

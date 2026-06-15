"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Switch } from "@ui/components/switch";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export interface EditableCategory {
	id: string;
	nameAr: string;
	nameEn: string;
	accountCode: string | null;
	isVatExempt: boolean;
	isSystem: boolean;
}

interface CategoryFormDialogProps {
	organizationId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** When provided → edit mode; otherwise create mode. */
	category?: EditableCategory | null;
}

export function CategoryFormDialog({
	organizationId,
	open,
	onOpenChange,
	category,
}: CategoryFormDialogProps) {
	const t = useTranslations("settings.expenseCategories");
	const queryClient = useQueryClient();
	const isEdit = !!category;
	const isSystem = !!category?.isSystem;

	const schema = z.object({
		nameAr: z.string().trim().min(1, t("validation.nameArRequired")).max(100),
		nameEn: z.string().trim().min(1, t("validation.nameEnRequired")).max(100),
		accountCode: z
			.string()
			.trim()
			.regex(/^\d{4}$/, t("validation.accountCodeInvalid")),
		isVatExempt: z.boolean(),
	});

	type FormValues = z.infer<typeof schema>;

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			nameAr: "",
			nameEn: "",
			accountCode: "",
			isVatExempt: false,
		},
	});

	// Reset form whenever the dialog opens (or the target category changes).
	useEffect(() => {
		if (!open) return;
		form.reset({
			nameAr: category?.nameAr ?? "",
			nameEn: category?.nameEn ?? "",
			accountCode: category?.accountCode ?? "",
			isVatExempt: category?.isVatExempt ?? false,
		});
	}, [open, category, form]);

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			if (isEdit && category) {
				return orpcClient.categories.update({
					organizationId,
					id: category.id,
					nameAr: values.nameAr,
					nameEn: values.nameEn,
					isVatExempt: values.isVatExempt,
					// Backend rejects accountCode changes on system categories.
					...(isSystem ? {} : { accountCode: values.accountCode }),
				});
			}
			return orpcClient.categories.create({
				organizationId,
				group: "EXPENSE",
				nameAr: values.nameAr,
				nameEn: values.nameEn,
				accountCode: values.accountCode,
				isVatExempt: values.isVatExempt,
			});
		},
		onSuccess: () => {
			toast.success(isEdit ? t("updateSuccess") : t("createSuccess"));
			queryClient.invalidateQueries({
				queryKey: orpc.categories.list.key(),
			});
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error?.message || t("saveError"));
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? t("editCategory") : t("addCategory")}
					</DialogTitle>
					<DialogDescription>
						{isEdit ? t("editCategoryDesc") : t("addCategoryDesc")}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
						className="space-y-4"
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="nameAr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("nameAr")}</FormLabel>
										<FormControl>
											<Input {...field} dir="rtl" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="nameEn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("nameEn")}</FormLabel>
										<FormControl>
											<Input {...field} dir="ltr" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="accountCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("accountCode")}</FormLabel>
									<FormControl>
										<Input
											{...field}
											dir="ltr"
											inputMode="numeric"
											maxLength={4}
											disabled={isSystem}
											placeholder="5100"
										/>
									</FormControl>
									<FormDescription>
										{isSystem
											? t("systemAccountCodeLocked")
											: t("accountCodeHint")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isVatExempt"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-lg border p-3">
									<div className="space-y-0.5">
										<FormLabel>{t("vatExempt")}</FormLabel>
										<FormDescription>
											{t("vatExemptHint")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								{t("cancel")}
							</Button>
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending ? "..." : t("save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

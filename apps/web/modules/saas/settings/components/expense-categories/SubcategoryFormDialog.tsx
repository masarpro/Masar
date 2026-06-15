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

export interface EditableSubcategory {
	id: string;
	nameAr: string;
	nameEn: string;
	isLabor: boolean;
}

interface SubcategoryFormDialogProps {
	organizationId: string;
	/** Parent OrgCategory id (cuid). */
	categoryId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** When provided → edit mode; otherwise create mode. */
	subcategory?: EditableSubcategory | null;
}

export function SubcategoryFormDialog({
	organizationId,
	categoryId,
	open,
	onOpenChange,
	subcategory,
}: SubcategoryFormDialogProps) {
	const t = useTranslations("settings.expenseCategories");
	const queryClient = useQueryClient();
	const isEdit = !!subcategory;

	const schema = z.object({
		nameAr: z.string().trim().min(1, t("validation.nameArRequired")).max(100),
		nameEn: z.string().trim().min(1, t("validation.nameEnRequired")).max(100),
		isLabor: z.boolean(),
	});

	type FormValues = z.infer<typeof schema>;

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { nameAr: "", nameEn: "", isLabor: false },
	});

	useEffect(() => {
		if (!open) return;
		form.reset({
			nameAr: subcategory?.nameAr ?? "",
			nameEn: subcategory?.nameEn ?? "",
			isLabor: subcategory?.isLabor ?? false,
		});
	}, [open, subcategory, form]);

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			if (isEdit && subcategory) {
				return orpcClient.categories.updateSubcategory({
					organizationId,
					id: subcategory.id,
					nameAr: values.nameAr,
					nameEn: values.nameEn,
					isLabor: values.isLabor,
				});
			}
			return orpcClient.categories.createSubcategory({
				organizationId,
				categoryId,
				nameAr: values.nameAr,
				nameEn: values.nameEn,
				isLabor: values.isLabor,
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
						{isEdit ? t("editSubcategory") : t("addSubcategory")}
					</DialogTitle>
					<DialogDescription>
						{t("subcategoryDesc")}
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
							name="isLabor"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-lg border p-3">
									<div className="space-y-0.5">
										<FormLabel>{t("isLabor")}</FormLabel>
										<FormDescription>
											{t("isLaborHint")}
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

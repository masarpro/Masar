"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Skeleton } from "@ui/components/skeleton";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";

interface OwnerFormProps {
	organizationId: string;
	organizationSlug: string;
}

const ownerFormSchema = z.object({
	name: z.string().min(1, "required").max(200),
	nameEn: z.string().max(200).optional().or(z.literal("")),
	ownershipPercent: z.number()
		.min(0.01, "min 0.01")
		.max(100, "max 100"),
	nationalId: z.string().max(200).optional().or(z.literal("")),
	phone: z.string().max(30).optional().or(z.literal("")),
	email: z.string().max(254).optional().or(z.literal("")),
	notes: z.string().max(2000).optional().or(z.literal("")),
});

type OwnerFormValues = z.infer<typeof ownerFormSchema>;

export function OwnerForm({
	organizationId,
	organizationSlug,
}: OwnerFormProps) {
	const t = useTranslations("settings.owners");
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/settings/owners`;

	// Fetch total ownership to show remaining
	const { data: ownership, isLoading: ownershipLoading } = useQuery(
		orpc.accounting.owners.getTotalOwnership.queryOptions({
			input: { organizationId },
		}),
	);

	const remaining = ownership?.remaining ?? 100;

	const form = useForm<OwnerFormValues>({
		resolver: zodResolver(ownerFormSchema),
		defaultValues: {
			name: "",
			nameEn: "",
			ownershipPercent: 0,
			nationalId: "",
			phone: "",
			email: "",
			notes: "",
		},
	});

	const createMutation = useMutation({
		mutationFn: async (values: OwnerFormValues) => {
			return orpcClient.accounting.owners.create({
				organizationId,
				name: values.name,
				nameEn: values.nameEn || undefined,
				ownershipPercent: values.ownershipPercent,
				nationalId: values.nationalId || undefined,
				phone: values.phone || undefined,
				email: values.email || undefined,
				notes: values.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("createSuccess"));
			queryClient.invalidateQueries({
				queryKey: orpc.accounting.owners.list.queryOptions({
					input: { organizationId, includeInactive: true },
				}).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.accounting.owners.getTotalOwnership.queryOptions({
					input: { organizationId },
				}).queryKey,
			});
			router.push(basePath);
		},
		onError: (error: any) => {
			toast.error(error.message || t("createError"));
		},
	});

	const onSubmit = (values: OwnerFormValues) => {
		createMutation.mutate(values);
	};

	if (ownershipLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Back button */}
			<Button
				variant="ghost"
				size="sm"
				onClick={() => router.push(basePath)}
			>
				<ArrowRight className="h-4 w-4 me-1 rtl:hidden" />
				<ArrowLeft className="h-4 w-4 me-1 hidden rtl:block" />
				{t("backToList")}
			</Button>

			<Card>
				<CardHeader>
					<CardTitle>{t("addOwner")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6"
						>
							{/* Remaining ownership indicator */}
							<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
								<AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
								<span>
									{t("remaining")}:{" "}
									<strong className="tabular-nums">
										{remaining.toFixed(2)}%
									</strong>
								</span>
							</div>

							{/* Name */}
							<div className="grid gap-6 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("name")}</FormLabel>
											<FormControl>
												<Input {...field} />
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
											<FormLabel>
												{t("nameEn")}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													dir="ltr"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Ownership */}
							<FormField
								control={form.control}
								name="ownershipPercent"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("ownershipPercent")}
										</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													type="number"
													step="0.01"
													min="0.01"
													max="100"
													{...field}
													onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
													className="pe-8"
												/>
												<span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
													%
												</span>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Contact info */}
							<div className="grid gap-6 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="nationalId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("nationalId")}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													dir="ltr"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("phone")}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													dir="ltr"
													type="tel"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Email */}
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("email")}</FormLabel>
										<FormControl>
											<Input
												{...field}
												dir="ltr"
												type="email"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Notes */}
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("notes")}</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												rows={3}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Submit */}
							<div className="flex justify-end gap-3">
								<Button
									type="button"
									variant="outline"
									onClick={() => router.push(basePath)}
								>
									{t("backToList")}
								</Button>
								<Button
									type="submit"
									disabled={createMutation.isPending}
								>
									{createMutation.isPending
										? "..."
										: t("addOwner")}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}

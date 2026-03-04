"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { config } from "@repo/config";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CONTRACTOR_CLASSES, SAUDI_CITIES } from "../../lib/wizard-steps";

const companyInfoSchema = z.object({
	name: z.string().min(2),
	commercialRegister: z
		.string()
		.regex(/^\d{10}$/, "يجب أن يكون 10 أرقام")
		.optional()
		.or(z.literal("")),
	taxNumber: z
		.string()
		.regex(/^3\d{14}$/, "يجب أن يكون 15 رقم ويبدأ بـ 3")
		.optional()
		.or(z.literal("")),
	contractorClass: z.string().optional(),
	city: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
});

type CompanyInfoValues = z.infer<typeof companyInfoSchema>;

interface CompanyInfoStepProps {
	organizationId: string;
	organizationName: string;
	onNext: () => void;
	onCompanyUpdate: (name: string, logo?: string) => void;
}

export function CompanyInfoStep({
	organizationId,
	organizationName,
	onNext,
	onCompanyUpdate,
}: CompanyInfoStepProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	const form = useForm<CompanyInfoValues>({
		resolver: zodResolver(companyInfoSchema),
		defaultValues: {
			name: organizationName,
			commercialRegister: "",
			taxNumber: "",
			contractorClass: "",
			city: "",
			address: "",
			phone: "",
		},
	});

	const setupMutation = useMutation(
		orpc.onboarding.setupCompanyInfo.mutationOptions(),
	);

	const logoUploadMutation = useMutation(
		orpc.organizations.createLogoUploadUrl.mutationOptions(),
	);

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (!file) return;

			setUploading(true);
			try {
				const { signedUploadUrl, path } =
					await logoUploadMutation.mutateAsync({ organizationId });

				const response = await fetch(signedUploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});

				if (!response.ok) throw new Error("Upload failed");

				setLogoUrl(path);
				toast.success(t("onboarding.wizard.companyInfo.logo"));
			} catch {
				toast.error("فشل رفع الشعار");
			} finally {
				setUploading(false);
			}
		},
		[organizationId, logoUploadMutation, t],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
			"image/svg+xml": [".svg"],
		},
		multiple: false,
		maxSize: 2 * 1024 * 1024,
	});

	const onSubmit = async (values: CompanyInfoValues) => {
		try {
			await setupMutation.mutateAsync({
				organizationId,
				name: values.name,
				commercialRegister: values.commercialRegister || undefined,
				taxNumber: values.taxNumber || undefined,
				contractorClass: values.contractorClass || undefined,
				city: values.city || undefined,
				address: values.address || undefined,
				phone: values.phone || undefined,
				logo: logoUrl || undefined,
			});

			queryClient.invalidateQueries({ queryKey: ["organizations"] });
			onCompanyUpdate(values.name, logoUrl ?? undefined);
			onNext();
		} catch {
			toast.error("فشل حفظ بيانات المنشأة");
		}
	};

	return (
		<div>
			<h2 className="text-2xl font-bold">
				{t("onboarding.wizard.companyInfo.title")}
			</h2>
			<p className="mt-1 text-muted-foreground">
				{t("onboarding.wizard.companyInfo.subtitle")}
			</p>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="mt-6 space-y-4"
				>
					{/* Logo upload */}
					<div
						{...getRootProps()}
						className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
							isDragActive
								? "border-primary bg-primary/5"
								: "border-muted-foreground/25 hover:border-primary/50"
						}`}
					>
						<input {...getInputProps()} />
						{uploading ? (
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						) : logoUrl ? (
							<div className="flex flex-col items-center gap-2">
								<div className="h-16 w-16 overflow-hidden rounded-lg">
									<img
										src={`/image-proxy/${config.storage.bucketNames.avatars}/${logoUrl}`}
										alt="Logo"
										className="h-full w-full object-contain"
									/>
								</div>
								<span className="text-xs text-muted-foreground">
									{t("onboarding.wizard.companyInfo.logoUpload")}
								</span>
							</div>
						) : (
							<div className="flex flex-col items-center gap-2">
								<Upload className="h-8 w-8 text-muted-foreground" />
								<span className="text-sm text-muted-foreground">
									{t("onboarding.wizard.companyInfo.logoUpload")}
								</span>
								<span className="text-xs text-muted-foreground/60">
									{t("onboarding.wizard.companyInfo.logoHint")}
								</span>
							</div>
						)}
					</div>

					{/* Company name */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.wizard.companyInfo.name")} *
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder={t(
											"onboarding.wizard.companyInfo.namePlaceholder",
										)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{/* Commercial Register */}
						<FormField
							control={form.control}
							name="commercialRegister"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("onboarding.wizard.companyInfo.commercialRegister")}
									</FormLabel>
									<FormControl>
										<Input {...field} placeholder="1234567890" dir="ltr" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Tax Number */}
						<FormField
							control={form.control}
							name="taxNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("onboarding.wizard.companyInfo.taxNumber")}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="300000000000003"
											dir="ltr"
										/>
									</FormControl>
									<FormDescription>
										{t("onboarding.wizard.companyInfo.taxNumberHint")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Contractor Class */}
						<FormField
							control={form.control}
							name="contractorClass"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("onboarding.wizard.companyInfo.contractorClass")}
									</FormLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{CONTRACTOR_CLASSES.map((cls) => (
												<SelectItem key={cls} value={cls}>
													{cls}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* City */}
						<FormField
							control={form.control}
							name="city"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("onboarding.wizard.companyInfo.city")}
									</FormLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{SAUDI_CITIES.map((city) => (
												<SelectItem key={city} value={city}>
													{city}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Address */}
					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.wizard.companyInfo.address")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Phone */}
					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.wizard.companyInfo.phone")}
								</FormLabel>
								<FormControl>
									<Input {...field} placeholder="+966" dir="ltr" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex justify-end pt-4">
						<Button
							type="submit"
							size="lg"
							loading={setupMutation.isPending}
						>
							{t("onboarding.wizard.nav.next")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

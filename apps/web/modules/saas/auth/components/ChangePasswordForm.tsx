"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { useRouter } from "@shared/hooks/router";
import { Alert, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	EyeIcon,
	EyeOffIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";

type FormValues = {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
};

export function ChangePasswordForm() {
	const t = useTranslations("auth.changePassword");
	const router = useRouter();
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);

	const formSchema = useMemo(
		() =>
			z
				.object({
					currentPassword: z.string().min(1, t("currentPasswordRequired")),
					newPassword: z.string().min(8, t("newPasswordMin")),
					confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
				})
				.refine((data) => data.newPassword === data.confirmPassword, {
					message: t("passwordsMismatch"),
					path: ["confirmPassword"],
				}),
		[t],
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		try {
			const { error } = await authClient.changePassword({
				currentPassword: values.currentPassword,
				newPassword: values.newPassword,
			});

			if (error) {
				throw error;
			}

			// تحديث mustChangePassword إلى false
			await authClient.updateUser({
				mustChangePassword: false,
			} as any);

			// توجيه للصفحة الرئيسية بعد النجاح
			setTimeout(() => {
				router.replace("/app");
			}, 1500);
		} catch (e) {
			form.setError("root", {
				message:
					e && typeof e === "object" && "message" in e
						? (e.message as string)
						: t("genericError"),
			});
		}
	};

	return (
		<div dir="rtl">
			<h1 className="font-bold text-xl md:text-2xl">
				{t("title")}
			</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				{t("subtitle")}
			</p>

			{form.formState.isSubmitSuccessful ? (
				<Alert variant="success">
					<CheckCircle2Icon />
					<AlertTitle>
						{t("success")}
					</AlertTitle>
				</Alert>
			) : (
				<Form {...form}>
					<form
						className="space-y-4"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						{form.formState.errors.root?.message && (
							<Alert variant="error">
								<AlertTriangleIcon />
								<AlertTitle>
									{form.formState.errors.root.message}
								</AlertTitle>
							</Alert>
						)}

						<FormField
							control={form.control}
							name="currentPassword"
							render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("currentPassword")}</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type={
													showCurrentPassword
														? "text"
														: "password"
												}
												className="pe-10"
												{...field}
												autoComplete="current-password"
											/>
											<button
												type="button"
												onClick={() =>
													setShowCurrentPassword(
														!showCurrentPassword,
													)
												}
												className="absolute inset-y-0 end-0 flex items-center pe-4 text-primary text-xl"
											>
												{showCurrentPassword ? (
													<EyeOffIcon className="size-4" />
												) : (
													<EyeIcon className="size-4" />
												)}
											</button>
										</div>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="newPassword"
							render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("newPassword")}</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type={
													showNewPassword
														? "text"
														: "password"
												}
												className="pe-10"
												{...field}
												autoComplete="new-password"
											/>
											<button
												type="button"
												onClick={() =>
													setShowNewPassword(
														!showNewPassword,
													)
												}
												className="absolute inset-y-0 end-0 flex items-center pe-4 text-primary text-xl"
											>
												{showNewPassword ? (
													<EyeOffIcon className="size-4" />
												) : (
													<EyeIcon className="size-4" />
												)}
											</button>
										</div>
									</FormControl>
									{form.formState.errors.newPassword && (
										<p className="text-destructive text-sm mt-1">
											{form.formState.errors.newPassword.message}
										</p>
									)}
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="confirmPassword"
							render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("confirmPassword")}</FormLabel>
									<FormControl>
										<Input
											type="password"
											{...field}
											autoComplete="new-password"
										/>
									</FormControl>
									{form.formState.errors.confirmPassword && (
										<p className="text-destructive text-sm mt-1">
											{form.formState.errors.confirmPassword.message}
										</p>
									)}
								</FormItem>
							)}
						/>

						<Button
							className="w-full"
							type="submit"
							variant="secondary"
							loading={form.formState.isSubmitting}
						>
							{t("submit")}
						</Button>
					</form>
				</Form>
			)}
		</div>
	);
}

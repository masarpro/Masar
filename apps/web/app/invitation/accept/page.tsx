"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { orpcClient } from "@shared/lib/orpc-client";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import { AlertTriangleIcon, CheckCircleIcon, Loader2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function AcceptInvitationPage() {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	const formSchema = z
		.object({
			name: z.string().optional(),
			password: z.string().min(8),
			confirmPassword: z.string().min(8),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t("invitation.passwordMismatch"),
			path: ["confirmPassword"],
		});

	const form = useForm({
		resolver: zodResolver(formSchema as any),
		defaultValues: {
			name: "",
			password: "",
			confirmPassword: "",
		},
	});

	if (!token) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<AlertTriangleIcon className="h-12 w-12 text-destructive" />
				<h1 className="text-xl font-bold">{t("invitation.invalidToken")}</h1>
			</div>
		);
	}

	if (success) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<CheckCircleIcon className="h-12 w-12 text-green-500" />
				<h1 className="text-xl font-bold">{t("invitation.success")}</h1>
			</div>
		);
	}

	const onSubmit = form.handleSubmit(async (data) => {
		setError(null);
		setLoading(true);

		try {
			await orpcClient.orgUsers.acceptInvitation({
				token,
				password: data.password,
				...(data.name ? { name: data.name } : {}),
			});

			setSuccess(true);
			setTimeout(() => {
				router.push("/auth/login");
			}, 2000);
		} catch (e: any) {
			const message =
				e?.data?.message ?? e?.message ?? t("auth.errors.unknown");
			setError(message);
		} finally {
			setLoading(false);
		}
	});

	return (
		<div>
			<div className="mb-6 flex flex-col items-center gap-2 text-center">
				<h1 className="text-2xl font-bold">{t("invitation.title")}</h1>
			</div>

			{error && (
				<Alert variant="error" className="mb-4">
					<AlertTriangleIcon className="h-4 w-4" />
					<AlertTitle>{error}</AlertTitle>
				</Alert>
			)}

			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }: any) => (
							<FormItem>
								<FormLabel>{t("invitation.name")}</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="password"
						render={({ field }: any) => (
							<FormItem>
								<FormLabel>{t("invitation.setPassword")}</FormLabel>
								<FormControl>
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }: any) => (
							<FormItem>
								<FormLabel>{t("invitation.confirmPassword")}</FormLabel>
								<FormControl>
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
						{t("invitation.accept")}
					</Button>
				</form>
			</Form>
		</div>
	);
}

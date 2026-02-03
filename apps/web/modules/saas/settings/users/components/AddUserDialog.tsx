"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Alert, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { useEffect } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(1, "الاسم مطلوب"),
	email: z.string().email("البريد الإلكتروني غير صالح"),
	password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
	organizationRoleId: z.string().min(1, "الدور مطلوب"),
});

type FormValues = z.infer<typeof formSchema>;

export function AddUserDialog({
	open,
	onOpenChange,
	organizationId,
	roles,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	roles: any[];
}) {
	const queryClient = useQueryClient();

	const createUserMutation = useMutation(
		orpc.orgUsers.create.mutationOptions(),
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			organizationRoleId: "",
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form]);

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		try {
			await createUserMutation.mutateAsync({
				organizationId,
				name: values.name,
				email: values.email,
				password: values.password,
				organizationRoleId: values.organizationRoleId,
			});

			queryClient.invalidateQueries({
				queryKey: orpc.orgUsers.list.key(),
			});

			setTimeout(() => {
				onOpenChange(false);
			}, 1000);
		} catch (e) {
			form.setError("root", {
				message:
					e && typeof e === "object" && "message" in e
						? (e.message as string)
						: "حدث خطأ أثناء إنشاء المستخدم",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>إضافة مستخدم جديد</DialogTitle>
				</DialogHeader>

				<div dir="rtl">
					{form.formState.isSubmitSuccessful ? (
						<Alert variant="success">
							<CheckCircle2Icon />
							<AlertTitle>تم إنشاء المستخدم بنجاح!</AlertTitle>
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
											{
												form.formState.errors.root
													.message
											}
										</AlertTitle>
									</Alert>
								)}

								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>الاسم</FormLabel>
											<FormControl>
												<Input
													{...field}
													autoComplete="name"
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												البريد الإلكتروني
											</FormLabel>
											<FormControl>
												<Input
													type="email"
													{...field}
													autoComplete="email"
													dir="ltr"
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												كلمة المرور المؤقتة
											</FormLabel>
											<FormControl>
												<Input
													type="password"
													{...field}
													autoComplete="new-password"
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="organizationRoleId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>الدور</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="اختر الدور" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{roles.map((role: any) => (
														<SelectItem
															key={role.id}
															value={role.id}
														>
															{role.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>

								<Button
									className="w-full"
									type="submit"
									loading={form.formState.isSubmitting}
								>
									إضافة المستخدم
								</Button>
							</form>
						</Form>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

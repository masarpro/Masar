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
import { Checkbox } from "@ui/components/checkbox";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

// Role types that see every project regardless of assignment (managerial).
const ALL_PROJECTS_ROLE_TYPES = ["OWNER", "PROJECT_MANAGER", "ACCOUNTANT"];

const formSchema = z.object({
	name: z.string().min(1, "الاسم مطلوب"),
	email: z.string().email("البريد الإلكتروني غير صالح"),
	password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
	organizationRoleId: z.string().min(1, "الدور مطلوب"),
	projectScope: z.enum(["all", "specific"]),
	projectIds: z.array(z.string()),
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
			projectScope: "all",
			projectIds: [],
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form]);

	// Projects for the assignment picker (managerial creator sees all org projects).
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId, limit: 200 },
			enabled: open,
		}),
	);
	const projects: Array<{ id: string; name: string }> =
		projectsData?.projects ?? [];

	const selectedRoleId = form.watch("organizationRoleId");
	const projectScope = form.watch("projectScope");
	const selectedProjectIds = form.watch("projectIds");
	const selectedRole = roles.find((r: any) => r.id === selectedRoleId);
	const isManagerialRole = ALL_PROJECTS_ROLE_TYPES.includes(
		selectedRole?.type,
	);

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		try {
			// Managerial roles always see all projects; otherwise honour the scope.
			const allProjectsAccess =
				isManagerialRole || values.projectScope === "all";
			await createUserMutation.mutateAsync({
				organizationId,
				name: values.name,
				email: values.email,
				password: values.password,
				organizationRoleId: values.organizationRoleId,
				allProjectsAccess,
				projectIds: allProjectsAccess ? [] : values.projectIds,
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
									render={({ field }: any) => (
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
									render={({ field }: any) => (
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
									render={({ field }: any) => (
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
									render={({ field }: any) => (
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

								{/* نطاق رؤية المشاريع — يظهر فقط للأدوار غير الإدارية */}
								{selectedRoleId && !isManagerialRole && (
									<FormField
										control={form.control}
										name="projectScope"
										render={({ field }: any) => (
											<FormItem>
												<FormLabel>
													نطاق المشاريع
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="all">
															كل المشاريع
														</SelectItem>
														<SelectItem value="specific">
															مشاريع محددة
														</SelectItem>
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>
								)}

								{selectedRoleId &&
									!isManagerialRole &&
									projectScope === "specific" && (
										<FormItem>
											<FormLabel>
												المشاريع المخصّصة
											</FormLabel>
											<div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
												{projects.length === 0 ? (
													<p className="text-muted-foreground text-sm">
														لا توجد مشاريع
													</p>
												) : (
													projects.map((project) => {
														const checked =
															selectedProjectIds.includes(
																project.id,
															);
														return (
															<label
																key={project.id}
																className="flex cursor-pointer items-center gap-2"
															>
																<Checkbox
																	checked={checked}
																	onCheckedChange={(
																		value,
																	) => {
																		const next = value
																			? [
																					...selectedProjectIds,
																					project.id,
																				]
																			: selectedProjectIds.filter(
																					(id) =>
																						id !==
																						project.id,
																				);
																		form.setValue(
																			"projectIds",
																			next,
																		);
																	}}
																/>
																<span className="text-sm">
																	{project.name}
																</span>
															</label>
														);
													})
												)}
											</div>
										</FormItem>
									)}

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

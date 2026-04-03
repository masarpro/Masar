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
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SAUDI_CITIES } from "../../lib/wizard-steps";

const firstProjectSchema = z.object({
	projectName: z.string().min(2),
	ownerName: z.string().optional(),
	estimatedBudget: z.string().optional(),
	city: z.string().optional(),
});

type FirstProjectValues = z.infer<typeof firstProjectSchema>;

interface FirstProjectStepProps {
	organizationId: string;
	onNext: () => void;
	onProjectCreated: (projectId: string, projectSlug: string) => void;
}

export function FirstProjectStep({
	organizationId,
	onNext,
	onProjectCreated,
}: FirstProjectStepProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const form = useForm<FirstProjectValues>({
		resolver: zodResolver(firstProjectSchema),
		defaultValues: {
			projectName: "",
			ownerName: "",
			estimatedBudget: "",
			city: "",
		},
	});

	const createProjectMutation = useMutation(
		orpc.onboarding.setupFirstProject.mutationOptions(),
	);

	const onSubmit = async (values: FirstProjectValues) => {
		try {
			const budget = values.estimatedBudget
				? Number(values.estimatedBudget)
				: undefined;
			const project = await createProjectMutation.mutateAsync({
				organizationId,
				projectName: values.projectName,
				ownerName: values.ownerName || undefined,
				estimatedBudget:
					budget && !Number.isNaN(budget) ? budget : undefined,
				city: values.city || undefined,
			});

			queryClient.invalidateQueries({ queryKey: ["projects"] });
			onProjectCreated(project.id, project.slug);
			onNext();
		} catch {
			toast.error("فشل إنشاء المشروع");
		}
	};

	return (
		<div>
			<h2 className="text-2xl font-bold">
				{t("onboarding.wizard.firstProject.title")}
			</h2>
			<p className="mt-1 text-muted-foreground">
				{t("onboarding.wizard.firstProject.subtitle")}
			</p>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="mt-6 space-y-4"
				>
					{/* Project Name */}
					<FormField
						control={form.control}
						name="projectName"
						render={({ field }: any) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.wizard.firstProject.projectName")} *
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder={t(
											"onboarding.wizard.firstProject.projectNamePlaceholder",
										)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Owner Name */}
					<FormField
						control={form.control}
						name="ownerName"
						render={({ field }: any) => (
							<FormItem>
								<FormLabel>
									{t("onboarding.wizard.firstProject.ownerName")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{/* Estimated Budget */}
						<FormField
							control={form.control}
							name="estimatedBudget"
							render={({ field }: any) => (
								<FormItem>
									<FormLabel>
										{t("onboarding.wizard.firstProject.estimatedBudget")}
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="number"
											placeholder="1,500,000"
											dir="ltr"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* City */}
						<FormField
							control={form.control}
							name="city"
							render={({ field }: any) => (
								<FormItem>
									<FormLabel>
										{t("onboarding.wizard.firstProject.city")}
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

					<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
						<Info className="h-4 w-4 shrink-0" />
						{t("onboarding.wizard.firstProject.managerNote")}
					</div>

					<div className="flex justify-end pt-4">
						<Button
							type="submit"
							size="lg"
							loading={createProjectMutation.isPending}
						>
							{t("onboarding.wizard.nav.next")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

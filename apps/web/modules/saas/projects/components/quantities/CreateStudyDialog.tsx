"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Checkbox } from "@ui/components/checkbox";
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
	FormMessage,
} from "@ui/components/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface CreateStudyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	projectName?: string;
}

const PROJECT_TYPES = [
	"RESIDENTIAL",
	"COMMERCIAL",
	"INDUSTRIAL",
	"EDUCATIONAL",
	"MEDICAL",
	"GOVERNMENTAL",
	"INFRASTRUCTURE",
	"OTHER",
] as const;

const FINISHING_LEVELS = [
	"STANDARD",
	"PREMIUM",
	"LUXURY",
	"SHELL_CORE",
] as const;

const createStudySchema = z.object({
	name: z.string().min(2),
	projectType: z.string().min(1),
	landArea: z.coerce.number().positive().optional().or(z.literal("")),
	buildingArea: z.coerce.number().positive().optional().or(z.literal("")),
	numberOfFloors: z.coerce.number().int().positive().optional().or(z.literal("")),
	finishingLevel: z.string().optional(),
	overheadPercent: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
	profitPercent: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
	vatIncluded: z.boolean(),
});

type FormValues = z.infer<typeof createStudySchema>;

export function CreateStudyDialog({
	open,
	onOpenChange,
	organizationId,
	organizationSlug,
	projectId,
	projectName,
}: CreateStudyDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		resolver: zodResolver(createStudySchema) as any,
		defaultValues: {
			name: projectName ? `\u062F\u0631\u0627\u0633\u0629 \u0643\u0645\u064A\u0627\u062A - ${projectName}` : "",
			projectType: "",
			landArea: "",
			buildingArea: "",
			numberOfFloors: "",
			finishingLevel: "",
			overheadPercent: "",
			profitPercent: "",
			vatIncluded: false,
		},
	});

	const createMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.projectQuantities.createStudy({
				organizationId,
				projectId,
				name: data.name,
				projectType: data.projectType,
				landArea: data.landArea !== "" ? Number(data.landArea) : undefined,
				buildingArea: data.buildingArea !== "" ? Number(data.buildingArea) : undefined,
				numberOfFloors: data.numberOfFloors !== "" ? Number(data.numberOfFloors) : undefined,
				finishingLevel: data.finishingLevel || undefined,
				overheadPercent: data.overheadPercent !== "" ? Number(data.overheadPercent) : undefined,
				profitPercent: data.profitPercent !== "" ? Number(data.profitPercent) : undefined,
				vatIncluded: data.vatIncluded,
			});
		},
		onSuccess: (result) => {
			queryClient.invalidateQueries({
				queryKey: [["projectQuantities"]],
			});
			toast.success(t("projectQuantities.createDialog.toast.studyCreated"));
			onOpenChange(false);
			form.reset();
		},
		onError: (error: any) => {
			toast.error(
				error.message ||
					t("projectQuantities.createDialog.toast.createError"),
			);
		},
	});

	const onSubmit = (values: FormValues) => {
		createMutation.mutate(values);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				if (!val) form.reset();
				onOpenChange(val);
			}}
		>
			<DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden">
				{/* Header */}
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
					<DialogTitle className="text-base font-semibold">
						{t("projectQuantities.createDialog.title")}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
							{/* Study Name */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs font-medium text-slate-500 dark:text-slate-400">
											{t("projectQuantities.createDialog.name")} *
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												className="rounded-xl h-10"
												placeholder={t("projectQuantities.createDialog.namePlaceholder")}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Project Type & Finishing Level */}
							<div className="grid grid-cols-2 gap-3">
								<FormField
									control={form.control}
									name="projectType"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs font-medium text-slate-500 dark:text-slate-400">
												{t("projectQuantities.createDialog.projectType")} *
											</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger className="rounded-xl h-10">
														<SelectValue
															placeholder={t(
																"projectQuantities.createDialog.projectTypePlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent className="rounded-xl">
													{PROJECT_TYPES.map((type) => (
														<SelectItem key={type} value={type}>
															{t(
																`projectQuantities.createDialog.projectTypes.${type.toLowerCase()}`,
															)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="finishingLevel"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs font-medium text-slate-500 dark:text-slate-400">
												{t("projectQuantities.createDialog.finishingLevel")}
											</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger className="rounded-xl h-10">
														<SelectValue
															placeholder={t(
																"projectQuantities.createDialog.finishingLevelPlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent className="rounded-xl">
													{FINISHING_LEVELS.map((level) => (
														<SelectItem key={level} value={level}>
															{t(
																`projectQuantities.createDialog.finishingLevels.${level.toLowerCase()}`,
															)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Land Area, Building Area, Number of Floors */}
							<div className="grid grid-cols-3 gap-3">
								<FormField
									control={form.control}
									name="landArea"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs font-medium text-slate-500 dark:text-slate-400">
												{t("projectQuantities.createDialog.landArea")}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													step="0.01"
													min="0"
													className="rounded-xl h-10"
													placeholder={t("projectQuantities.createDialog.areaSqm")}
													dir="ltr"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="buildingArea"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs font-medium text-slate-500 dark:text-slate-400">
												{t("projectQuantities.createDialog.buildingArea")}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													step="0.01"
													min="0"
													className="rounded-xl h-10"
													placeholder={t("projectQuantities.createDialog.areaSqm")}
													dir="ltr"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="numberOfFloors"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs font-medium text-slate-500 dark:text-slate-400">
												{t("projectQuantities.createDialog.numberOfFloors")}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													step="1"
													min="1"
													className="rounded-xl h-10"
													placeholder="1"
													dir="ltr"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Overhead % and Profit % */}
							<div className="grid grid-cols-2 gap-3">
								<FormField
									control={form.control}
									name="overheadPercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs font-medium text-slate-500 dark:text-slate-400">
												{t("projectQuantities.createDialog.overheadPercent")}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													step="0.1"
													min="0"
													max="100"
													className="rounded-xl h-10"
													placeholder="10"
													dir="ltr"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="profitPercent"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs font-medium text-slate-500 dark:text-slate-400">
												{t("projectQuantities.createDialog.profitPercent")}
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													step="0.1"
													min="0"
													max="100"
													className="rounded-xl h-10"
													placeholder="15"
													dir="ltr"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* VAT Included Checkbox */}
							<FormField
								control={form.control}
								name="vatIncluded"
								render={({ field }) => (
									<FormItem className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer !mt-0">
											{t("projectQuantities.createDialog.vatIncluded")}
										</FormLabel>
									</FormItem>
								)}
							/>
						</div>

						{/* Footer Actions */}
						<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex gap-3">
							<Button
								type="button"
								variant="outline"
								className="flex-1 rounded-xl h-10"
								onClick={() => onOpenChange(false)}
								disabled={createMutation.isPending}
							>
								{t("common.cancel")}
							</Button>
							<Button
								type="submit"
								className="flex-1 rounded-xl h-10"
								disabled={createMutation.isPending}
							>
								{createMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 me-2 animate-spin" />
										{t("common.saving")}
									</>
								) : (
									<>
										<Save className="h-4 w-4 me-2" />
										{t("projectQuantities.createDialog.submit")}
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

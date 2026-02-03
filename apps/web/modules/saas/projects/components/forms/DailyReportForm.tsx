"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface DailyReportFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

type WeatherCondition =
	| "SUNNY"
	| "CLOUDY"
	| "RAINY"
	| "WINDY"
	| "DUSTY"
	| "HOT"
	| "COLD";

const WEATHER_OPTIONS: WeatherCondition[] = [
	"SUNNY",
	"CLOUDY",
	"RAINY",
	"WINDY",
	"DUSTY",
	"HOT",
	"COLD",
];

export function DailyReportForm({
	organizationId,
	organizationSlug,
	projectId,
}: DailyReportFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const [reportDate, setReportDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [manpower, setManpower] = useState("0");
	const [equipment, setEquipment] = useState("");
	const [workDone, setWorkDone] = useState("");
	const [blockers, setBlockers] = useState("");
	const [weather, setWeather] = useState<WeatherCondition>("SUNNY");

	const createMutation = useMutation(
		orpc.projectField.createDailyReport.mutationOptions(),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await createMutation.mutateAsync({
				organizationId,
				projectId,
				reportDate: new Date(reportDate),
				manpower: Number.parseInt(manpower, 10),
				equipment: equipment || undefined,
				workDone,
				blockers: blockers || undefined,
				weather,
			});

			toast.success(t("projects.field.reportCreated"));
			queryClient.invalidateQueries({ queryKey: ["projectField"] });
			router.push(`${basePath}/field`);
		} catch {
			toast.error(t("projects.field.reportCreateError"));
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					<Link href={`${basePath}/field`}>
						<ChevronLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("projects.field.newReport")}
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("projects.field.newReportSubtitle")}
					</p>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<div className="grid gap-6 sm:grid-cols-2">
						{/* Report Date */}
						<div className="space-y-2">
							<Label htmlFor="reportDate">
								{t("projects.field.reportDate")}
							</Label>
							<Input
								id="reportDate"
								type="date"
								value={reportDate}
								onChange={(e) => setReportDate(e.target.value)}
								required
								className="rounded-xl"
							/>
						</div>

						{/* Weather */}
						<div className="space-y-2">
							<Label>{t("projects.field.weatherLabel")}</Label>
							<Select
								value={weather}
								onValueChange={(v) => setWeather(v as WeatherCondition)}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{WEATHER_OPTIONS.map((w) => (
										<SelectItem key={w} value={w}>
											{t(`projects.field.weather.${w}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Manpower */}
						<div className="space-y-2">
							<Label htmlFor="manpower">{t("projects.field.manpower")}</Label>
							<Input
								id="manpower"
								type="number"
								min="0"
								value={manpower}
								onChange={(e) => setManpower(e.target.value)}
								placeholder="0"
								className="rounded-xl"
							/>
						</div>

						{/* Equipment */}
						<div className="space-y-2">
							<Label htmlFor="equipment">
								{t("projects.field.equipment")}
							</Label>
							<Input
								id="equipment"
								value={equipment}
								onChange={(e) => setEquipment(e.target.value)}
								placeholder={t("projects.field.equipmentPlaceholder")}
								className="rounded-xl"
							/>
						</div>
					</div>

					{/* Work Done */}
					<div className="mt-6 space-y-2">
						<Label htmlFor="workDone">{t("projects.field.workDone")} *</Label>
						<Textarea
							id="workDone"
							value={workDone}
							onChange={(e) => setWorkDone(e.target.value)}
							placeholder={t("projects.field.workDonePlaceholder")}
							rows={4}
							required
							className="rounded-xl"
						/>
					</div>

					{/* Blockers */}
					<div className="mt-6 space-y-2">
						<Label htmlFor="blockers">{t("projects.field.blockers")}</Label>
						<Textarea
							id="blockers"
							value={blockers}
							onChange={(e) => setBlockers(e.target.value)}
							placeholder={t("projects.field.blockersPlaceholder")}
							rows={3}
							className="rounded-xl"
						/>
					</div>
				</div>

				{/* Submit */}
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(`${basePath}/field`)}
						className="rounded-xl"
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={createMutation.isPending || !workDone.trim()}
						className="min-w-[120px] rounded-xl"
					>
						{createMutation.isPending
							? t("common.saving")
							: t("projects.field.createReport")}
					</Button>
				</div>
			</form>
		</div>
	);
}

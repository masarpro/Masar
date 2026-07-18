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
import { Camera, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
	MultiPhotoUploadForm,
	type MultiPhotoUploadFormHandle,
	type PhotoQueueState,
} from "../photos/MultiPhotoUploadForm";

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
	const reportsPath = `${basePath}/execution/reports`;

	const [reportDate, setReportDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [manpower, setManpower] = useState("0");
	const [equipment, setEquipment] = useState("");
	const [workDone, setWorkDone] = useState("");
	const [blockers, setBlockers] = useState("");
	const [weather, setWeather] = useState<WeatherCondition>("SUNNY");

	const photoUploadRef = useRef<MultiPhotoUploadFormHandle | null>(null);
	const [photoQueue, setPhotoQueue] = useState<PhotoQueueState>({
		total: 0,
		ready: 0,
		uploading: false,
	});

	const createMutation = useMutation(
		orpc.projectField.createDailyReport.mutationOptions(),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (photoQueue.uploading) {
			toast.error(t("projects.photos.waitForUploads"));
			return;
		}

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
		} catch (err) {
			const message = err instanceof Error ? err.message : "";
			toast.error(message || t("projects.field.reportCreateError"));
			return;
		}

		// Attach queued photos to the project gallery (they show up on the
		// photos page automatically, stamped with the report date).
		if (photoUploadRef.current?.getReadyCount()) {
			const { saved, failed } =
				await photoUploadRef.current.saveReadyPhotos();
			if (saved > 0) {
				toast.success(t("projects.photos.savedCount", { count: saved }));
			}
			if (failed > 0) {
				toast.error(t("projects.photos.someFailed", { count: failed }));
			}
		}

		toast.success(t("projects.field.reportCreated"));
		queryClient.invalidateQueries({ queryKey: orpc.projectField.key() });
		router.push(reportsPath);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="shrink-0 rounded-xl hover:bg-accent"
				>
					<Link href={reportsPath}>
						<ChevronLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-foreground">
						{t("projects.field.newReport")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("projects.field.newReportSubtitle")}
					</p>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border-2 bg-card p-6">
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
								onChange={(e: any) => setReportDate(e.target.value)}
								required
								className="rounded-xl"
							/>
						</div>

						{/* Weather */}
						<div className="space-y-2">
							<Label>{t("projects.field.weatherLabel")}</Label>
							<Select
								value={weather}
								onValueChange={(v: any) => setWeather(v as WeatherCondition)}
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
								onChange={(e: any) => setManpower(e.target.value)}
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
								onChange={(e: any) => setEquipment(e.target.value)}
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
							onChange={(e: any) => setWorkDone(e.target.value)}
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
							onChange={(e: any) => setBlockers(e.target.value)}
							placeholder={t("projects.field.blockersPlaceholder")}
							rows={3}
							className="rounded-xl"
						/>
					</div>
				</div>

				{/* Report Photos */}
				<div className="rounded-2xl border-2 bg-card p-6">
					<div className="mb-4 flex items-center gap-3">
						<div className="rounded-xl bg-chart-3/15 p-2.5">
							<Camera className="h-5 w-5 text-chart-3" />
						</div>
						<div>
							<h2 className="text-base font-semibold text-card-foreground">
								{t("projects.field.reportPhotos")}
							</h2>
							<p className="text-sm text-muted-foreground">
								{t("projects.field.reportPhotosHint")}
							</p>
						</div>
					</div>
					<MultiPhotoUploadForm
						controlled
						apiRef={photoUploadRef}
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						projectId={projectId}
						dateOverride={reportDate}
						onQueueStateChange={setPhotoQueue}
					/>
				</div>

				{/* Submit */}
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(reportsPath)}
						className="rounded-xl"
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={
							createMutation.isPending ||
							photoQueue.uploading ||
							!workDone.trim()
						}
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

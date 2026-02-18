import { apiServer } from "@shared/lib/api-server";
import { Card } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import {
	FileTextIcon,
	CalendarIcon,
	ImageIcon,
	FileIcon,
	AlertCircleIcon,
	ClockIcon,
} from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface SharePageProps {
	params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps) {
	const { token } = await params;
	const t = await getTranslations();

	try {
		const resource = await apiServer.shares.getResource({ token });
		return {
			title: `${t("share.title")} - ${resource.project.name}`,
		};
	} catch {
		return {
			title: t("share.notFound"),
		};
	}
}

export default async function SharePage({ params }: SharePageProps) {
	const { token } = await params;
	const t = await getTranslations();

	let resource;
	try {
		resource = await apiServer.shares.getResource({ token });
	} catch (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
				<Card className="max-w-md w-full p-8 text-center">
					<AlertCircleIcon className="h-16 w-16 mx-auto text-destructive mb-4" />
					<h1 className="text-2xl font-bold mb-2">
						{t("share.notFound")}
					</h1>
					<p className="text-muted-foreground">
						{t("share.notFoundDescription")}
					</p>
				</Card>
			</div>
		);
	}

	const getResourceIcon = () => {
		switch (resource.resourceType) {
			case "UPDATE_PDF":
			case "CLAIM_PDF":
			case "WEEKLY_REPORT":
				return <FileTextIcon className="h-8 w-8" />;
			case "ICS":
				return <CalendarIcon className="h-8 w-8" />;
			case "PHOTO_ALBUM":
				return <ImageIcon className="h-8 w-8" />;
			case "DOCUMENT":
				return <FileIcon className="h-8 w-8" />;
			default:
				return <FileIcon className="h-8 w-8" />;
		}
	};

	const getResourceTypeLabel = () => {
		switch (resource.resourceType) {
			case "UPDATE_PDF":
				return t("share.resourceTypes.updatePdf");
			case "CLAIM_PDF":
				return t("share.resourceTypes.claimPdf");
			case "WEEKLY_REPORT":
				return t("share.resourceTypes.weeklyReport");
			case "ICS":
				return t("share.resourceTypes.calendar");
			case "PHOTO_ALBUM":
				return t("share.resourceTypes.photoAlbum");
			case "DOCUMENT":
				return t("share.resourceTypes.document");
			default:
				return resource.resourceType;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<Card className="p-6 mb-6">
					<div className="flex items-start gap-4">
						<div className="p-3 bg-primary/10 rounded-lg text-primary">
							{getResourceIcon()}
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<h1 className="text-xl font-bold">
									{resource.project.name}
								</h1>
								<Badge variant="secondary">{getResourceTypeLabel()}</Badge>
							</div>
							{resource.project.clientName && (
								<p className="text-muted-foreground">
									{resource.project.clientName}
								</p>
							)}
						</div>
					</div>

					{resource.expiresAt && (
						<Alert className="mt-4">
							<ClockIcon className="h-4 w-4" />
							<AlertTitle>{t("share.expires")}</AlertTitle>
							<AlertDescription>
								{new Date(resource.expiresAt).toLocaleDateString()}
							</AlertDescription>
						</Alert>
					)}
				</Card>

				{/* Content based on resource type */}
				<Card className="p-6">
					{resource.resourceType === "PHOTO_ALBUM" && resource.data && (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{(resource.data as unknown as { url: string; caption?: string }[]).map(
								(photo, index) => (
									<div key={index} className="relative aspect-square">
										<Image
											src={photo.url}
											alt={photo.caption || `Photo ${index + 1}`}
											fill
											sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
											className="object-cover rounded-lg"
											unoptimized
										/>
									</div>
								),
							)}
						</div>
					)}

					{resource.resourceType === "DOCUMENT" && resource.data && (
						<div className="text-center py-8">
							<FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
							<h2 className="text-lg font-semibold mb-2">
								{(resource.data as unknown as { name: string }).name}
							</h2>
							<a
								href={(resource.data as unknown as { url: string }).url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
							>
								{t("share.download")}
							</a>
						</div>
					)}

					{(resource.resourceType === "UPDATE_PDF" ||
						resource.resourceType === "CLAIM_PDF" ||
						resource.resourceType === "WEEKLY_REPORT") && (
						<div className="text-center py-8">
							<FileTextIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
							<h2 className="text-lg font-semibold mb-4">
								{getResourceTypeLabel()}
							</h2>
							<p className="text-muted-foreground mb-4">
								{t("share.pdfReady")}
							</p>
						</div>
					)}

					{resource.resourceType === "ICS" && resource.data && (
						<div className="text-center py-8">
							<CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
							<h2 className="text-lg font-semibold mb-4">
								{t("share.calendarTitle")}
							</h2>
							<p className="text-muted-foreground mb-4">
								{t("share.calendarDescription")}
							</p>
						</div>
					)}
				</Card>

				{/* Footer */}
				<div className="text-center mt-6 text-sm text-muted-foreground">
					<p>{t("share.poweredBy")}</p>
				</div>
			</div>
		</div>
	);
}

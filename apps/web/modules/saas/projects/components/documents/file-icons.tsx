import {
	Box,
	File,
	FileArchive,
	FileSpreadsheet,
	FileText,
	Image as ImageIcon,
	PencilRuler,
	Presentation,
	Video,
	type LucideIcon,
} from "lucide-react";

export interface FileIconStyle {
	icon: LucideIcon;
	/** خلفية الأيقونة */
	bg: string;
	/** لون الأيقونة */
	color: string;
	/** هل النوع قابل للمعاينة في المتصفح؟ */
	previewable: boolean;
}

const EXT_GROUPS: { exts: string[]; style: Omit<FileIconStyle, "icon"> & { icon: LucideIcon } }[] = [
	{
		exts: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff", "svg", "heic"],
		style: { icon: ImageIcon, bg: "bg-chart-2/15", color: "text-chart-2", previewable: true },
	},
	{
		exts: ["pdf"],
		style: { icon: FileText, bg: "bg-destructive/15", color: "text-destructive", previewable: true },
	},
	{
		exts: ["doc", "docx", "rtf", "txt"],
		style: { icon: FileText, bg: "bg-chart-4/15", color: "text-chart-4", previewable: true },
	},
	{
		exts: ["xls", "xlsx", "csv"],
		style: { icon: FileSpreadsheet, bg: "bg-success/15", color: "text-success", previewable: true },
	},
	{
		exts: ["ppt", "pptx"],
		style: { icon: Presentation, bg: "bg-chart-1/15", color: "text-chart-1", previewable: true },
	},
	{
		exts: ["zip", "rar", "7z"],
		style: { icon: FileArchive, bg: "bg-chart-1/15", color: "text-chart-1", previewable: false },
	},
	{
		exts: ["mp4", "mov", "avi", "mkv", "webm"],
		style: { icon: Video, bg: "bg-chart-4/15", color: "text-chart-4", previewable: true },
	},
	{
		// CAD / مخططات هندسية
		exts: ["dwg", "dxf", "dwf", "rvt", "rfa", "rte", "ifc", "nwd", "nwc", "pln", "pla"],
		style: { icon: PencilRuler, bg: "bg-chart-4/15", color: "text-chart-4", previewable: false },
	},
	{
		// نماذج ثلاثية الأبعاد
		exts: ["skp", "max", "3ds", "obj", "fbx", "stl", "dae", "blend", "ls", "lsproj"],
		style: { icon: Box, bg: "bg-chart-4/15", color: "text-chart-4", previewable: false },
	},
];

function extOf(fileName?: string | null): string {
	if (!fileName) return "";
	return (fileName.split(".").pop() || "").toLowerCase();
}

/** يحدد نمط الأيقونة بناءً على اسم الملف (الامتداد) ثم MIME كاحتياط */
export function getFileTypeStyle(
	fileName?: string | null,
	mimeType?: string | null,
): FileIconStyle {
	const ext = extOf(fileName);
	if (ext) {
		for (const group of EXT_GROUPS) {
			if (group.exts.includes(ext)) return group.style;
		}
	}
	if (mimeType?.startsWith("image/")) {
		return { icon: ImageIcon, bg: "bg-chart-2/15", color: "text-chart-2", previewable: true };
	}
	if (mimeType?.startsWith("video/")) {
		return { icon: Video, bg: "bg-chart-4/15", color: "text-chart-4", previewable: true };
	}
	return { icon: File, bg: "bg-muted", color: "text-muted-foreground", previewable: false };
}

export function formatFileSize(bytes?: number | null): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

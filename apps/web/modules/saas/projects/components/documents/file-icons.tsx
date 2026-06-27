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
		style: { icon: ImageIcon, bg: "bg-pink-100 dark:bg-pink-950/30", color: "text-pink-500", previewable: true },
	},
	{
		exts: ["pdf"],
		style: { icon: FileText, bg: "bg-red-100 dark:bg-red-950/30", color: "text-red-500", previewable: true },
	},
	{
		exts: ["doc", "docx", "rtf", "txt"],
		style: { icon: FileText, bg: "bg-blue-100 dark:bg-blue-950/30", color: "text-blue-500", previewable: true },
	},
	{
		exts: ["xls", "xlsx", "csv"],
		style: { icon: FileSpreadsheet, bg: "bg-green-100 dark:bg-green-950/30", color: "text-green-500", previewable: true },
	},
	{
		exts: ["ppt", "pptx"],
		style: { icon: Presentation, bg: "bg-orange-100 dark:bg-orange-950/30", color: "text-orange-500", previewable: true },
	},
	{
		exts: ["zip", "rar", "7z"],
		style: { icon: FileArchive, bg: "bg-amber-100 dark:bg-amber-950/30", color: "text-amber-600", previewable: false },
	},
	{
		exts: ["mp4", "mov", "avi", "mkv", "webm"],
		style: { icon: Video, bg: "bg-purple-100 dark:bg-purple-950/30", color: "text-purple-500", previewable: true },
	},
	{
		// CAD / مخططات هندسية
		exts: ["dwg", "dxf", "dwf", "rvt", "rfa", "rte", "ifc", "nwd", "nwc", "pln", "pla"],
		style: { icon: PencilRuler, bg: "bg-cyan-100 dark:bg-cyan-950/30", color: "text-cyan-600", previewable: false },
	},
	{
		// نماذج ثلاثية الأبعاد
		exts: ["skp", "max", "3ds", "obj", "fbx", "stl", "dae", "blend", "ls", "lsproj"],
		style: { icon: Box, bg: "bg-indigo-100 dark:bg-indigo-950/30", color: "text-indigo-500", previewable: false },
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
		return { icon: ImageIcon, bg: "bg-pink-100 dark:bg-pink-950/30", color: "text-pink-500", previewable: true };
	}
	if (mimeType?.startsWith("video/")) {
		return { icon: Video, bg: "bg-purple-100 dark:bg-purple-950/30", color: "text-purple-500", previewable: true };
	}
	return { icon: File, bg: "bg-slate-100 dark:bg-slate-800", color: "text-slate-400", previewable: false };
}

export function formatFileSize(bytes?: number | null): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

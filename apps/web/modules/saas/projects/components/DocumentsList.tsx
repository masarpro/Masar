"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	FileText,
	FolderOpen,
	Plus,
	Search,
	File,
	CheckCircle,
	Clock,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface DocumentsListProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

const FOLDER_LABELS: Record<string, string> = {
	CONTRACT: "العقد",
	DRAWINGS: "المخططات",
	CLAIMS: "المستخلصات",
	LETTERS: "الخطابات",
	PHOTOS: "الصور",
	OTHER: "أخرى",
};

const FOLDER_COLORS: Record<string, string> = {
	CONTRACT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	DRAWINGS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	CLAIMS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	LETTERS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	PHOTOS: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
	OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

function getApprovalStatusBadge(status?: string) {
	switch (status) {
		case "PENDING":
			return (
				<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					<Clock className="h-3 w-3 me-1" />
					قيد الاعتماد
				</Badge>
			);
		case "APPROVED":
			return (
				<Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
					<CheckCircle className="h-3 w-3 me-1" />
					معتمد
				</Badge>
			);
		case "REJECTED":
			return (
				<Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					<XCircle className="h-3 w-3 me-1" />
					مرفوض
				</Badge>
			);
		default:
			return null;
	}
}

export function DocumentsList({
	organizationId,
	organizationSlug,
	projectId,
}: DocumentsListProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
	const [searchQuery, setSearchQuery] = useState("");

	const { data, isLoading } = useQuery(
		orpc.projectDocuments.list.queryOptions({
			input: {
				organizationId,
				projectId,
				folder: selectedFolder as any,
				search: searchQuery || undefined,
			},
		}),
	);

	const folders = [
		{ key: undefined, label: "الكل" },
		{ key: "CONTRACT", label: FOLDER_LABELS.CONTRACT },
		{ key: "DRAWINGS", label: FOLDER_LABELS.DRAWINGS },
		{ key: "CLAIMS", label: FOLDER_LABELS.CLAIMS },
		{ key: "LETTERS", label: FOLDER_LABELS.LETTERS },
		{ key: "PHOTOS", label: FOLDER_LABELS.PHOTOS },
		{ key: "OTHER", label: FOLDER_LABELS.OTHER },
	];

	return (
		<div className="space-y-6">
			{/* Search and Filters */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder={t("projects.documents.searchPlaceholder")}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-xl border border-slate-200 bg-white py-2 pe-4 ps-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					{folders.map((folder) => (
						<button
							key={folder.key ?? "all"}
							onClick={() => setSelectedFolder(folder.key)}
							className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
								selectedFolder === folder.key
									? "bg-primary text-primary-foreground"
									: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
							}`}
						>
							{folder.label}
						</button>
					))}
				</div>
			</div>

			{/* Documents List */}
			{isLoading ? (
				<div className="flex items-center justify-center py-20">
					<div className="relative">
						<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
						<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					</div>
				</div>
			) : !data?.items?.length ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/50">
					<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
						<FolderOpen className="h-12 w-12 text-slate-400" />
					</div>
					<p className="mb-2 text-lg font-medium text-slate-700 dark:text-slate-300">
						{t("projects.documents.noDocuments")}
					</p>
					<p className="mb-6 text-sm text-slate-500">
						{t("projects.documents.noDocumentsDescription")}
					</p>
					<Button asChild className="rounded-xl">
						<Link href={`${basePath}/documents/new`}>
							<Plus className="h-4 w-4 me-2" />
							{t("projects.documents.addFirstDocument")}
						</Link>
					</Button>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{data.items.map((doc) => (
						<Link
							key={doc.id}
							href={`${basePath}/documents/${doc.id}`}
							className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-primary/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
						>
							<div className="mb-4 flex items-start justify-between">
								<div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
									<File className="h-6 w-6 text-slate-600 dark:text-slate-400" />
								</div>
								<Badge className={`border-0 ${FOLDER_COLORS[doc.folder]}`}>
									{FOLDER_LABELS[doc.folder]}
								</Badge>
							</div>
							<h3 className="mb-2 font-medium text-slate-900 group-hover:text-primary dark:text-slate-100">
								{doc.title}
							</h3>
							<div className="flex items-center justify-between text-xs text-slate-500">
								<span>
									{new Date(doc.createdAt).toLocaleDateString("ar-SA")}
								</span>
								{doc.approvals?.[0] &&
									getApprovalStatusBadge(doc.approvals[0].status)}
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

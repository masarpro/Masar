// Backfill: ترحيل نظام المجلدات الثابت (enum folder) إلى المجلدات الديناميكية
// لكل مشروع لديه مستندات: ننشئ صف ProjectDocumentFolder لكل قيمة enum مستخدمة فعلاً
// ثم نربط folderId للمستندات. السكربت idempotent — يتخطى ما تمت معالجته مسبقاً.

import { db } from "../prisma/client";

// أسماء عربية مطابقة لمفاتيح الترجمة projects.documents.folders
const FOLDER_LABELS: Record<string, string> = {
	CONTRACT: "العقد",
	DRAWINGS: "المخططات",
	CLAIMS: "المستخلصات",
	LETTERS: "الخطابات",
	PHOTOS: "الصور",
	OTHER: "أخرى",
};

const FOLDER_ORDER = ["CONTRACT", "DRAWINGS", "CLAIMS", "LETTERS", "PHOTOS", "OTHER"];

async function main() {
	// المستندات التي لم تُربط بمجلد ديناميكي بعد ولها قيمة enum قديمة
	const docs = await db.projectDocument.findMany({
		where: { folderId: null, folder: { not: null } },
		select: {
			id: true,
			organizationId: true,
			projectId: true,
			folder: true,
			createdById: true,
		},
	});

	console.log(`Found ${docs.length} documents to migrate`);

	// تجميع حسب (projectId|folder)
	const groups = new Map<
		string,
		{
			organizationId: string;
			projectId: string;
			folder: string;
			createdById: string;
			docIds: string[];
		}
	>();

	for (const doc of docs) {
		const folder = doc.folder as string;
		const key = `${doc.projectId}::${folder}`;
		const existing = groups.get(key);
		if (existing) {
			existing.docIds.push(doc.id);
		} else {
			groups.set(key, {
				organizationId: doc.organizationId,
				projectId: doc.projectId,
				folder,
				createdById: doc.createdById,
				docIds: [doc.id],
			});
		}
	}

	let foldersCreated = 0;
	let docsLinked = 0;

	for (const group of groups.values()) {
		const name = FOLDER_LABELS[group.folder] ?? group.folder;
		const sortOrder = FOLDER_ORDER.indexOf(group.folder);

		// upsert المجلد عبر القيد الفريد (projectId, name)
		const folder = await db.projectDocumentFolder.upsert({
			where: { projectId_name: { projectId: group.projectId, name } },
			create: {
				organizationId: group.organizationId,
				projectId: group.projectId,
				name,
				sortOrder: sortOrder >= 0 ? sortOrder : 99,
				createdById: group.createdById,
			},
			update: {},
		});
		foldersCreated++;

		const result = await db.projectDocument.updateMany({
			where: { id: { in: group.docIds } },
			data: { folderId: folder.id },
		});
		docsLinked += result.count;
		console.log(
			`  Project ${group.projectId} | ${group.folder} → "${name}" (${result.count} docs)`,
		);
	}

	console.log(
		`\nDone. Folders upserted: ${foldersCreated}, documents linked: ${docsLinked}`,
	);
}

main()
	.catch(console.error)
	.finally(() => db.$disconnect());

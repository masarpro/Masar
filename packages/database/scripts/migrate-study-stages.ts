// هذا السكريبت يُعيّن كل الدراسات الموجودة كـ:
// - studyType = FULL_PROJECT
// - كل المراحل = APPROVED (لأنها دراسات قديمة مكتملة)

import { db } from "../prisma/client";

async function main() {
	const result = await db.costStudy.updateMany({
		where: {
			studyType: "FULL_PROJECT",
			quantitiesStatus: "DRAFT",
		},
		data: {
			quantitiesStatus: "APPROVED",
			specsStatus: "APPROVED",
			costingStatus: "APPROVED",
			pricingStatus: "APPROVED",
			quotationStatus: "NOT_STARTED",
		},
	});
	console.log(`Updated ${result.count} existing studies`);
}

main()
	.catch(console.error)
	.finally(() => db.$disconnect());

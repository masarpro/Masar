"use client";

import { SpecificationsPageContent } from "../pipeline/SpecificationsPageContent";

interface SpecificationsPageContentV2Props {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

// المراحل حية دائماً — أُلغي نظام الاعتماد/إعادة الفتح، فلا قفل على المواصفات
export function SpecificationsPageContentV2({
	organizationId,
	organizationSlug,
	studyId,
}: SpecificationsPageContentV2Props) {
	return (
		<div className="space-y-6" dir="rtl">
			{/* كتلة BOM حُذفت بطلب جودت — كانت تعرض "لم يتم استخراج المواد
			    بعد" داخل الدراسة الإنشائية بلا فائدة */}
			<SpecificationsPageContent
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</div>
	);
}

"use client";

import { Button } from "@ui/components/button";
import { useEffect } from "react";

export default function ProjectsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[Projects Error]", error);
	}, [error]);

	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center" dir="rtl">
			<div className="space-y-2">
				<h2 className="text-2xl font-bold">حدث خطأ غير متوقع</h2>
				<p className="text-muted-foreground">
					نعتذر، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
				</p>
			</div>
			<div className="flex gap-3">
				<Button onClick={() => reset()}>
					حاول مرة أخرى
				</Button>
				<Button variant="outline" onClick={() => window.history.back()}>
					العودة لقائمة المشاريع
				</Button>
			</div>
			{process.env.NODE_ENV === "development" && error.message && (
				<pre className="mt-4 max-w-lg overflow-auto rounded bg-muted p-4 text-start text-xs">
					{error.message}
				</pre>
			)}
		</div>
	);
}

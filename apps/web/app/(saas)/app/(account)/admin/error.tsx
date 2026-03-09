"use client";

import { Button } from "@ui/components/button";
import { useEffect } from "react";

export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[Admin Error]", error);
	}, [error]);

	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center" dir="rtl">
			<div className="space-y-2">
				<h2 className="text-2xl font-bold">حدث خطأ في لوحة الإدارة</h2>
				<p className="text-muted-foreground">
					حدث خطأ تقني أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى أو التواصل مع فريق الدعم.
				</p>
			</div>
			<div className="flex gap-3">
				<Button onClick={() => reset()}>
					حاول مرة أخرى
				</Button>
				<Button variant="outline" asChild>
					<a href="/app/admin">العودة للوحة الإدارة</a>
				</Button>
			</div>
			{process.env.NODE_ENV === "development" && error.message && (
				<pre className="mt-4 max-w-lg overflow-auto rounded bg-muted p-4 text-start text-xs">
					{error.message}
					{error.digest && `\nDigest: ${error.digest}`}
				</pre>
			)}
		</div>
	);
}

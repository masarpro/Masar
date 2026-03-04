"use client";

import { useEffect } from "react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[GlobalError]", error);
	}, [error]);

	return (
		<html lang="ar" dir="rtl">
			<body className="min-h-screen bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
				<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
					<div className="space-y-2">
						<h2 className="text-2xl font-bold">حدث خطأ غير متوقع</h2>
						<p className="text-gray-500 dark:text-gray-400">
							نعتذر، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
						</p>
					</div>
					<div className="flex gap-3">
						<button
							onClick={() => reset()}
							className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
						>
							حاول مرة أخرى
						</button>
						<a
							href="/"
							className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
						>
							العودة للرئيسية
						</a>
					</div>
				</div>
			</body>
		</html>
	);
}

"use client";

export function SkipNavLink() {
	return (
		<a
			href="#main-content"
			className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none"
		>
			تخطي إلى المحتوى الرئيسي
		</a>
	);
}

export function SkipNavTarget() {
	return <div id="main-content" tabIndex={-1} className="outline-none" />;
}

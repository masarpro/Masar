import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	enabled:
		process.env.NODE_ENV === "production" &&
		!!process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Performance monitoring — sample 10% of transactions
	tracesSampleRate: 0.1,

	// Filter out noisy/non-actionable errors (same as client config)
	beforeSend(event, hint) {
		const error = hint.originalException;
		if (error instanceof Error) {
			// Ignore network/abort errors
			if (error.name === "AbortError") return null;
			if (error.message?.includes("Failed to fetch")) return null;
			if (error.message?.includes("Load failed")) return null;
			// Ignore Next.js navigation cancellations
			if (error.message?.includes("NEXT_REDIRECT")) return null;
			if (error.message?.includes("NEXT_NOT_FOUND")) return null;
		}
		return event;
	},
});

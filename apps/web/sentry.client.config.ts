import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	enabled: process.env.NODE_ENV === "production",

	// Performance monitoring — sample 10% of transactions
	tracesSampleRate: 0.1,

	// Session Replay — capture 1% of sessions, 100% on error
	replaysSessionSampleRate: 0.01,
	replaysOnErrorSampleRate: 1.0,

	integrations: [
		Sentry.replayIntegration({
			maskAllText: true,
			blockAllMedia: true,
		}),
	],

	// Filter out noisy/non-actionable errors
	beforeSend(event, hint) {
		const error = hint.originalException;
		if (typeof error === "string") {
			// Ignore browser extension errors
			if (error.includes("chrome-extension://")) return null;
		}
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

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["__tests__/**/*.test.ts"],
		environment: "node",
		testTimeout: 30_000,
		hookTimeout: 30_000,
		setupFiles: ["./__tests__/helpers/setup.ts"],
		coverage: {
			provider: "v8",
			// Only measure production source — exclude tests, generated code, scripts
			include: ["prisma/queries/**/*.ts"],
			exclude: [
				"__tests__/**",
				"prisma/generated/**",
				"prisma/zod/**",
				"prisma/scripts/**",
				"drizzle/**",
			],
			reporter: ["text", "text-summary", "json-summary", "html"],
			reportsDirectory: "./coverage",
			// Per-file thresholds for critical financial code
			thresholds: {
				"prisma/queries/org-finance.ts": {
					lines: 90,
					functions: 90,
					branches: 90,
					statements: 90,
				},
				"prisma/queries/payroll.ts": {
					lines: 85,
					functions: 85,
					branches: 85,
					statements: 85,
				},
				"prisma/queries/cost-studies.ts": {
					lines: 80,
					functions: 80,
					branches: 80,
					statements: 80,
				},
			},
		},
	},
});

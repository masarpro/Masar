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
			include: ["lib/permissions/**/*.ts"],
			exclude: ["__tests__/**"],
			reporter: ["text", "text-summary", "json-summary", "html"],
			reportsDirectory: "./coverage",
			thresholds: {
				"lib/permissions/get-user-permissions.ts": {
					lines: 90,
					functions: 90,
					branches: 90,
					statements: 90,
				},
				"lib/permissions/verify-project-access.ts": {
					lines: 90,
					functions: 90,
					branches: 90,
					statements: 90,
				},
			},
		},
	},
});

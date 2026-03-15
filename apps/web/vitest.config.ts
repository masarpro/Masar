import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		include: ["modules/**/__tests__/**/*.test.ts"],
		environment: "node",
		globals: true,
		testTimeout: 15_000,
	},
	resolve: {
		alias: {
			"@shared": path.resolve(__dirname, "modules/shared"),
			"@saas": path.resolve(__dirname, "modules/saas"),
		},
	},
});

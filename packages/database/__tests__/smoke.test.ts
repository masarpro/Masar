import { describe, it, expect } from "vitest";
import { withTestTx } from "./helpers/setup";
import {
	createTestOrganization,
	createTestUser,
	createTestBankAccount,
} from "./helpers/factories";

const HAS_TEST_DB = !!process.env.DATABASE_URL_TEST;

describe.skipIf(!HAS_TEST_DB)("Test infrastructure smoke test", () => {
	it("connects to the test database", async () => {
		await withTestTx(async (tx) => {
			const result = await tx.$queryRawUnsafe("SELECT 1 AS ok");
			expect(result).toBeDefined();
		});
	});

	it("creates and reads an organization inside a transaction", async () => {
		await withTestTx(async (tx) => {
			const org = await createTestOrganization(tx, { name: "Masar Test Org" });
			expect(org.id).toBeDefined();
			expect(org.name).toBe("Masar Test Org");

			// Read it back
			const found = await tx.organization.findUnique({ where: { id: org.id } });
			expect(found).not.toBeNull();
			expect(found!.name).toBe("Masar Test Org");
		});
	});

	it("rolls back — previous org does not persist", async () => {
		await withTestTx(async (tx) => {
			const count = await tx.organization.count({
				where: { name: "Masar Test Org" },
			});
			expect(count).toBe(0);
		});
	});

	it("creates user + bank account with FK relations", async () => {
		await withTestTx(async (tx) => {
			const org = await createTestOrganization(tx);
			const user = await createTestUser(tx, org);
			const bank = await createTestBankAccount(tx, org, user, {
				balance: 25000,
			});

			expect(user.organizationId).toBe(org.id);
			expect(bank.organizationId).toBe(org.id);
			expect(Number(bank.balance)).toBe(25000);
		});
	});
});

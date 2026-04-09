import { db } from "../prisma/client";

async function main() {
  const fe = await db.financeExpense.updateMany({
    where: {
      OR: [{ categoryId: { not: null } }, { subcategoryId: { not: null } }],
    },
    data: { categoryId: null, subcategoryId: null },
  });
  const ce = await db.companyExpense.updateMany({
    where: {
      OR: [{ categoryId: { not: null } }, { subcategoryId: { not: null } }],
    },
    data: { categoryId: null, subcategoryId: null },
  });
  console.log(`Cleared FinanceExpense: ${fe.count} rows`);
  console.log(`Cleared CompanyExpense: ${ce.count} rows`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

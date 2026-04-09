import { db } from "../prisma/client";

async function main() {
  const fe = await db.financeExpense.count({
    where: { categoryId: { not: null } },
  });
  const feSub = await db.financeExpense.count({
    where: { subcategoryId: { not: null } },
  });
  const ce = await db.companyExpense.count({
    where: { categoryId: { not: null } },
  });
  const ceSub = await db.companyExpense.count({
    where: { subcategoryId: { not: null } },
  });
  console.log("FinanceExpense rows with category_id !=null:", fe);
  console.log("FinanceExpense rows with subcategory_id !=null:", feSub);
  console.log("CompanyExpense rows with category_id !=null:", ce);
  console.log("CompanyExpense rows with subcategory_id !=null:", ceSub);

  if (fe > 0) {
    const sample = await db.financeExpense.findFirst({
      where: { categoryId: { not: null } },
      select: {
        id: true,
        expenseNo: true,
        category: true,
        categoryId: true,
        subcategoryId: true,
      },
    });
    console.log("Sample FinanceExpense:", sample);
  }
  if (ce > 0) {
    const sample = await db.companyExpense.findFirst({
      where: { categoryId: { not: null } },
      select: {
        id: true,
        name: true,
        category: true,
        categoryId: true,
        subcategoryId: true,
      },
    });
    console.log("Sample CompanyExpense:", sample);
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

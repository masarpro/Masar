const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'prisma/zod/index.ts');

try {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes("import { Prisma }")) {
    content = content.replace(
      "import * as z from 'zod';",
      "import * as z from 'zod';\nimport { Prisma } from '../generated/client';"
    );
    console.log('✓ Fixed Prisma import in zod/index.ts');
  } else {
    console.log('✓ Prisma import already exists');
  }

  // Fix Decimal defaults: .default(NUMBER) → .default(new Prisma.Decimal(NUMBER))
  // Pattern: z.instanceof(Prisma.Decimal, {...}).default(NUMBER)
  const decimalDefaultRegex = /(z\.instanceof\(Prisma\.Decimal,\s*\{[^}]*\}\))\.default\((\d+(?:\.\d+)?)\)/g;
  const beforeCount = (content.match(decimalDefaultRegex) || []).length;
  content = content.replace(decimalDefaultRegex, '$1.default(new Prisma.Decimal($2))');
  if (beforeCount > 0) {
    console.log(`✓ Fixed ${beforeCount} Decimal default values in zod/index.ts`);
  }

  fs.writeFileSync(filePath, content);
} catch (err) {
  console.error('Error fixing zod import:', err.message);
}

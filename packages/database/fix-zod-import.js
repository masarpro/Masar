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
    fs.writeFileSync(filePath, content);
    console.log('✓ Fixed Prisma import in zod/index.ts');
  } else {
    console.log('✓ Prisma import already exists');
  }
} catch (err) {
  console.error('Error fixing zod import:', err.message);
}

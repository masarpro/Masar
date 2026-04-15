const fs = require('fs');
const path = require('path');

const AR_PATH = 'packages/i18n/translations/ar.json';
const EN_PATH = 'packages/i18n/translations/en.json';

const ar = JSON.parse(fs.readFileSync(AR_PATH, 'utf8'));
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

function getKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function walkFiles(dir, exts = ['.tsx', '.ts']) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === 'dist' || e.name === '.turbo') continue;
      out.push(...walkFiles(full, exts));
    } else if (exts.some(x => e.name.endsWith(x))) {
      out.push(full);
    }
  }
  return out;
}

// Extract both namespace usage AND keys
// Patterns:
//   useTranslations("namespace") -> tracks namespace per variable
//   t("key") / t(`key`) -> relative key under namespace
//   getTranslations("namespace") (server)
function analyzeFile(filePath, content) {
  const results = { namespaces: [], keys: [] };

  // Collect useTranslations / getTranslations calls and variable names
  // Patterns like: const t = useTranslations("ns"); const tX = useTranslations(`ns`);
  const nsPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
  const nsMap = {};
  let m;
  while ((m = nsPattern.exec(content)) !== null) {
    nsMap[m[1]] = m[2];
  }

  // useTranslations() with no namespace -> absolute keys
  const nsEmptyPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*\)/g;
  while ((m = nsEmptyPattern.exec(content)) !== null) {
    nsMap[m[1]] = '';
  }

  // Find t("key") calls — match any variable name that was registered above
  const varNames = Object.keys(nsMap);
  for (const v of varNames) {
    const re = new RegExp(`\\b${v}\\(\\s*["'\`]([^"'\`]+)["'\`]`, 'g');
    while ((m = re.exec(content)) !== null) {
      const key = m[1];
      const ns = nsMap[v];
      const fullKey = ns ? `${ns}.${key}` : key;
      const line = content.substring(0, m.index).split('\n').length;
      results.keys.push({ key: fullKey, raw: key, ns, file: filePath, line });
    }
  }

  return results;
}

function findHardcodedArabic(filePath, content) {
  const results = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('import ')) continue;
    // skip console.log lines
    if (/console\.\w+\(/.test(line)) continue;
    // match any string literal containing Arabic chars
    const strRe = /(["'`])((?:\\.|(?!\1).)*?[\u0600-\u06FF](?:\\.|(?!\1).)*?)\1/g;
    let m;
    while ((m = strRe.exec(line)) !== null) {
      const text = m[2];
      // only keep if actually contains Arabic
      if (!/[\u0600-\u06FF]/.test(text)) continue;
      results.push({ file: filePath, line: i + 1, text, context: trimmed.substring(0, 160) });
    }
  }
  return results;
}

function run() {
  const arKeys = new Set(getKeys(ar));
  const enKeys = new Set(getKeys(en));

  console.log('=== ملفات الترجمة ===');
  console.log(`ar.json: ${arKeys.size} leaf keys`);
  console.log(`en.json: ${enKeys.size} leaf keys`);

  const onlyInEn = [...enKeys].filter(k => !arKeys.has(k));
  const onlyInAr = [...arKeys].filter(k => !enKeys.has(k));

  console.log(`\nمفقود في ar.json: ${onlyInEn.length}`);
  console.log(`مفقود في en.json: ${onlyInAr.length}`);

  fs.writeFileSync('translation-audit-missing-in-ar.txt', onlyInEn.sort().join('\n'));
  fs.writeFileSync('translation-audit-missing-in-en.txt', onlyInAr.sort().join('\n'));

  // Scan code
  const dirs = ['apps/web/modules', 'apps/web/app', 'apps/web/components'];
  const allFiles = [];
  for (const d of dirs) allFiles.push(...walkFiles(d));
  console.log(`\nTS/TSX files scanned: ${allFiles.length}`);

  const allKeyUsages = [];
  const allHardcoded = [];
  for (const f of allFiles) {
    let content;
    try { content = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const a = analyzeFile(f, content);
    allKeyUsages.push(...a.keys);
    const h = findHardcodedArabic(f, content);
    allHardcoded.push(...h);
  }

  const uniqueUsedKeys = new Set(allKeyUsages.map(k => k.key));
  console.log(`\nمفاتيح مستخدمة (unique): ${uniqueUsedKeys.size}`);
  console.log(`استخدامات إجمالية: ${allKeyUsages.length}`);

  const usedMissingAr = [...uniqueUsedKeys].filter(k => !arKeys.has(k));
  const usedMissingEn = [...uniqueUsedKeys].filter(k => !enKeys.has(k));

  console.log(`\n❌ مفاتيح مستخدمة في الكود ومفقودة في ar.json: ${usedMissingAr.length}`);
  console.log(`❌ مفاتيح مستخدمة في الكود ومفقودة في en.json: ${usedMissingEn.length}`);

  fs.writeFileSync('translation-audit-used-missing-ar.txt', usedMissingAr.sort().join('\n'));
  fs.writeFileSync('translation-audit-used-missing-en.txt', usedMissingEn.sort().join('\n'));

  // Map used-missing -> list of (file:line) that used them
  const usageMap = {};
  for (const u of allKeyUsages) {
    if (!arKeys.has(u.key) || !enKeys.has(u.key)) {
      if (!usageMap[u.key]) usageMap[u.key] = [];
      usageMap[u.key].push(`${u.file}:${u.line}`);
    }
  }
  const usageLines = Object.entries(usageMap)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k, locs]) => `${k}\n    ${locs.slice(0, 5).join('\n    ')}${locs.length > 5 ? `\n    ... +${locs.length - 5} more` : ''}`)
    .join('\n');
  fs.writeFileSync('translation-audit-used-missing-with-locations.txt', usageLines);

  // Hardcoded Arabic
  console.log(`\n⚠️ نصوص عربية hardcoded: ${allHardcoded.length}`);
  const byModule = {};
  for (const h of allHardcoded) {
    const parts = h.file.split(/[\\\/]/);
    const idx = parts.indexOf('saas');
    const mod = idx >= 0 && parts[idx + 1] ? `saas/${parts[idx + 1]}` : parts.slice(0, 3).join('/');
    byModule[mod] = (byModule[mod] || 0) + 1;
  }
  console.log('التوزيع حسب الوحدة:');
  Object.entries(byModule).sort(([, a], [, b]) => b - a).forEach(([m, c]) => console.log(`  ${m}: ${c}`));

  const hardcodedReport = allHardcoded.map(h => `${h.file}:${h.line} — "${h.text}"`).join('\n');
  fs.writeFileSync('translation-audit-hardcoded.txt', hardcodedReport);

  // Summary JSON for programmatic use
  const summary = {
    arKeys: arKeys.size,
    enKeys: enKeys.size,
    missingInAr: onlyInEn.length,
    missingInEn: onlyInAr.length,
    uniqueUsedKeys: uniqueUsedKeys.size,
    totalUsages: allKeyUsages.length,
    usedMissingAr: usedMissingAr.length,
    usedMissingEn: usedMissingEn.length,
    hardcodedCount: allHardcoded.length,
    hardcodedByModule: byModule,
  };
  fs.writeFileSync('translation-audit-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n📁 تقارير محفوظة: translation-audit-*.txt و translation-audit-summary.json');
}

run();

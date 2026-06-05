-- ════════════════════════════════════════════════════════════════════════
-- هجرة يدوية: ميزة المسودات (Drafts) للفواتير وعروض الأسعار
-- آمنة وإضافية فقط (لا تحذف أي بيانات). idempotent (يمكن تشغيلها أكثر من مرة).
--
-- الطريقة المفضّلة:  pnpm --filter @repo/database push
-- البديل السريع:     الصق هذا الملف في Supabase → SQL Editor ونفّذه.
--   (نفّذ "الخطوة 1" أولاً وحدها، ثم "الخطوة 2".)
-- ════════════════════════════════════════════════════════════════════════

-- ── الخطوة 1: قيم enum الجديدة (نفّذها أولاً وحدها) ──
ALTER TYPE "OrgAuditAction" ADD VALUE IF NOT EXISTS 'INVOICE_DRAFT_CREATED';
ALTER TYPE "OrgAuditAction" ADD VALUE IF NOT EXISTS 'INVOICE_DRAFT_COMMITTED';
ALTER TYPE "OrgAuditAction" ADD VALUE IF NOT EXISTS 'INVOICE_DRAFT_DISCARDED';
ALTER TYPE "OrgAuditAction" ADD VALUE IF NOT EXISTS 'QUOTATION_DRAFT_CREATED';
ALTER TYPE "OrgAuditAction" ADD VALUE IF NOT EXISTS 'QUOTATION_DRAFT_COMMITTED';
ALTER TYPE "OrgAuditAction" ADD VALUE IF NOT EXISTS 'QUOTATION_DRAFT_DISCARDED';

-- ── الخطوة 2: الأعمدة + المفاتيح + الفهارس ──
-- الفواتير
ALTER TABLE "finance_invoices" ADD COLUMN IF NOT EXISTS "is_draft" boolean NOT NULL DEFAULT false;
ALTER TABLE "finance_invoices" ADD COLUMN IF NOT EXISTS "source_invoice_id" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'finance_invoices_source_invoice_id_fkey'
  ) THEN
    ALTER TABLE "finance_invoices"
      ADD CONSTRAINT "finance_invoices_source_invoice_id_fkey"
      FOREIGN KEY ("source_invoice_id") REFERENCES "finance_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "finance_invoices_organization_id_is_draft_idx" ON "finance_invoices" ("organization_id", "is_draft");
CREATE INDEX IF NOT EXISTS "finance_invoices_source_invoice_id_idx" ON "finance_invoices" ("source_invoice_id");

-- عروض الأسعار
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "is_draft" boolean NOT NULL DEFAULT false;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "source_quotation_id" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotations_source_quotation_id_fkey'
  ) THEN
    ALTER TABLE "quotations"
      ADD CONSTRAINT "quotations_source_quotation_id_fkey"
      FOREIGN KEY ("source_quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "quotations_organization_id_is_draft_idx" ON "quotations" ("organization_id", "is_draft");
CREATE INDEX IF NOT EXISTS "quotations_source_quotation_id_idx" ON "quotations" ("source_quotation_id");

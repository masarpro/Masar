# تقرير تقييم أضرار — ميزة سحوبات المالك

**التاريخ:** 2026-04-05T20:03 UTC
**البيئة:** Production (app-masar.com)
**قاعدة البيانات:** Supabase PostgreSQL (ap-south-1/Mumbai)
**المفحوص بواسطة:** Claude Code (Read-Only Audit)

---

## 1. ملخص تنفيذي

- **حجم المشكلة:** منخفض
- **الأضرار المكتشفة:** لا
- **هل البيانات الحقيقية للعملاء متأثرة؟** لا
- **هل القيود المحاسبية سليمة؟** نعم — صفر قيود جديدة
- **الإجراء الموصى به:** إصلاح permissions فقط — لا حاجة لأي cleanup أو rollback

---

## 2. تحليل المشكلة الجذرية

### 2.1 — نظام الصلاحيات الصحيح

المصدر: `packages/database/prisma/permissions.ts`

**8 أقسام (sections) مع الإجراءات (actions) الصالحة لكل قسم:**

| القسم | الإجراءات الصالحة |
|-------|-------------------|
| **projects** | `view`, `create`, `edit`, `delete`, `viewFinance`, `manageTeam` |
| **quantities** | `view`, `create`, `edit`, `delete`, `pricing` |
| **pricing** | `view`, `studies`, `quotations`, `pricing`, `leads`, `editQuantities`, `approveQuantities`, `editSpecs`, `approveSpecs`, `editCosting`, `approveCosting`, `editSellingPrice`, `generateQuotation`, `convertToProject` |
| **finance** | `view`, `quotations`, `invoices`, `payments`, `reports`, `settings` |
| **employees** | `view`, `create`, `edit`, `delete`, `payroll`, `attendance` |
| **company** | `view`, `expenses`, `assets`, `reports` |
| **settings** | `organization`, `users`, `roles`, `billing`, `integrations` |
| **reports** | `view`, `create`, `approve` |

**النقطة الحرجة:**
- قسم `settings` **ليس فيه** `view` أو `edit` — إجراءاته هي: `organization`, `users`, `roles`, `billing`, `integrations`
- قسم `finance` **ليس فيه** `edit` أو `create` — إجراءاته هي: `view`, `quotations`, `invoices`, `payments`, `reports`, `settings`

**دالة التحقق (`hasPermission`):**
```typescript
return (sectionPerms as Record<string, boolean>)[action] ?? false;
```
أي إجراء غير موجود في القسم يُرجع `false` → 403 Forbidden. **حتى دور OWNER يُرفض** لأن الإجراء ببساطة غير موجود في الكائن.

### 2.2 — الاستخدام الخاطئ في الملفات الجديدة

#### organization-owners.ts (7 endpoints)

| السطر | الـ endpoint | section | action | صالح؟ | السبب |
|-------|-------------|---------|--------|-------|-------|
| 43 | listOwners | settings | view | ❌ | settings ليس فيه "view" |
| 101 | getOwnerById | settings | view | ❌ | settings ليس فيه "view" |
| 170 | createOwner | settings | edit | ❌ | settings ليس فيه "edit" |
| 269 | updateOwner | settings | edit | ❌ | settings ليس فيه "edit" |
| 378 | deactivateOwner | settings | edit | ❌ | settings ليس فيه "edit" |
| 446 | getTotalOwnership | settings | view | ❌ | settings ليس فيه "view" |
| 490 | ensureDrawingsSystem | finance | view | ✅ | finance.view موجود |

**النتيجة: 6 من 7 endpoints معطّلة (86%)**

#### owner-drawings.ts (9 endpoints)

| السطر | الـ endpoint | section | action | صالح؟ | السبب |
|-------|-------------|---------|--------|-------|-------|
| 61 | listDrawings | finance | view | ✅ | |
| 130 | getDrawingById | finance | view | ✅ | |
| 215 | createDrawing | finance | create | ❌ | finance ليس فيه "create" |
| 487 | approveDrawing | finance | edit | ❌ | finance ليس فيه "edit" |
| 662 | cancelDrawing | finance | edit | ❌ | finance ليس فيه "edit" |
| 780 | checkOverdraw | finance | view | ✅ | |
| 917 | getCompanySummary | finance | view | ✅ | |
| 1106 | getProjectSummary | finance | view | ✅ | |
| 1188 | getOwnerSummary | finance | view | ✅ | |

**النتيجة: 3 من 9 endpoints معطّلة (33%) — وهي بالضبط write endpoints**

#### year-end-closing.ts (4 endpoints)

| السطر | الـ endpoint | section | action | صالح؟ | السبب |
|-------|-------------|---------|--------|-------|-------|
| 34 | previewYearEnd | finance | view | ✅ | |
| 292 | executeYearEnd | finance | edit | ❌ | finance ليس فيه "edit" |
| 638 | yearEndHistory | finance | view | ✅ | |
| 688 | reverseYearEnd | finance | edit | ❌ | finance ليس فيه "edit" |

**النتيجة: 2 من 4 endpoints معطّلة (50%)**

### 2.3 — ملخص الـ endpoints المتأثرة

| الملف | إجمالي | معطّل | يعمل |
|-------|--------|-------|------|
| organization-owners.ts | 7 | 6 | 1 |
| owner-drawings.ts | 9 | 3 | 6 |
| year-end-closing.ts | 4 | 2 | 2 |
| **المجموع** | **20** | **11** | **9** |

**11 endpoint معطّلة — كلها write operations. الـ read endpoints (9) تعمل بشكل صحيح.**

---

## 3. حالة البيانات الحالية

### 3.1 — الجداول الجديدة

| الجدول | عدد الـ records | الحالة | التعليق |
|--------|-----------------|--------|---------|
| organization_owners | 0 | ✅ نظيف | لم يُنشأ أي شريك (حتى الافتراضي) |
| owner_drawings | 0 | ✅ نظيف | لم تُنشأ أي سحوبات |
| year_end_closings | 0 | ✅ نظيف | لم يُنفّذ أي إقفال |

### 3.2 — حسابات دليل الحسابات المُضافة

- حساب 3400 (سحوبات الشركاء): **0 منظمة** — لم يُنشأ
- حساب 3410 (سحوبات المالك): **0 منظمة** — لم يُنشأ
- حساب 3500 (توزيعات الأرباح): **0 منظمة** — لم يُنشأ
- **عدم اتساق مكتشف:** لا — لا توجد حسابات جديدة أصلاً

**السبب:** دالة `ensureOwnerDrawingsSystem` لم تُستدعى من production لأن:
1. الـ endpoint الخاص بها (`ensureDrawingsSystem`) يستخدم `finance.view` وهو صالح
2. لكنها تُستدعى من الـ frontend عبر `AccountingSeedCheck.tsx` — والأغلب أن الصفحة لم تُفتح بعد الـ deploy
3. أو أنه لم يكن هناك مستخدم دخل صفحة سحوبات المالك بعد

### 3.3 — OrganizationOwner records بالتفصيل

لا توجد records. الجدول فارغ تماماً.

### 3.4 — JournalEntry references جديدة

- عدد القيود: **0**
- التأثير على التقارير المالية: **لا يوجد**

### 3.5 — OrgAuditLog

- إجمالي محاولات: **0**
- نجحت: **0**
- فشلت: **0**
- المنظمات المتأثرة: **0**

---

## 4. المنظمات المتأثرة

لا توجد منظمات متأثرة.

| الإحصائية | القيمة |
|----------|--------|
| إجمالي المنظمات | 17 |
| منظمات لديها دليل حسابات | 3 |
| منظمات لديها نظام سحوبات (3400) | 0 |
| منظمات بها بيانات جديدة | 0 |

---

## 5. السيناريو المُكتشف

### 🟢 السيناريو أ: لا ضرر — Schema فقط

- الجداول الثلاث الجديدة موجودة (db push نجح) لكنها **فارغة تماماً**
- **صفر** records في OrganizationOwner (حتى الشريك الافتراضي لم يُنشأ)
- **صفر** records في OwnerDrawing
- **صفر** records في YearEndClosing
- **صفر** حسابات جديدة في ChartAccount (34xx / 3500)
- **صفر** قيود محاسبية بأنواع مرجعية جديدة
- **صفر** سجلات تدقيق لأحداث الشركاء/السحوبات

**التفسير:** الـ `db push` أنشأ الجداول الثلاث في قاعدة البيانات بنجاح، لكن لم يصل أي طلب ناجح لكتابة بيانات فيها. الأخطاء 403 منعت كل عمليات الكتابة، والأغلب أن حتى الـ ensureOwnerDrawingsSystem لم تُستدعَ لأن المستخدم لم يفتح الصفحة الجديدة من الـ frontend.

**التصرف:** إصلاح permissions فقط. لا حاجة لأي cleanup أو rollback.

---

## 6. الإجراءات الموصى بها (بالترتيب)

### خطوة 1: إصلاح Permissions (الأولوية القصوى)

**الملف:** `packages/api/modules/accounting/procedures/organization-owners.ts`

| الـ endpoint | الحالي (معطّل) | المقترح |
|-------------|----------------|---------|
| listOwners | `settings` / `view` | `finance` / `view` |
| getOwnerById | `settings` / `view` | `finance` / `view` |
| createOwner | `settings` / `edit` | `finance` / `settings` |
| updateOwner | `settings` / `edit` | `finance` / `settings` |
| deactivateOwner | `settings` / `edit` | `finance` / `settings` |
| getTotalOwnership | `settings` / `view` | `finance` / `view` |

**الملف:** `packages/api/modules/accounting/procedures/owner-drawings.ts`

| الـ endpoint | الحالي (معطّل) | المقترح |
|-------------|----------------|---------|
| createDrawing | `finance` / `create` | `finance` / `payments` |
| approveDrawing | `finance` / `edit` | `finance` / `payments` |
| cancelDrawing | `finance` / `edit` | `finance` / `payments` |

**الملف:** `packages/api/modules/accounting/procedures/year-end-closing.ts`

| الـ endpoint | الحالي (معطّل) | المقترح |
|-------------|----------------|---------|
| executeYearEnd | `finance` / `edit` | `finance` / `settings` |
| reverseYearEnd | `finance` / `edit` | `finance` / `settings` |

**المنطق:** 
- قراءة بيانات الشركاء/السحوبات → `finance.view` (متاحة لـ OWNER + ACCOUNTANT + PROJECT_MANAGER)
- إنشاء/اعتماد/إلغاء سحوبات → `finance.payments` (متاحة لـ OWNER + ACCOUNTANT)
- إنشاء/تعديل/تعطيل شركاء → `finance.settings` (متاحة لـ OWNER + ACCOUNTANT فقط — مناسب لحساسية العملية)
- إقفال نهاية السنة → `finance.settings` (أكثر عملية حساسة — يجب أن تكون محصورة)

### خطوة 2: اختبار على localhost

```bash
# 1. أعد توليد Prisma client (لتشمل الجداول الجديدة)
pnpm --filter @repo/database db:generate

# 2. شغّل التطوير
pnpm dev

# 3. سجّل دخول بحساب OWNER → اذهب لصفحة سحوبات المالك
# 4. جرّب: إنشاء شريك ← يجب أن ينجح الآن
# 5. جرّب: إنشاء سحب ← يجب أن ينجح
# 6. تحقق من القيود المحاسبية
```

### خطوة 3: Deploy مع مراقبة

```bash
# بعد التأكد من localhost
git add packages/api/modules/accounting/procedures/organization-owners.ts
git add packages/api/modules/accounting/procedures/owner-drawings.ts
git add packages/api/modules/accounting/procedures/year-end-closing.ts
git commit -m "fix: correct permission actions for owner drawings endpoints"
git push

# مراقبة في Sentry لأي أخطاء 403 جديدة
# مراقبة في audit logs لأي OWNER_CREATED / OWNER_DRAWING_CREATED
```

---

## 7. ملاحظات للمستقبل

### 7.1 — لماذا حدث هذا الخطأ

الـ `section: "settings", action: "edit"` و `section: "finance", action: "create"` هي أنماط شائعة في أنظمة صلاحيات أخرى (CRUD pattern). لكن نظام مسار يستخدم actions مخصصة لكل section — ليس CRUD عام. هذا يعني أن `edit` ليس action عالمي.

### 7.2 — كيف نتجنبه

1. **فحص compile-time:** يمكن تحويل `action: string` في `verifyOrganizationAccess` إلى union type يعتمد على الـ section:
   ```typescript
   verifyOrganizationAccess(orgId, userId, { section: "finance", action: "payments" })
   // TypeScript يرفض: action: "edit" لأنه ليس من FinancePermissions
   ```

2. **اختبار unit:** إضافة test يفحص كل استدعاء `verifyOrganizationAccess` ويتأكد أن الـ action موجود في الـ section المحدد.

3. **CI check:** grep لكل استخدامات `verifyOrganizationAccess` + مطابقة مع الـ permissions matrix.

### 7.3 — الحاجة لبيئة staging

هذه الحادثة تؤكد أهمية بيئة staging منفصلة عن production. لو كان هناك staging:
- كانت أخطاء 403 ستُكتشف قبل الوصول لـ production
- لم تكن ستحتاج لفحص قاعدة بيانات production

---

## 8. ملحق: نتائج سكربت الفحص الكامل

```
======================================================================
  OWNER DRAWINGS — READ-ONLY DAMAGE ASSESSMENT
  Date: 2026-04-05T20:03:06.732Z
======================================================================

─── 3.1 Record Counts in New Tables ───
  Tables found: organization_owners, owner_drawings, year_end_closings
  OrganizationOwner: 0
  OwnerDrawing:      0
  YearEndClosing:    0

─── 3.2 OrganizationOwner Details ───
  (no records)

─── 3.3 New Chart Accounts (34xx, 3500) ───
  (no accounts with codes 34xx or 3500)

─── 3.4 OwnerDrawing Records ───
  ✅ Zero records — no drawings were created

─── 3.5 YearEndClosing Records ───
  ✅ Zero records — no year-end closings were executed

─── 3.6 Journal Entries with New Reference Types ───
  ✅ Zero journal entries — no accounting impact

─── 3.7 OrgAuditLog for Owner Events ───
  ✅ Zero audit log entries — no successful operations

─── 3.8 Organization Context ───
  Total organizations: 17
  Orgs with accounting (have 1110): 3

─── 3.9 Orgs with Owner Drawings System (have 3400) ───
  Orgs with 3400 (drawings system): 0 out of 17 total

======================================================================
  SUMMARY
======================================================================

  🟢 SCENARIO A: No damage — Migration only
    - All OrganizationOwner records are default migrations
    - Zero OwnerDrawing records
    - Zero YearEndClosing records
    - Zero journal entries with new reference types
    - RECOMMENDATION: Fix permissions only. Existing data is correct.

  Affected organizations: 0
  Audit log entries: 0
  Scenario: A
```

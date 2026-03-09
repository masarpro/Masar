# برومبت بناء منظومة الاختبارات الشاملة لمنصة مسار

> **ملاحظة:** هذا البرومبت مقسّم إلى 7 مراحل. نفّذ كل مرحلة بالترتيب. استخدم Plan Mode أولاً قبل كل مرحلة.
> **هام:** قبل البدء، اقرأ الملفات التالية لفهم البنية الحالية:
> - `packages/api/orpc/procedures.ts`
> - `packages/api/orpc/router.ts`
> - `packages/database/prisma/schema.prisma`
> - `packages/database/prisma/permissions.ts`
> - `packages/api/lib/rate-limit.ts`
> - `packages/api/lib/feature-gate.ts`
> - `packages/api/lib/permissions/verify-project-access.ts`
> - `packages/database/__tests__/invoice-calculations.test.ts` (الاختبارات الموجودة كمرجع للأنماط)
> - `turbo.json`
> - `vitest` config إذا موجود في أي `package.json`

---

## المرحلة 1: البنية التحتية للاختبارات (Testing Infrastructure)

### الهدف
تجهيز بيئة الاختبارات الكاملة بحيث تعمل مع Monorepo (Turborepo + pnpm workspaces) بدون تعارض مع الاختبارات الموجودة (533 test في invoice-calculations).

### المطلوب

#### 1.1 إعداد Vitest على مستوى المشروع

أنشئ أو عدّل ملف `vitest.workspace.ts` في root المشروع:

```
الملف: vitest.workspace.ts (root)
```

يجب أن يشمل كل الـ packages التالية:
- `packages/database` (موجود مسبقاً — لا تعدّل اختباراته)
- `packages/api` (جديد)
- `packages/auth` (جديد)
- `packages/utils` (جديد)

#### 1.2 إعداد Vitest config لكل package

أنشئ `vitest.config.ts` لكل package جديد:

**`packages/api/vitest.config.ts`:**
- `environment: 'node'`
- `globals: true`
- `setupFiles: ['./__tests__/setup.ts']`
- `include: ['./__tests__/**/*.test.ts']`
- `testTimeout: 30000` (لأن الاختبارات تتعامل مع DB)
- `poolOptions.threads.singleThread: true` (لمنع race conditions على DB)

**`packages/auth/vitest.config.ts`:**
- نفس الإعدادات مع `testTimeout: 15000`

#### 1.3 ملف Setup المشترك للاختبارات

أنشئ `packages/api/__tests__/setup.ts`:

```typescript
// هذا الملف يُنفَّذ قبل كل ملف اختبار
// المطلوب:
// 1. تحميل environment variables من .env.test (إذا موجود) أو .env
// 2. إنشاء Prisma Client خاص بالاختبارات
// 3. دالة createTestContext() تُرجع context يحاكي oRPC context:
//    - session مزيف (mock session)
//    - user مزيف مع organizationId
//    - prisma client حقيقي (يتصل بـ test DB أو DB الحقيقية مع transaction rollback)
// 4. دالة cleanupTestData() لتنظيف البيانات بعد كل test suite
// 5. Mock لـ rate-limit (دائماً يسمح)
// 6. Mock لـ storage/S3 operations
```

#### 1.4 Test Helpers و Factories

أنشئ `packages/api/__tests__/helpers/`:

**`factories.ts`** — دوال لإنشاء بيانات اختبار:
```typescript
// createTestOrganization() → ينشئ منظمة + owner member + أدوار افتراضية
// createTestUser() → ينشئ مستخدم مع session
// createTestProject(orgId) → ينشئ مشروع مرتبط بمنظمة
// createTestInvoice(orgId, projectId) → ينشئ فاتورة
// createTestEmployee(orgId) → ينشئ موظف
// createTestClient(orgId) → ينشئ عميل
// createTestMember(orgId, userId, roleId) → ينشئ عضوية
// createTestRole(orgId, permissions) → ينشئ دور مع صلاحيات محددة
```

**`mock-context.ts`** — بناء context وهمي:
```typescript
// mockProtectedContext(overrides?) → يحاكي protectedProcedure context
// mockSubscriptionContext(overrides?) → يحاكي subscriptionProcedure context  
// mockAdminContext() → يحاكي adminProcedure context
// mockOwnerPortalContext(token) → يحاكي owner portal token context
```

**`assertions.ts`** — تأكيدات مخصصة:
```typescript
// expectForbidden(promise) → يتوقع ORPCError code: FORBIDDEN
// expectNotFound(promise) → يتوقع ORPCError code: NOT_FOUND
// expectUnauthorized(promise) → يتوقع ORPCError code: UNAUTHORIZED
// expectBadRequest(promise) → يتوقع ORPCError code: BAD_REQUEST
// expectConflict(promise) → يتوقع ORPCError code: CONFLICT
```

#### 1.5 تحديث turbo.json

أضف task `test` إذا غير موجود:
```json
{
  "test": {
    "dependsOn": ["^generate"],
    "cache": false
  }
}
```

#### 1.6 تحديث root package.json

أضف scripts:
```json
{
  "test": "turbo test",
  "test:api": "pnpm --filter @repo/api test",
  "test:auth": "pnpm --filter @repo/auth test", 
  "test:coverage": "turbo test -- --coverage"
}
```

### معايير النجاح
- [ ] `pnpm test` يشتغل بدون أخطاء
- [ ] الاختبارات الموجودة (533 invoice tests) تمر بنجاح
- [ ] `packages/api/__tests__/setup.ts` يتصل بالـ DB بنجاح
- [ ] Factory functions تنشئ بيانات وتنظّفها

---

## المرحلة 2: اختبارات نظام الصلاحيات (Permission System Tests)

### الهدف
اختبار نظام الصلاحيات بالكامل — 42 صلاحية × 6 أدوار × سيناريوهات cross-tenant.

### الملفات المرجعية
- `packages/database/prisma/permissions.ts`
- `packages/api/lib/permissions/verify-project-access.ts`
- `packages/api/lib/permissions/get-user-permissions.ts`

### المطلوب

#### 2.1 اختبارات Permission Resolution

أنشئ `packages/api/__tests__/permissions/permission-resolution.test.ts`:

```
اختبر الآلية التالية:
customPermissions (User-level) → organizationRole (Role-level) → EMPTY_PERMISSIONS

الحالات:
1. مستخدم بدور OWNER → يحصل على كل الصلاحيات (42/42)
2. مستخدم بدور PROJECT_MANAGER → يحصل على صلاحيات PM فقط
3. مستخدم بدور ACCOUNTANT → يحصل على صلاحيات المحاسب فقط
4. مستخدم بدور ENGINEER → يحصل على صلاحيات المهندس فقط
5. مستخدم بدور SUPERVISOR → يحصل على صلاحيات المشرف فقط
6. مستخدم بـ customPermissions → تتجاوز صلاحيات الدور
7. مستخدم بدور مخصص (custom role) → يأخذ صلاحيات الدور المخصص
```

#### 2.2 اختبارات Cross-Tenant Isolation

أنشئ `packages/api/__tests__/permissions/cross-tenant.test.ts`:

```
الحالات الحرجة:
1. مستخدم من org-A يحاول الوصول لمشروع في org-B → FORBIDDEN
2. مستخدم من org-A يحاول الوصول لفاتورة في org-B → FORBIDDEN
3. مستخدم من org-A يحاول الوصول لموظف في org-B → FORBIDDEN
4. getUserPermissions() مع organizationId مختلف → EMPTY_PERMISSIONS
5. verifyProjectAccess() مع مشروع من منظمة أخرى → يرمي خطأ
6. Admin (super admin) يقدر يوصل لكل المنظمات → allowed
```

#### 2.3 اختبارات verifyProjectAccess

أنشئ `packages/api/__tests__/permissions/verify-project-access.test.ts`:

```
الحالات:
1. عضو في المشروع + صلاحية مطلوبة → allowed
2. عضو في المنظمة لكن ليس في المشروع → يعتمد على الصلاحيات
3. ليس عضو في المنظمة → FORBIDDEN
4. المشروع غير موجود → NOT_FOUND
5. المشروع محذوف (archived) → التصرف المتوقع
6. projectId غير صالح (invalid CUID) → BAD_REQUEST
```

#### 2.4 اختبارات Permission Matrix الكاملة

أنشئ `packages/api/__tests__/permissions/permission-matrix.test.ts`:

```
لكل واحدة من الـ 8 مجموعات صلاحيات:
- projects (7 صلاحيات)
- quantities (5 صلاحيات)
- pricing (5 صلاحيات)
- finance (6 صلاحيات)
- employees (6 صلاحيات)
- company (4 صلاحيات)
- settings (5 صلاحيات)
- reports (3 صلاحيات)

اختبر أن كل دور (OWNER, PM, ACCOUNTANT, ENGINEER, SUPERVISOR) يحصل على الصلاحيات الصحيحة فقط.
استخدم test.each أو حلقات لتغطية كل التوليفات.
```

### معايير النجاح
- [ ] ~200+ حالة اختبار للصلاحيات
- [ ] تغطية 100% لـ permission-resolution logic
- [ ] تغطية 100% لـ cross-tenant guard
- [ ] كل الاختبارات تمر بنجاح

---

## المرحلة 3: اختبارات Feature Gate و Rate Limiting

### الهدف
اختبار نظام الاشتراكات (FREE vs PRO) و Rate Limiting.

### الملفات المرجعية
- `packages/api/lib/feature-gate.ts`
- `packages/api/lib/rate-limit.ts`
- `packages/api/orpc/procedures.ts` (subscriptionProcedure logic)

### المطلوب

#### 3.1 اختبارات Feature Gate

أنشئ `packages/api/__tests__/feature-gate/feature-gate.test.ts`:

```
حدود FREE plan:
- projects.create → max 1 مشروع
- members.invite → max 2 أعضاء
- ai.chat → max 10 محادثات
- export.pdf → محظور
- كل write operations → محظور (soft wall: النماذج تتعبأ لكن الحفظ يُحظر)

حدود PRO plan:
- كل شيء مفتوح بدون حدود

حالات خاصة:
1. FREE plan → يحاول إنشاء مشروع ثاني → FORBIDDEN مع رسالة مناسبة
2. FREE plan → يحاول دعوة عضو ثالث → FORBIDDEN
3. FREE plan → يحاول إنشاء محادثة AI رقم 11 → FORBIDDEN
4. FREE plan → يحاول تصدير PDF → FORBIDDEN
5. PRO plan منتهي (expired trial) → يتحول لـ FREE behavior
6. PRO plan مع isFreeOverride → يعمل كـ PRO
7. Admin user → يتجاوز كل القيود
8. Organization status SUSPENDED → كل write operations محظورة
9. Organization status CANCELLED → كل write operations محظورة
```

#### 3.2 اختبارات subscriptionProcedure

أنشئ `packages/api/__tests__/feature-gate/subscription-procedure.test.ts`:

```
اختبر middleware chain كامل:
1. مستخدم بدون session → UNAUTHORIZED
2. مستخدم معطّل (isActive: false) → FORBIDDEN
3. مستخدم FREE plan يحاول mutation → يُفحص feature gate
4. مستخدم PRO plan → يمر
5. مستخدم trial منتهي → يتعامل كـ FREE
6. Admin user → يتجاوز كل الفحوصات
```

#### 3.3 اختبارات Rate Limiting

أنشئ `packages/api/__tests__/rate-limit/rate-limit.test.ts`:

```
اختبر كل preset:
1. READ (60/min) → 60 طلب يمر، الـ 61 يُرفض مع TOO_MANY_REQUESTS
2. WRITE (20/min) → 20 طلب يمر، الـ 21 يُرفض
3. UPLOAD (10/min) → 10 يمر، الـ 11 يُرفض
4. STRICT (5/min) → 5 يمر، الـ 6 يُرفض
5. MESSAGE (30/min) → 30 يمر، الـ 31 يُرفض
6. TOKEN (30/min) → 30 يمر، الـ 31 يُرفض

حالات خاصة:
7. مفاتيح مختلفة (مستخدمين مختلفين) → لا يتأثرون ببعض
8. Redis fallback → لما Redis يفشل، in-memory يشتغل
9. Circuit breaker → بعد 3 فشل Redis، ينتقل لـ in-memory
```

### معايير النجاح
- [ ] ~80+ حالة اختبار
- [ ] كل feature gate limits مُختبرة
- [ ] Rate limiting presets مُختبرة
- [ ] كل الاختبارات تمر

---

## المرحلة 4: اختبارات ZATCA و الحسابات المالية الإضافية

### الهدف
اختبار توليد ZATCA QR Code و TLV encoding و الحسابات المالية غير المُغطاة.

### الملفات المرجعية
- `packages/api/lib/zatca/qr-generator.ts`
- `packages/api/lib/zatca/tlv-encoder.ts`
- `packages/database/__tests__/invoice-calculations.test.ts` (لا تعدّله — كمرجع فقط)

### المطلوب

#### 4.1 اختبارات TLV Encoder

أنشئ `packages/api/__tests__/zatca/tlv-encoder.test.ts`:

```
1. Tag 1 (اسم البائع) → TLV صحيح مع UTF-8 encoding للعربية
2. Tag 2 (الرقم الضريبي) → 15 رقم بالضبط
3. Tag 3 (تاريخ الفاتورة) → ISO 8601 format
4. Tag 4 (الإجمالي مع VAT) → Decimal(15,2) format
5. Tag 5 (مبلغ VAT) → Decimal(15,2) format
6. تسلسل TLV كامل → كل الـ 5 tags مرتبة
7. Base64 encoding → ناتج صالح
8. أحرف عربية في اسم البائع → encoding صحيح
9. مبالغ كبيرة (مليون+) → لا فقدان دقة
10. مبالغ صفرية → يتعامل معها صح
```

#### 4.2 اختبارات QR Generator

أنشئ `packages/api/__tests__/zatca/qr-generator.test.ts`:

```
1. generateZatcaQR() مع بيانات كاملة → Base64 string صالح
2. decode الناتج → يرجع نفس الـ 5 tags
3. بيانات بائع عربية → QR صالح
4. رقم ضريبي غير صالح (أقل/أكثر من 15 رقم) → خطأ
5. تاريخ غير صالح → خطأ
6. مبلغ سالب → خطأ أو يتعامل معه
7. QR الناتج → يمكن تحويله لصورة PNG عبر مكتبة qrcode
```

#### 4.3 اختبارات Decimal Precision

أنشئ `packages/api/__tests__/finance/decimal-precision.test.ts`:

```
اختبر أن التحويل Decimal → Number لا يفقد الدقة:
1. مبلغ عادي: 1234.56 → يبقى 1234.56
2. مبلغ كبير: 999999999999.99 → يبقى صحيح
3. مبلغ صغير جداً: 0.01 → يبقى 0.01
4. حساب VAT: 1000 × 15% = 150.00 بالضبط
5. حساب discount: 1000 - 10% = 900.00 بالضبط
6. تجميع فواتير: مجموع 100 فاتورة بمبالغ مختلفة → لا فقدان
7. Retention calculation: مبلغ × نسبة احتفاظ → دقيق
8. مبلغ يتجاوز Number.MAX_SAFE_INTEGER → اكتشاف المشكلة
```

### معايير النجاح
- [ ] ~60+ حالة اختبار
- [ ] ZATCA TLV encoding مُختبر 100%
- [ ] QR generation مُختبر 100%
- [ ] Decimal edge cases مُوثّقة

---

## المرحلة 5: اختبارات API Endpoints الحرجة (Integration Tests)

### الهدف
اختبار أهم الـ API endpoints — الوحدات المالية والمشاريع والمستخدمين.

### ملاحظة مهمة
هذه اختبارات integration — تستدعي الـ handler functions مباشرة مع context وهمي (من المرحلة 1).
لا تستخدم HTTP requests فعلية — استدعِ دوال الـ modules مباشرة مع prisma حقيقي.

### المطلوب

#### 5.1 اختبارات إدارة المشاريع

أنشئ `packages/api/__tests__/modules/projects.test.ts`:

```
CRUD:
1. إنشاء مشروع → يرجع مشروع مع projectNo تلقائي
2. إنشاء مشروع ثاني بنفس الـ slug → CONFLICT
3. قراءة مشروع موجود → البيانات صحيحة
4. قراءة مشروع غير موجود → NOT_FOUND
5. تحديث مشروع → البيانات تتحدث
6. حذف مشروع → soft delete (الحالة تتغير لـ ARCHIVED)
7. قائمة المشاريع → pagination يعمل (max 50)

Feature Gate:
8. FREE plan → إنشاء مشروع أول يمر
9. FREE plan → إنشاء مشروع ثاني يُرفض
10. PRO plan → إنشاء مشاريع متعددة يمر

Permissions:
11. مستخدم بصلاحية projects.create → ينشئ
12. مستخدم بدون صلاحية → FORBIDDEN
13. مستخدم من منظمة أخرى → FORBIDDEN
```

#### 5.2 اختبارات النظام المالي — الفواتير

أنشئ `packages/api/__tests__/modules/finance-invoices.test.ts`:

```
CRUD:
1. إنشاء فاتورة DRAFT → تنشئ بنجاح مع invoiceNo تلقائي
2. إصدار فاتورة (DRAFT → ISSUED) → الحالة تتغير + QR Code يُولّد (إذا TAX)
3. إنشاء فاتورة TAX → QR Code يحتوي TLV صحيح
4. إنشاء فاتورة SIMPLIFIED → بدون بيانات عميل مفصّلة
5. duplicate فاتورة → نسخة جديدة بحالة DRAFT

Workflow:
6. DRAFT → ISSUED → SENT → VIEWED → PAID (المسار الكامل)
7. ISSUED → CANCELLED → لا يمكن التعديل بعدها
8. إنشاء Credit Note لفاتورة → يربط بالفاتورة الأصلية
9. فاتورة OVERDUE → تتحدث تلقائياً عند list (lazy update)

Calculations:
10. فاتورة مع VAT 15% → المبالغ صحيحة
11. فاتورة مع خصم → المبالغ بعد الخصم صحيحة
12. فاتورة مع retention → مبلغ الاحتفاظ صحيح
13. دفع جزئي → الحالة PARTIALLY_PAID + المتبقي صحيح
14. دفع كامل → الحالة PAID

Permissions:
15. ACCOUNTANT يقدر ينشئ فاتورة → allowed
16. ENGINEER ما يقدر ينشئ فاتورة → FORBIDDEN
```

#### 5.3 اختبارات إدارة المستخدمين

أنشئ `packages/api/__tests__/modules/org-users.test.ts`:

```
1. إضافة مستخدم جديد → ينشئ user + member + session
2. إضافة مستخدم بدون صلاحية settings.users → FORBIDDEN
3. FREE plan → إضافة عضو ثالث يُرفض
4. PRO plan → إضافة أعضاء بدون حد
5. تعطيل مستخدم (toggleActive) → isActive: false
6. مستخدم معطّل يحاول أي عملية → FORBIDDEN
7. حذف مستخدم → يُحذف من المنظمة
8. تحديث دور مستخدم → الصلاحيات تتغير فوراً
9. OWNER لا يمكن حذفه أو تعطيله → خطأ
```

#### 5.4 اختبارات مقاولي الباطن

أنشئ `packages/api/__tests__/modules/subcontracts.test.ts`:

```
1. إنشاء عقد باطن → ينشئ بنجاح مع ربط بالمشروع
2. إنشاء مطالبة على عقد الباطن → تنشئ بنجاح
3. اعتماد مطالبة → الحالة تتغير
4. رفض مطالبة → الحالة تتغير مع سبب
5. تسجيل دفعة → المبلغ المدفوع يتحدث
6. محاولة دفع أكثر من قيمة العقد → خطأ
7. حذف عقد له مدفوعات → يُمنع أو cascade
```

#### 5.5 اختبارات بوابة المالك

أنشئ `packages/api/__tests__/modules/owner-portal.test.ts`:

```
1. إنشاء token → يرجع token صالح مع expiresAt
2. الوصول بـ token صالح → يرجع بيانات المشروع
3. الوصول بـ token منتهي → UNAUTHORIZED
4. الوصول بـ token غير موجود → NOT_FOUND
5. إرسال رسالة كمالك → تنشئ مع prefix [من المالك]
6. تجديد token (renewAccess) → expiresAt يتمدد (max 90 يوم)
7. إلغاء token (revokeAccess) → Token لا يعمل بعدها
8. قائمة المدفوعات عبر البوابة → تظهر فقط المدفوعات المتعلقة بالمشروع
```

### معايير النجاح
- [ ] ~100+ حالة اختبار integration
- [ ] الوحدات الأهم مُغطاة (مشاريع، فواتير، مستخدمين، مقاولين، بوابة المالك)
- [ ] كل الاختبارات تمر بنجاح
- [ ] البيانات تُنظّف بعد كل test suite

---

## المرحلة 6: اختبارات File Upload Validation و Input Validation

### الهدف
اختبار طبقة التحقق من المدخلات و أمان رفع الملفات.

### الملفات المرجعية
- `packages/api/modules/attachments/`
- `packages/storage/`

### المطلوب

#### 6.1 اختبارات File Upload Security

أنشئ `packages/api/__tests__/security/file-upload.test.ts`:

```
MIME Type Validation:
1. PDF file مع MIME صحيح → يمر
2. PHP file مع MIME text/html → يُرفض
3. .exe file → يُرفض
4. .jpg مع MIME application/pdf (mismatch) → يُرفض

Extension Validation:
5. file.jpg → يمر
6. file.php.jpg (double extension) → يُرفض
7. file.JPG (uppercase) → يمر (case insensitive)

Path Traversal:
8. ../../../etc/passwd → يُرفض
9. filename مع / أو \ → يُرفض
10. filename عادي → يمر

Size Validation:
11. ملف 50MB → يمر
12. ملف 101MB → يُرفض (max 100MB)
13. ملف 0 bytes → يُرفض أو يمر (حسب التطبيق)

Signed URL:
14. createUploadUrl() → يرجع URL مع صلاحية 60 ثانية
15. URL يجب أن يحتوي على organization path isolation
```

#### 6.2 اختبارات Input Validation (Zod Schemas)

أنشئ `packages/api/__tests__/security/input-validation.test.ts`:

```
لكل endpoint حرج، اختبر:
1. بيانات صحيحة → يمر
2. حقول مطلوبة ناقصة → BAD_REQUEST
3. أنواع بيانات خاطئة (string بدل number) → BAD_REQUEST
4. email format خاطئ → BAD_REQUEST
5. UUID/CUID format خاطئ → BAD_REQUEST
6. pagination خارج الحد (page > max) → يتعامل معه
7. نصوص طويلة جداً (10,000+ حرف في description) → يوثّق السلوك الحالي

Endpoints المطلوب اختبارها:
- projects.create
- finance.invoices.create
- org-users.create
- company.employees.create
- finance.expenses.create
- contact.submit
- activation-codes.activate
```

### معايير النجاح
- [ ] ~60+ حالة اختبار
- [ ] File upload security مُغطى 100%
- [ ] Input validation للـ endpoints الحرجة مُغطى
- [ ] كل الاختبارات تمر

---

## المرحلة 7: CI/CD Pipeline و Coverage Reporting

### الهدف
إعداد GitHub Actions لتشغيل الاختبارات تلقائياً على كل PR + تقرير coverage.

### المطلوب

#### 7.1 GitHub Actions Workflow

أنشئ `.github/workflows/test.yml`:

```yaml
# يشتغل على:
# - كل PR لـ main
# - كل push لـ main

# الخطوات:
# 1. checkout
# 2. setup Node.js 20
# 3. setup pnpm (مع caching)
# 4. pnpm install
# 5. pnpm generate (Prisma generate)
# 6. pnpm test -- --reporter=verbose
# 7. (اختياري) upload coverage report

# Environment:
# - DATABASE_URL من GitHub Secrets (أو SQLite in-memory للاختبارات البسيطة)
# - BETTER_AUTH_SECRET: "test-secret-32-chars-minimum-here"
# - باقي الـ env variables بقيم وهمية

# ملاحظة: لا تحتاج DB حقيقية للاختبارات اللي تستخدم mocks
# الاختبارات اللي تحتاج DB حقيقية (integration) يمكن تتجاوز في CI أو تستخدم Docker PostgreSQL
```

#### 7.2 Coverage Configuration

عدّل Vitest configs لتفعيل coverage:

```typescript
// في كل vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'text-summary', 'html'],
  include: [
    'lib/**/*.ts',
    'modules/**/*.ts', 
  ],
  exclude: [
    '**/*.test.ts',
    '**/__tests__/**',
    '**/index.ts', // barrel exports
  ],
  thresholds: {
    // ابدأ بحد أدنى منخفض وارفعه تدريجياً
    statements: 20,
    branches: 15,
    functions: 20,
    lines: 20,
  }
}
```

#### 7.3 GitHub Actions — Build Verification

أنشئ `.github/workflows/build.yml`:

```yaml
# يشتغل على كل PR
# الخطوات:
# 1. checkout
# 2. setup Node + pnpm
# 3. pnpm install
# 4. pnpm generate
# 5. pnpm type-check (TypeScript)
# 6. pnpm biome check . (Linting)
# 7. pnpm build (Full build)
```

#### 7.4 Pre-commit Hook (اختياري)

أنشئ `.husky/pre-push` أو وثّق في README:

```bash
# تشغيل type-check و lint قبل push
pnpm type-check
pnpm biome check .
```

### معايير النجاح
- [ ] GitHub Actions يشتغل على كل PR
- [ ] الاختبارات تمر في CI
- [ ] Build verification يكتشف أخطاء TypeScript
- [ ] Coverage report يُولّد (حتى لو النسبة منخفضة حالياً)

---

## ملخص المراحل والتقديرات

| المرحلة | الوصف | عدد الاختبارات المتوقع | الوقت التقديري |
|---------|-------|----------------------|---------------|
| 1 | البنية التحتية | 0 (setup) | 3-4 ساعات |
| 2 | نظام الصلاحيات | ~200 | 4-5 ساعات |
| 3 | Feature Gate + Rate Limiting | ~80 | 3-4 ساعات |
| 4 | ZATCA + Decimal | ~60 | 2-3 ساعات |
| 5 | API Integration Tests | ~100 | 5-6 ساعات |
| 6 | File Upload + Input Validation | ~60 | 3-4 ساعات |
| 7 | CI/CD Pipeline | 0 (infra) | 2-3 ساعات |
| **المجموع** | | **~500 اختبار جديد** | **~22-29 ساعة** |

**بعد الانتهاء:** المشروع سينتقل من 533 اختبار (5% coverage) إلى ~1,033 اختبار (~25-30% coverage) مع تغطية للأجزاء الأكثر حرجاً.

---

## تعليمات عامة لكل المراحل

1. **لا تعدّل الاختبارات الموجودة** في `packages/database/__tests__/invoice-calculations.test.ts`
2. **استخدم الأنماط الموجودة** — اقرأ كيف يُستخدم `prisma` و `ORPCError` في الكود الحالي
3. **نظّف البيانات بعد كل test suite** — استخدم `afterAll` أو `afterEach`
4. **اكتب أسماء الاختبارات بالإنجليزية** لسهولة القراءة في CI logs
5. **استخدم `describe` blocks** لتنظيم الاختبارات حسب الوظيفة
6. **لا تعتمد على ترتيب الاختبارات** — كل اختبار يجب أن يكون مستقل
7. **Mock external services** — S3, Resend, Stripe, Anthropic API
8. **Rate limit mock** — في كل الاختبارات عدا اختبارات Rate Limit نفسها، اعمل mock يسمح دائماً
9. **اكتب ≤800 سطر لكل عملية كتابة** لتجنب حد output الخاص بـ Claude Code
10. **شغّل `pnpm test` بعد كل مرحلة** للتأكد أن كل شيء يعمل

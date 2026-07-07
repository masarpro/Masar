# إصلاح مشاكل عروض الأسعار (Quotation) — القالب، إضافة العميل، الطباعة

## الوضع
استخدم Plan Mode أولاً. اقرأ كل الملفات المطلوبة قبل أي تعديل.

---

## المرحلة 0: القراءة الإجبارية (لا تعدّل أي شيء قبل قراءة كل هذه الملفات)

```bash
# 1. نظام القوالب
cat apps/web/modules/saas/settings/components/templates/
ls apps/web/modules/saas/settings/components/templates/
cat apps/web/modules/saas/finance/components/templates/ 2>/dev/null || echo "not found"

# 2. صفحة إنشاء عرض السعر
find apps/web/modules/saas/pricing -type f -name "*.tsx" | head -40
find apps/web/modules/saas/pricing -path "*quotation*" -type f
find apps/web -path "*quotation*" -type f -name "*.tsx"

# 3. إنشاء العميل
find packages/api -path "*client*" -type f -name "*.ts"
find apps/web -path "*client*" -name "*form*" -o -name "*dialog*" -o -name "*create*" | grep -i client

# 4. نظام الفواتير (المرجع للطباعة)
find apps/web/modules/saas/finance -path "*invoice*" -name "*print*" -o -name "*preview*" -o -name "*view*" | head -20
find apps/web/modules/saas/finance -path "*invoice*" -type f -name "*.tsx" | head -30

# 5. API عروض الأسعار
find packages/api -path "*quotation*" -type f
cat packages/api/modules/pricing/procedures/ 2>/dev/null
ls packages/api/modules/pricing/procedures/

# 6. FinanceTemplate model
grep -n "model FinanceTemplate" packages/database/prisma/schema.prisma
grep -A 20 "model FinanceTemplate" packages/database/prisma/schema.prisma
grep -n "model Quotation" packages/database/prisma/schema.prisma
grep -A 30 "model Quotation" packages/database/prisma/schema.prisma
grep -n "model QuotationDisplayConfig" packages/database/prisma/schema.prisma
grep -A 15 "model QuotationDisplayConfig" packages/database/prisma/schema.prisma

# 7. الـ Router للقوالب
grep -rn "template" packages/api/modules/finance/procedures/ --include="*.ts" -l
grep -rn "template" packages/api/modules/pricing/procedures/ --include="*.ts" -l
```

**اقرأ كل ملف ذو صلة بالكامل قبل المتابعة.**

---

## المشكلة 1: خطأ Internal Server Error عند إضافة عميل من صفحة عرض السعر

### الوصف
عند إنشاء عرض سعر جديد (`/pricing/quotations/new`)، يوجد dialog لإضافة عميل جديد inline. عند الضغط على "إضافة عميل" يظهر:
```
Internal server error
```

### خطوات التشخيص
```bash
# 1. ابحث عن form إضافة العميل المستخدم في صفحة عرض السعر
grep -rn "إضافة عميل\|addClient\|createClient\|client.*create\|client.*dialog\|ClientForm\|ClientDialog" apps/web/modules/saas/pricing/ --include="*.tsx" -l

# 2. ابحث عن الـ mutation المستخدمة
grep -rn "client.*create\|clients\.create\|orpc.*client" apps/web/modules/saas/pricing/ --include="*.tsx"

# 3. اقرأ الـ API endpoint لإنشاء العميل
cat packages/api/modules/pricing/procedures/clients.ts 2>/dev/null || find packages/api -name "*.ts" | xargs grep -l "client.*create\|createClient" | head -5

# 4. تحقق من الـ Zod schema — هل يوجد حقول مطلوبة مفقودة؟
grep -A 30 "create.*=.*Procedure\|\.create\b" packages/api/modules/pricing/procedures/clients.ts 2>/dev/null

# 5. تحقق من Vercel logs إن أمكن — أو اقرأ الـ error handling
grep -rn "Internal server error\|INTERNAL_SERVER_ERROR" packages/api/modules/ --include="*.ts" | head -10
```

### الاحتمالات الشائعة
- حقل مطلوب في الـ schema غير مُرسل من الـ form (مثل `organizationId`, `type`)
- الـ form يرسل حقول لا يتوقعها الـ API (مثل `vatNumber` بتنسيق خاطئ — الرقم الضريبي يجب أن يكون 15 رقم يبدأ بـ 3 وينتهي بـ 3)
- خطأ في `verifyOrganizationAccess` أو permission check
- خطأ Prisma في unique constraint أو relation

### الإصلاح
بعد تحديد السبب:
1. أصلح الـ form ليرسل كل الحقول المطلوبة
2. أو أصلح الـ API ليتعامل مع الحقول الاختيارية بشكل صحيح
3. تأكد أن رسالة الخطأ تظهر بالعربية وليس "Internal server error" العامة

---

## المشكلة 2: القالب المختار لا يظهر في عرض السعر

### الوصف
المستخدم يختار قالب من إعدادات القوالب (settings/templates)، لكن عند إنشاء عرض سعر لا يظهر القالب المختار — يظهر قالب افتراضي أو فارغ.

### خطوات التشخيص
```bash
# 1. كيف يُحفظ القالب الافتراضي/المختار
grep -rn "defaultTemplate\|selectedTemplate\|activeTemplate\|isDefault" packages/api/modules/ --include="*.ts" | grep -i "template\|quotation"

# 2. كيف يُجلب القالب في صفحة عرض السعر
grep -rn "template\|useTemplate\|getTemplate\|financeTemplate" apps/web/modules/saas/pricing/ --include="*.tsx"

# 3. كيف يُجلب القالب في الفواتير (المرجع الصحيح)
grep -rn "template\|useTemplate\|getTemplate" apps/web/modules/saas/finance/components/ --include="*.tsx" | grep -i "invoice\|create"

# 4. FinanceTemplate type field — هل يفرّق بين QUOTATION و INVOICE؟
grep -rn "type.*QUOTATION\|type.*INVOICE\|TemplateType\|documentType" packages/database/prisma/schema.prisma
grep -rn "QUOTATION\|INVOICE" packages/api/modules/ --include="*.ts" | grep -i template
```

### الإصلاح المتوقع
1. تأكد أن الـ query في صفحة عرض السعر يجلب القالب بنوع `QUOTATION` (وليس `INVOICE`)
2. تأكد أن هناك آلية لتحديد القالب الافتراضي لعروض الأسعار
3. إذا كان `FinanceTemplate` يستخدم `type` واحد، تأكد أن الـ query يفلتر بالنوع الصحيح

---

## المشكلة 3: الفرق بين قالب عرض السعر والفاتورة

### الوصف
في إعدادات القوالب (`settings/templates`)، نفس المحرر يُستخدم لعرض السعر والفاتورة. القالب يجب أن يختلف في العناصر الظاهرة:

| العنصر | عرض السعر | الفاتورة |
|--------|-----------|----------|
| رأس الصفحة (Header) | ✅ | ✅ |
| بيانات المستند | ✅ | ✅ |
| بيانات العميل | ✅ | ✅ |
| جدول البنود | ✅ | ✅ |
| المجموع | ✅ | ✅ |
| **رمز QR (ZATCA)** | **❌ لا يظهر** | **✅ يظهر** |
| صلاحية عرض السعر | ✅ | ❌ |
| الشروط والأحكام | ✅ | ❌ أو مختلف |

### خطوات التشخيص
```bash
# 1. اقرأ مكون القالب وبحث عن QR
grep -rn "qr\|QR\|qrCode\|barcode\|zatca" apps/web/modules/saas/settings/components/templates/ --include="*.tsx"
grep -rn "qr\|QR\|qrCode" apps/web/modules/saas/finance/components/templates/ --include="*.tsx" 2>/dev/null

# 2. كيف يُحدد نوع المستند في محرر القوالب
grep -rn "documentType\|docType\|templateType\|QUOTATION\|INVOICE" apps/web/modules/saas/settings/components/templates/ --include="*.tsx"

# 3. اقرأ الـ dropdown لاختيار نوع المستند (عرض سعر / فاتورة)
grep -rn "عرض سعر\|فاتورة\|quotation\|invoice" apps/web/modules/saas/settings/components/templates/ --include="*.tsx"
```

### الإصلاح
1. في محرر القوالب: عندما يكون النوع `QUOTATION`:
   - اخفِ toggle الـ QR Code بالكامل أو اجعله disabled مع tooltip "غير متاح لعروض الأسعار"
   - لا تعرض QR في الـ preview
2. في preview عرض السعر: لا تعرض QR أبداً حتى لو كان مُفعّل في القالب
3. في preview الفاتورة: اعرض QR إذا كان مُفعّل

---

## المشكلة 4: الطباعة والمعاينة — استخدم نفس نظام الفواتير

### الوصف
نظام طباعة ومعاينة عروض الأسعار يجب أن يكون مطابقاً لنظام الفواتير.

### خطوات التشخيص
```bash
# 1. نظام طباعة الفواتير
find apps/web/modules/saas/finance -name "*print*" -o -name "*preview*" | head -10
grep -rn "window.print\|@media print\|print:block\|print:hidden" apps/web/modules/saas/finance/ --include="*.tsx" -l

# 2. صفحة طباعة/معاينة الفاتورة
find apps/web -path "*invoice*print*" -o -path "*invoice*preview*" | head -10
find apps/web -path "*invoice*" -name "page.tsx" | head -10

# 3. نظام طباعة عروض الأسعار الحالي
find apps/web -path "*quotation*print*" -o -path "*quotation*preview*" | head -10
grep -rn "window.print\|@media print" apps/web/modules/saas/pricing/ --include="*.tsx" -l

# 4. مكون عرض الفاتورة (InvoiceView)
find apps/web -path "*InvoiceView*" -o -path "*invoice-view*" | head -5
```

### الإصلاح
1. اقرأ مكون طباعة/معاينة الفاتورة بالكامل
2. أنشئ مكون مماثل لعروض الأسعار أو اجعل المكون مشترك يقبل `type: 'invoice' | 'quotation'`
3. الفروقات:
   - عرض السعر: لا QR، يظهر "صالح حتى" وشروط
   - الفاتورة: QR، يظهر حالة الدفع
4. تأكد أن CSS الطباعة (`@media print`) مطبق بنفس الجودة
5. تأكد أن الطباعة تجلب القالب المختار وتطبقه

---

## القائمة الحمراء — لا تعدّل هذه الملفات أبداً

```
packages/api/lib/structural-calculations.ts
packages/api/lib/accounting/auto-journal.ts
packages/api/lib/zatca/
packages/database/prisma/schema.prisma  ← لا تعدّل بدون تأكيد مني
apps/web/modules/saas/pricing/components/structural/  ← محرك الحساب الإنشائي
```

---

## ملخص التغييرات المتوقعة

| # | الملف/المجلد | نوع التغيير | الوصف |
|---|-------------|-------------|-------|
| 1 | `packages/api/modules/**/clients*.ts` | إصلاح | حل خطأ Internal Server Error عند إنشاء عميل |
| 2 | `apps/web/**/quotation*` client form | إصلاح | تأكد الـ form يرسل كل الحقول المطلوبة |
| 3 | `apps/web/**/templates/` | تعديل | إخفاء QR لعروض الأسعار |
| 4 | `apps/web/**/quotation*/` template loading | إصلاح | جلب القالب المختار بالنوع الصحيح |
| 5 | `apps/web/**/quotation*print*` | إنشاء/تعديل | نظام طباعة مطابق للفواتير |

---

## التحقق النهائي

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

أعطني:
1. عدد الملفات المعدّلة وأسماءها
2. السبب الجذري لخطأ إضافة العميل
3. كيف تم حل مشكلة جلب القالب
4. هل QR يظهر فقط في الفواتير الآن
5. هل الطباعة تعمل بنفس طريقة الفواتير

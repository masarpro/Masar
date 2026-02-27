# برومبت تصحيحي وتكميلي — إكمال واجهة الفواتير

> **السياق:** تم تنفيذ خطة إكمال قسم الفواتير (ZATCA Phase 1) بنجاح على مستوى Backend (Schema, DB queries, API procedures, Tests). لكن الواجهة الأمامية (Frontend) تحتاج مراجعة وتكميل لتصل لمستوى النموذج المرجعي (دفترة) ولتتوافق مع أنماط مسار الحالية.

> **⚠️ قاعدة ذهبية:** لا تعدّل أي كود Backend (schema, queries, procedures, tests) — كل شيء في الـ Backend مكتمل وصحيح. ركّز فقط على Frontend.

> **المنهجية:** قبل تعديل أي مكون، اقرأ الملف الحالي بالكامل أولاً + اقرأ المكون المرجعي المقابل (quotation أو expense) لتفهم الأنماط المتبعة في المشروع.

---

## التعليمات الأساسية

### الأنماط الإلزامية (اقرأها من الكود الموجود):
1. **استخدم نفس أنماط مسار الموجودة** — قبل كتابة أي مكون، اقرأ المكون المقابل من Quotations كمرجع:
   - `QuotationForm.tsx` → مرجع لـ `CreateInvoiceForm.tsx`
   - `QuotationEditor.tsx` → مرجع لـ `InvoiceView.tsx`
   - `QuotationPreview.tsx` → مرجع لـ `InvoicePreview.tsx`
   - `QuotationsList.tsx` → مرجع لـ `InvoicesList.tsx`
2. **shadcn/ui components** — استخدم: Card, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Dialog, AlertDialog, DropdownMenu, Select, Input, Textarea, Label, Separator, Table
3. **useTranslations** — كل نص يمر عبر `const t = useTranslations()` — لا hardcoded strings
4. **RTL** — كل layout يدعم RTL — استخدم `start/end` بدل `left/right` في Tailwind
5. **Lucide icons** — استخدم الأيقونات الموجودة: `FileText, Plus, Pencil, Trash2, Printer, Send, Copy, CreditCard, MoreHorizontal, Eye, Download, RotateCcw, Check, X, Clock, AlertCircle, Receipt, ChevronDown`
6. **Sonner toast** — للإشعارات: `import { toast } from "sonner"`
7. **ORPC hooks** — `import { useMutation, useQuery } from "@tanstack/react-query"` مع `useApiClient`
8. **PageHeader** — استخدم مكون `PageHeader` الموجود لعناوين الصفحات مع breadcrumbs
9. **ConfirmationAlert** — استخدم `useConfirmationAlert` الموجود لتأكيد العمليات الخطرة
10. **Pagination** — استخدم مكون `Pagination` الموجود

---

## المهام التفصيلية

### مهمة 1: مراجعة وإصلاح صفحة قائمة الفواتير

**الملف:** `apps/web/modules/saas/finance/components/invoices/InvoicesList.tsx`

**اقرأ أولاً:**
- الملف الحالي بالكامل
- `apps/web/modules/saas/finance/components/invoices/` — كل الملفات في المجلد
- `apps/web/modules/saas/pricing/components/quotations/QuotationsList.tsx` — كمرجع للأنماط

**المرجع البصري:** صورة 3 من دفترة (قائمة الفواتير)

**تحقق أن التالي موجود ويعمل بشكل صحيح:**

1. **شريط أعلى:**
   - PageHeader مع breadcrumbs: المالية > الفواتير
   - زر "فاتورة جديدة +" يمين (بلون أساسي primary) يوجه لـ `/finance/invoices/new`

2. **تبويبات الحالة (Status Tabs):**
   - يجب أن تكون **فوق** منطقة الفلاتر وليست داخلها
   - التبويبات: الكل | متأخرة (OVERDUE) | مسودة (DRAFT) | صادرة (ISSUED) | أرسلت (SENT) | مدفوعة جزئيًا (PARTIALLY_PAID) | مدفوعة (PAID) | إشعار دائن (CREDIT_NOTE)
   - كل تبويب يعرض العدد بجانبه (badge صغير)
   - التبويب المحدد يفلتر القائمة
   - استخدم `Tabs` من shadcn/ui

3. **منطقة الفلاتر:**
   - بحث بالنص (رقم الفاتورة / اسم العميل)
   - فلتر العميل (dropdown combobox)
   - فلتر نوع الفاتورة (ضريبية / مبسّطة / عادية / إشعار دائن)
   - زر "بحث متقدم" (collapsible) يظهر فلاتر إضافية: نطاق تاريخ، نطاق مبلغ

4. **قائمة الفواتير (كل صف):**
   - رقم الفاتورة + تاريخها (يسار في RTL)
   - اسم العميل + اسم الشركة
   - نوع الفاتورة (badge صغير: ضريبية/مبسّطة/عادية/إشعار دائن)
   - الحالة (StatusBadge الموجود — تأكد من ألوانه)
   - المبلغ الإجمالي (بارز، بحجم أكبر)
   - المبلغ المستحق (إذا != الإجمالي)

5. **قائمة الإجراءات لكل صف (DropdownMenu):**
   ```
   عرض          → دائمًا
   تعديل         → فقط إذا status === "DRAFT"
   إصدار        → فقط إذا status === "DRAFT"
   ─────────────
   طباعة        → إذا status !== "DRAFT"
   PDF          → إذا status !== "DRAFT"
   ─────────────
   إضافة دفعة   → إذا status in [ISSUED, SENT, PARTIALLY_PAID, OVERDUE]
   إشعار دائن   → إذا status in [ISSUED, SENT, PARTIALLY_PAID, PAID, OVERDUE]
   ─────────────
   نسخ كجديدة   → دائمًا
   ─────────────
   حذف          → فقط إذا status === "DRAFT" (لون أحمر)
   ```
   - Separator بين المجموعات
   - زر الحذف يستخدم `useConfirmationAlert` قبل التنفيذ
   - زر الإصدار يفتح AlertDialog تأكيد

6. **Pagination** في الأسفل

7. **Empty State:** إذا لا توجد فواتير، اعرض رسالة ودية مع زر "أنشئ أول فاتورة"

---

### مهمة 2: مراجعة وإصلاح نموذج إنشاء/تعديل الفاتورة

**الملف:** `apps/web/modules/saas/finance/components/invoices/CreateInvoiceForm.tsx`

**اقرأ أولاً:**
- الملف الحالي بالكامل
- `apps/web/modules/saas/pricing/components/quotations/QuotationForm.tsx` — كمرجع
- `apps/web/modules/saas/finance/components/shared/ItemsEditor.tsx`
- `apps/web/modules/saas/finance/components/shared/AmountSummary.tsx`
- `apps/web/modules/saas/finance/components/clients/InlineClientForm.tsx`

**المرجع البصري:** صورة 1 من دفترة (نموذج إنشاء فاتورة)

**تحقق أن التالي موجود ويعمل:**

1. **PageHeader:** "إنشاء فاتورة جديدة" أو "تعديل الفاتورة #00366" مع breadcrumbs

2. **القسم العلوي (بيانات الفاتورة) — داخل Card:**

   **الصف الأول:**
   - نوع الفاتورة: `Select` (ضريبية TAX | مبسّطة SIMPLIFIED | عادية STANDARD) — **مهم: هذا أول حقل ويؤثر على الحقول المطلوبة**
   - رقم الفاتورة: `Input` read-only (تسلسلي تلقائي)
   - العملة: Badge ثابت "SAR ر.س"

   **الصف الثاني:**
   - العميل: `Combobox` بحث في العملاء + زر "عميل جديد" بجانبه (يفتح `InlineClientForm` في Dialog)
     - عند اختيار عميل: يعبّئ تلقائيًا حقول (الاسم، الشركة، الرقم الضريبي، العنوان، الهاتف، الإيميل) في الحقول أسفله
     - هذه الحقول قابلة للتعديل (override) حتى لو اختار عميل

   **الصف الثالث:**
   - تاريخ الفاتورة: `DatePicker`
   - تاريخ الإصدار: `DatePicker` (يتعبأ تلقائيًا = تاريخ اليوم عند الإصدار، قابل للتعديل في المسودة)
   - شروط الدفع (أيام): `Input` number — عند تغييره يحسب `dueDate` تلقائيًا من تاريخ الإصدار
   - تاريخ الاستحقاق: `DatePicker` (محسوب تلقائيًا أو يدوي)

   **الصف الرابع (اختياري):**
   - المشروع: `Select` ربط بمشروع (اختياري)
   - عرض السعر المرجعي: `Select` (اختياري — إذا تم التحويل من عرض سعر)

3. **قسم بيانات العميل (يظهر بعد اختيار العميل) — Collapsible أو visible:**
   - اسم العميل | اسم الشركة | الرقم الضريبي | العنوان | الهاتف | الإيميل
   - هذه الحقول تُملأ تلقائيًا من العميل المختار لكن قابلة للتعديل
   - **إذا نوع الفاتورة TAX:** حقل الرقم الضريبي يكون مميزًا (required indicator) لأنه إلزامي

4. **قسم البنود (Items) — مهم جدًا:**

   **تأكد من `ItemsEditor.tsx`:**
   - جدول بأعمدة: # | البند | الوصف | الوحدة | سعر الوحدة | الكمية | الخصم% | الإجمالي
   - **الوحدة:** `Select` dropdown مع وحدات المقاولات:
     ```
     م (متر) | م² (متر مربع) | م³ (متر مكعب) | طن | كجم | لتر | قطعة | مقطوعية | يوم عمل | ساعة عمل | رحلة | حمولة | لفة | كرتون | مجموعة | خدمة
     ```
   - كل صف يحسب إجماليه: `quantity × unitPrice × (1 - discount/100)`
   - زر "إضافة بند" أسفل الجدول (أيقونة + نص)
   - زر حذف (Trash2 icon) لكل صف — **لا يظهر إذا بند وحيد**
   - **تأكد أن الحقول responsive** — في الشاشات الصغيرة يتحول لـ card layout بدل جدول

5. **قسم الإجماليات (AmountSummary):**
   ```
   الإجمالي الفرعي (قبل الخصم):    _____ ر.س
   الخصم (____%):                   - _____ ر.س
   ─────────────────────────────────────
   المبلغ الخاضع للضريبة:           _____ ر.س
   ضريبة القيمة المضافة (____%):     + _____ ر.س
   ═══════════════════════════════════
   الإجمالي:                        _____ ر.س
   ```
   - حقل "نسبة الخصم" قابل للتعديل (input number)
   - حقل "نسبة الضريبة" قابل للتعديل (input number، افتراضي 15)
   - **الحسابات تعرض في الواجهة للعرض فقط** — الحساب الحقيقي server-side

6. **قسم أسفل (Tabs):**
   - تبويب "الملاحظات": `Textarea` — ملاحظات تظهر في الفاتورة المطبوعة
   - تبويب "شروط الدفع": `Textarea` — شروط دفع مخصصة
   - تبويب "المرفقات": placeholder أو UploadButton إن كان متاحًا

7. **أزرار الحفظ (شريط سفلي sticky أو أعلى):**
   - **"حفظ كمسودة"** — `Button variant="outline"` — يحفظ الفاتورة كـ DRAFT
   - **"حفظ وإصدار"** — `Button variant="default"` (primary) — يحفظ ثم يصدر
   - عند الضغط على "حفظ وإصدار":
     1. يظهر `AlertDialog` تأكيد: "هل أنت متأكد من إصدار الفاتورة؟ بعد الإصدار لن يمكنك تعديل البنود أو الأسعار."
     2. زر "إصدار" + زر "إلغاء"
     3. عند التأكيد: يستدعي `create` (إذا جديدة) ثم `issue`، أو `issue` مباشرة (إذا مسودة موجودة)

8. **وضع التعديل (Edit mode):**
   - صفحة `/finance/invoices/[id]/edit`
   - يجلب بيانات الفاتورة ويعبّئ النموذج
   - **إذا status !== "DRAFT":** redirect لصفحة العرض مع toast "لا يمكن تعديل فاتورة مصدرة"
   - نفس النموذج مع عنوان "تعديل الفاتورة #XXXXX"

---

### مهمة 3: مراجعة وإصلاح صفحة عرض الفاتورة (3 تبويبات)

**الملف:** `apps/web/modules/saas/finance/components/invoices/InvoiceView.tsx` (أو InvoiceEditor.tsx إذا لم يتم إعادة التسمية)

**اقرأ أولاً:**
- الملف الحالي بالكامل
- `apps/web/modules/saas/pricing/components/quotations/QuotationEditor.tsx` — كمرجع
- كل المكونات الفرعية (InvoiceViewTab, InvoiceDetailsTab, InvoiceActivityTab)

**المرجع البصري:** صورة 5 من دفترة (عرض الفاتورة)

**تحقق أن التالي موجود ويعمل:**

1. **شريط المعلومات أعلى (sticky):**
   - عنوان: "فاتورة #00365" + اسم العميل (مختصر)
   - StatusBadge (الحالة الحالية)
   - أزرار الإجراءات:
     ```
     [تعديل]        → فقط DRAFT → يوجه لـ /edit
     [إصدار]         → فقط DRAFT → AlertDialog تأكيد → يستدعي issue
     [طباعة]         → يفتح /preview
     [PDF]           → يفتح /preview مع auto-print
     [إضافة دفعة]    → Dialog إضافة دفعة (المبلغ، التاريخ، طريقة الدفع، المرجع، الحساب البنكي)
     [المزيد ⋯]      → DropdownMenu:
                       - إشعار دائن (مرتجع) → يوجه لـ /credit-note
                       - نسخ كفاتورة جديدة
                       - إرسال (نسخ رابط)
                       - إلغاء (فقط DRAFT)
     ```
   - **قاعدة الأزرار:** الأزرار تظهر/تختفي حسب الحالة:
     - DRAFT: تعديل + إصدار + حذف
     - ISSUED/SENT: طباعة + PDF + إضافة دفعة + مرتجع + نسخ + إرسال
     - PARTIALLY_PAID: نفس ISSUED
     - PAID: طباعة + PDF + مرتجع + نسخ
     - OVERDUE: نفس ISSUED
     - CANCELLED: طباعة + PDF فقط

2. **3 تبويبات (Tabs من shadcn/ui):**

   **تبويب "فاتورة" (الافتراضي) — InvoiceViewTab:**
   
   هذا هو عرض الفاتورة كمستند جاهز للطباعة داخل `Card` بخلفية بيضاء:

   ```
   ┌─────────────────────────────────────────────────────┐
   │  [QR Code]        [شعار المنظمة]                     │
   │  اسم المنشأة                                        │
   │  الرقم الضريبي: 31XXXXXXXXX003                       │
   │  العنوان                                             │
   │  الهاتف                                              │
   │                                                      │
   │         فاتورة ضريبية                                │
   │         #00365                                       │
   │  تاريخ الفاتورة: 15/02/2026                          │
   │  تاريخ الإصدار: 15/02/2026 11:30                     │
   │  تاريخ الاستحقاق: 15/03/2026                         │
   │                                                      │
   │  ┌─────────────────────────────────────────────┐     │
   │  │ فاتورة إلى:                                  │     │
   │  │ شركة مسارات المتقدمة للمقاولات               │     │
   │  │ الرقم الضريبي: 31XXXXXXXXX003               │     │
   │  │ العنوان                                      │     │
   │  └─────────────────────────────────────────────┘     │
   │                                                      │
   │  ┌───┬──────────┬──────┬─────┬────────┬───────┐     │
   │  │ # │ البند    │الوحدة│الكمية│سعر الوحدة│الإجمالي│     │
   │  ├───┼──────────┼──────┼─────┼────────┼───────┤     │
   │  │01 │أعمال ... │ م²   │  1  │ 8,000  │ 8,000 │     │
   │  └───┴──────────┴──────┴─────┴────────┴───────┘     │
   │                                                      │
   │                    الإجمالي:      8,000 ر.س          │
   │              القيمة المضافة (15%): 1,200 ر.س          │
   │              ─────────────────────                    │
   │                    الإجمالي:      9,200 ر.س          │
   │                    مدفوع:         0.00 ر.س           │
   │              الرصيد المستحق:      9,200 ر.س          │
   │                                                      │
   │  ملاحظات: .........                                  │
   │  الحوالات على حساب المؤسسة في البنك الأهلي            │
   │  رقم الحساب: XXXXXXXXX                               │
   └─────────────────────────────────────────────────────┘
   ```

   **نقاط مهمة:**
   - QR Code يظهر فقط إذا `invoice.qrCode` موجود (أي بعد الإصدار لفواتير TAX/SIMPLIFIED)
   - حجم QR على الأقل 2cm × 2cm (w-20 h-20 في Tailwind)
   - إذا DRAFT: يظهر watermark "مسودة" بخط كبير شفاف فوق المحتوى
   - الأرقام تُنسّق: `toLocaleString("ar-SA")` أو `Intl.NumberFormat`
   - الحقول الفارغة لا تُعرض (إذا لا يوجد خصم، لا يظهر سطر الخصم)

   **تبويب "التفاصيل" — InvoiceDetailsTab:**
   
   - **معلومات الفاتورة:**
     - الحالة (badge) | نوع الفاتورة | تاريخ الإنشاء | تاريخ آخر تعديل | منشئ الفاتورة
   - **الروابط:**
     - المشروع المرتبط (رابط) — إذا موجود
     - عرض السعر المرجعي (رابط) — إذا موجود
     - الفاتورة الأصلية (رابط) — إذا كانت Credit Note
   - **إشعارات دائنة (Credit Notes):**
     - قائمة المرتجعات المرتبطة بهذه الفاتورة (إذا وجدت)
     - كل مرتجع يعرض: رقمه + تاريخه + المبلغ + رابط
   - **سجل الدفعات:**
     - جدول: التاريخ | المبلغ | طريقة الدفع | المرجع | الحساب البنكي
     - زر "حذف" لكل دفعة (مع تأكيد)
     - إجمالي المدفوع + الرصيد المتبقي

   **تبويب "سجل النشاطات" — InvoiceActivityTab:**
   
   - Timeline عمودي (مثل Git log):
     ```
     ● 15/02/2026 11:30 — أحمد محمد — أصدر الفاتورة
     ● 15/02/2026 11:00 — أحمد محمد — أنشأ الفاتورة كمسودة
     ```
   - كل حدث يعرض: التاريخ/الوقت | المستخدم | الإجراء | تفاصيل (إن وجدت)
   - استخدم الـ `getInvoiceActivity` procedure

3. **Dialog إضافة دفعة:**
   عند الضغط على "إضافة دفعة" يظهر Dialog:
   - المبلغ (Input number) — الافتراضي = الرصيد المتبقي
   - التاريخ (DatePicker) — الافتراضي = اليوم
   - طريقة الدفع (Select): تحويل بنكي | نقد | شيك | شبكة | أخرى
   - رقم المرجع (Input text) — اختياري
   - الحساب البنكي (Select من حسابات المنظمة) — اختياري
   - ملاحظات (Textarea) — اختياري
   - زر "حفظ" يستدعي `finance.invoices.addPayment`
   - بعد الحفظ: toast نجاح + تحديث البيانات (invalidate query)

---

### مهمة 4: مراجعة وإصلاح صفحة المعاينة/الطباعة

**الملف:** `apps/web/modules/saas/finance/components/invoices/InvoicePreview.tsx`

**اقرأ أولاً:**
- الملف الحالي
- `apps/web/modules/saas/pricing/components/quotations/QuotationPreview.tsx` — كمرجع

**المرجع البصري:** صورة 5 من دفترة (تصميم الفاتورة)

**تحقق:**

1. **التصميم A4-ready:**
   - العرض الأقصى: `max-w-[210mm]` وارتفاع `min-h-[297mm]`
   - هوامش: `p-8` أو `p-10`
   - خلفية بيضاء: `bg-white`
   - الخط واضح وحجم مناسب للطباعة

2. **أقسام الفاتورة بالترتيب:**
   - رأس: شعار (يمين RTL) + QR + بيانات المنشأة (يسار RTL)
   - عنوان: "فاتورة ضريبية" / "فاتورة مبسّطة" / "إشعار دائن" بخط كبير
   - رقم + تواريخ
   - بيانات العميل في box
   - جدول البنود مع header ملون
   - الإجماليات (محاذاة يسار RTL)
   - ملاحظات
   - معلومات بنكية

3. **Print Styles:**
   ```css
   @media print {
     /* إخفاء كل شيء عدا الفاتورة */
     nav, header, footer, .no-print { display: none !important; }
     /* إزالة الظلال والحدود */
     .print-area { box-shadow: none; border: none; }
     /* حجم الصفحة */
     @page { size: A4; margin: 10mm; }
   }
   ```
   - تأكد أن Tailwind classes `print:hidden` و `print:block` مستخدمة بشكل صحيح

4. **أزرار (تختفي عند الطباعة):**
   - "طباعة" → `window.print()`
   - "رجوع" → يرجع لصفحة العرض

5. **QR Code:**
   - إذا `invoice.qrCode` موجود: اعرضه كصورة Base64
   - الحجم: `w-24 h-24` على الأقل (≈2cm عند الطباعة)
   - إذا غير موجود (DRAFT أو STANDARD): لا تعرض QR

---

### مهمة 5: مراجعة وإصلاح نموذج إشعار دائن (Credit Note)

**الملف:** `apps/web/modules/saas/finance/components/invoices/CreditNoteForm.tsx`
**الصفحة:** `apps/web/app/.../finance/invoices/[invoiceId]/credit-note/page.tsx`

**تحقق:**

1. **PageHeader:** "إشعار دائن — مرتجع من الفاتورة #00365"

2. **عرض الفاتورة الأصلية (ملخص):**
   - Card يعرض: رقم الفاتورة الأصلية | العميل | التاريخ | الإجمالي | المدفوع

3. **جدول البنود للمرتجع:**
   - يعرض بنود الفاتورة الأصلية (read-only: البند، الوصف، الوحدة، سعر الوحدة، الكمية الأصلية)
   - عمود إضافي: **"الكمية المرتجعة"** — `Input number` لكل بند
     - الحد الأقصى = الكمية الأصلية
     - الافتراضي = 0
   - عمود: **إجمالي المرتجع** = الكمية المرتجعة × سعر الوحدة

4. **سبب المرتجع:** `Textarea` إلزامي

5. **ملخص إشعار الدائن:**
   ```
   إجمالي المرتجع:                 _____ ر.س
   ضريبة القيمة المضافة (15%):     _____ ر.س
   ═══════════════════════════════════
   إجمالي الإشعار الدائن:          _____ ر.س
   ```

6. **أزرار:**
   - "إنشاء إشعار دائن" (primary) — يستدعي `finance.invoices.createCreditNote`
   - "إلغاء" → يرجع لصفحة الفاتورة

7. **بعد الإنشاء:** toast نجاح + redirect لصفحة الإشعار الدائن الجديد

---

### مهمة 6: مراجعة StatusBadge و AmountSummary

**الملفات:**
- `apps/web/modules/saas/finance/components/shared/StatusBadge.tsx`
- `apps/web/modules/saas/finance/components/shared/AmountSummary.tsx`

**StatusBadge — تأكد من الألوان:**
```
DRAFT:          bg-gray-100 text-gray-600      (رمادي)
ISSUED:         bg-teal-100 text-teal-700      (أخضر مزرق)
SENT:           bg-purple-100 text-purple-600  (بنفسجي)
VIEWED:         bg-indigo-100 text-indigo-600  (نيلي)
PARTIALLY_PAID: bg-amber-100 text-amber-700    (برتقالي/ذهبي)
PAID:           bg-green-100 text-green-700    (أخضر)
OVERDUE:        bg-red-100 text-red-700        (أحمر)
CANCELLED:      bg-gray-100 text-gray-400 line-through (رمادي مخطط)
CREDIT_NOTE:    bg-pink-100 text-pink-700      (وردي)
```

**AmountSummary — تأكد:**
- يعرض الأسطر ديناميكيًا (لا يعرض خصم إذا = 0)
- خط الإجمالي النهائي أكبر وأبرز (font-bold text-lg)
- الرصيد المستحق بلون أحمر إذا > 0

---

### مهمة 7: مراجعة ItemsEditor (وحدات المقاولات)

**الملف:** `apps/web/modules/saas/finance/components/shared/ItemsEditor.tsx`

**تحقق:**
1. dropdown الوحدات يعمل ويعرض كل الوحدات
2. الوحدات تترجم عبر i18n (عربي/إنجليزي)
3. حساب إجمالي كل بند يعمل صحيح في العرض
4. زر الحذف لا يظهر إذا بند واحد فقط
5. زر "إضافة بند" يضيف صف فارغ جديد
6. في الشاشات الصغيرة: layout يتحول لـ stacked cards

---

### مهمة 8: مراجعة الترجمات (i18n)

**الملفات:**
- `packages/i18n/translations/ar.json`
- `packages/i18n/translations/en.json`

**تحقق أن كل المفاتيح التالية موجودة ومترجمة بشكل صحيح:**

```json
// حالات الفاتورة
"invoice.status.DRAFT": "مسودة" / "Draft"
"invoice.status.ISSUED": "صادرة" / "Issued"
"invoice.status.SENT": "مُرسلة" / "Sent"
"invoice.status.VIEWED": "مُطّلع عليها" / "Viewed"
"invoice.status.PARTIALLY_PAID": "مدفوعة جزئيًا" / "Partially Paid"
"invoice.status.PAID": "مدفوعة" / "Paid"
"invoice.status.OVERDUE": "متأخرة" / "Overdue"
"invoice.status.CANCELLED": "ملغاة" / "Cancelled"

// أنواع الفواتير
"invoice.type.STANDARD": "عادية" / "Standard"
"invoice.type.TAX": "ضريبية" / "Tax Invoice"
"invoice.type.SIMPLIFIED": "مبسّطة" / "Simplified"
"invoice.type.CREDIT_NOTE": "إشعار دائن" / "Credit Note"
"invoice.type.DEBIT_NOTE": "إشعار مدين" / "Debit Note"

// عناوين الصفحات
"invoice.list.title": "الفواتير" / "Invoices"
"invoice.create.title": "إنشاء فاتورة جديدة" / "Create New Invoice"
"invoice.edit.title": "تعديل الفاتورة" / "Edit Invoice"
"invoice.view.title": "فاتورة" / "Invoice"
"invoice.creditNote.title": "إشعار دائن" / "Credit Note"
"invoice.preview.title": "معاينة الفاتورة" / "Invoice Preview"

// تبويبات العرض
"invoice.tab.invoice": "فاتورة" / "Invoice"
"invoice.tab.details": "التفاصيل" / "Details"
"invoice.tab.activity": "سجل النشاطات" / "Activity Log"

// أزرار الإجراءات
"invoice.action.saveAsDraft": "حفظ كمسودة" / "Save as Draft"
"invoice.action.saveAndIssue": "حفظ وإصدار" / "Save & Issue"
"invoice.action.issue": "إصدار الفاتورة" / "Issue Invoice"
"invoice.action.edit": "تعديل" / "Edit"
"invoice.action.print": "طباعة" / "Print"
"invoice.action.pdf": "PDF" / "PDF"
"invoice.action.addPayment": "إضافة دفعة" / "Add Payment"
"invoice.action.creditNote": "إشعار دائن" / "Credit Note"
"invoice.action.duplicate": "نسخ كجديدة" / "Duplicate"
"invoice.action.send": "إرسال" / "Send"
"invoice.action.copyLink": "نسخ الرابط" / "Copy Link"
"invoice.action.delete": "حذف" / "Delete"
"invoice.action.cancel": "إلغاء" / "Cancel"

// رسائل التأكيد
"invoice.confirm.issue.title": "إصدار الفاتورة" / "Issue Invoice"
"invoice.confirm.issue.message": "هل أنت متأكد من إصدار الفاتورة؟ بعد الإصدار لن يمكنك تعديل البنود أو الأسعار." / "Are you sure you want to issue this invoice? After issuance, you won't be able to edit items or prices."
"invoice.confirm.delete.title": "حذف الفاتورة" / "Delete Invoice"
"invoice.confirm.delete.message": "هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء." / "Are you sure you want to delete this invoice? This action cannot be undone."

// رسائل الخطأ (Validation Gate)
"invoice.error.missingOrgTaxNumber": "يجب إضافة الرقم الضريبي للمنشأة في إعدادات المنظمة قبل إصدار فاتورة ضريبية" / "Organization tax number is required in settings before issuing a tax invoice"
"invoice.error.missingOrgName": "يجب إضافة اسم المنشأة في إعدادات المنظمة" / "Organization name is required in settings"
"invoice.error.missingClientName": "يجب تحديد العميل" / "Client name is required"
"invoice.error.missingClientTaxNumber": "يجب إضافة الرقم الضريبي للعميل في الفاتورة الضريبية" / "Client tax number is required for tax invoices"
"invoice.error.noItems": "يجب إضافة بند واحد على الأقل" / "At least one item is required"
"invoice.error.cannotEditIssued": "لا يمكن تعديل فاتورة بعد إصدارها. يمكنك إنشاء إشعار دائن بدلاً من ذلك." / "Cannot edit an issued invoice. You can create a credit note instead."
"invoice.error.cannotDeleteIssued": "لا يمكن حذف فاتورة بعد إصدارها. يمكنك إنشاء إشعار دائن بدلاً من ذلك." / "Cannot delete an issued invoice. You can create a credit note instead."

// رسائل النجاح
"invoice.success.created": "تم إنشاء الفاتورة بنجاح" / "Invoice created successfully"
"invoice.success.updated": "تم تحديث الفاتورة بنجاح" / "Invoice updated successfully"
"invoice.success.issued": "تم إصدار الفاتورة بنجاح" / "Invoice issued successfully"
"invoice.success.deleted": "تم حذف الفاتورة بنجاح" / "Invoice deleted successfully"
"invoice.success.paymentAdded": "تم إضافة الدفعة بنجاح" / "Payment added successfully"
"invoice.success.creditNoteCreated": "تم إنشاء الإشعار الدائن بنجاح" / "Credit note created successfully"
"invoice.success.duplicated": "تم نسخ الفاتورة بنجاح كمسودة جديدة" / "Invoice duplicated as a new draft"
"invoice.success.linkCopied": "تم نسخ الرابط" / "Link copied"

// حقول النموذج
"invoice.field.invoiceType": "نوع الفاتورة" / "Invoice Type"
"invoice.field.invoiceNo": "رقم الفاتورة" / "Invoice Number"
"invoice.field.client": "العميل" / "Client"
"invoice.field.newClient": "عميل جديد" / "New Client"
"invoice.field.invoiceDate": "تاريخ الفاتورة" / "Invoice Date"
"invoice.field.issueDate": "تاريخ الإصدار" / "Issue Date"
"invoice.field.dueDate": "تاريخ الاستحقاق" / "Due Date"
"invoice.field.paymentTermsDays": "شروط الدفع (أيام)" / "Payment Terms (Days)"
"invoice.field.project": "المشروع" / "Project"
"invoice.field.notes": "الملاحظات" / "Notes"
"invoice.field.paymentTerms": "شروط الدفع" / "Payment Terms"
"invoice.field.attachments": "المرفقات" / "Attachments"
"invoice.field.reason": "السبب" / "Reason"
"invoice.field.returnQuantity": "الكمية المرتجعة" / "Return Quantity"

// عناوين الأقسام
"invoice.section.sellerInfo": "بيانات البائع" / "Seller Information"
"invoice.section.clientInfo": "بيانات العميل" / "Client Information"
"invoice.section.invoiceTo": "فاتورة إلى" / "Invoice To"
"invoice.section.items": "البنود" / "Items"
"invoice.section.totals": "الإجماليات" / "Totals"
"invoice.section.payments": "الدفعات" / "Payments"
"invoice.section.creditNotes": "الإشعارات الدائنة" / "Credit Notes"

// الإجماليات
"invoice.total.subtotal": "الإجمالي الفرعي" / "Subtotal"
"invoice.total.discount": "الخصم" / "Discount"
"invoice.total.taxableAmount": "المبلغ الخاضع للضريبة" / "Taxable Amount"
"invoice.total.vat": "ضريبة القيمة المضافة" / "VAT"
"invoice.total.total": "الإجمالي" / "Total"
"invoice.total.paid": "المدفوع" / "Paid"
"invoice.total.balance": "الرصيد المستحق" / "Balance Due"

// وحدات القياس
"unit.m": "م" / "m"
"unit.m2": "م²" / "m²"
"unit.m3": "م³" / "m³"
"unit.ton": "طن" / "ton"
"unit.kg": "كجم" / "kg"
"unit.liter": "لتر" / "liter"
"unit.piece": "قطعة" / "piece"
"unit.lumpsum": "مقطوعية" / "lump sum"
"unit.workday": "يوم عمل" / "work day"
"unit.workhour": "ساعة عمل" / "work hour"
"unit.trip": "رحلة" / "trip"
"unit.load": "حمولة" / "load"
"unit.roll": "لفة" / "roll"
"unit.carton": "كرتون" / "carton"
"unit.set": "مجموعة" / "set"
"unit.service": "خدمة" / "service"

// طرق الدفع
"payment.method.bankTransfer": "تحويل بنكي" / "Bank Transfer"
"payment.method.cash": "نقد" / "Cash"
"payment.method.check": "شيك" / "Check"
"payment.method.mada": "شبكة (مدى)" / "Mada"
"payment.method.other": "أخرى" / "Other"

// سجل النشاطات
"activity.INVOICE_CREATED": "أنشأ الفاتورة كمسودة" / "Created invoice as draft"
"activity.INVOICE_ISSUED": "أصدر الفاتورة" / "Issued the invoice"
"activity.INVOICE_SENT": "أرسل الفاتورة للعميل" / "Sent invoice to client"
"activity.INVOICE_PAYMENT_ADDED": "أضاف دفعة" / "Added payment"
"activity.INVOICE_PAYMENT_DELETED": "حذف دفعة" / "Deleted payment"
"activity.INVOICE_OVERDUE": "الفاتورة أصبحت متأخرة" / "Invoice became overdue"
"activity.INVOICE_CREDIT_NOTE_CREATED": "أنشأ إشعار دائن" / "Created credit note"
"activity.INVOICE_DUPLICATED": "نسخ الفاتورة" / "Duplicated invoice"

// Empty states
"invoice.empty.title": "لا توجد فواتير" / "No Invoices"
"invoice.empty.description": "لم تنشئ أي فواتير بعد. ابدأ بإنشاء أول فاتورة لك." / "You haven't created any invoices yet. Start by creating your first invoice."
"invoice.empty.action": "أنشئ أول فاتورة" / "Create First Invoice"
"invoice.payments.empty": "لا توجد دفعات مسجلة" / "No payments recorded"
"invoice.creditNotes.empty": "لا توجد إشعارات دائنة" / "No credit notes"
"invoice.activity.empty": "لا يوجد نشاط مسجل" / "No activity recorded"
```

---

### مهمة 9: التحقق النهائي

بعد إكمال جميع المهام، قم بالتالي:

1. **TypeScript check:** تأكد أنه لا توجد أخطاء TypeScript في كل الملفات المعدّلة
2. **تأكد من عدم وجود hardcoded strings** — كل نص يمر عبر `useTranslations()`
3. **تأكد من RTL** — كل `ml-` و `mr-` و `left-` و `right-` يجب أن تكون `ms-` و `me-` و `start-` و `end-`
4. **تأكد من responsive** — كل الصفحات تعمل على الشاشات الصغيرة (mobile)
5. **تأكد من Loading states** — كل صفحة تعرض skeleton أو spinner أثناء التحميل
6. **تأكد من Error states** — كل استعلام يتعامل مع حالة الخطأ

---

## ملخص الملفات المتوقع تعديلها (Frontend فقط)

```
apps/web/modules/saas/finance/components/invoices/InvoicesList.tsx     — مهمة 1
apps/web/modules/saas/finance/components/invoices/CreateInvoiceForm.tsx — مهمة 2
apps/web/app/.../finance/invoices/[invoiceId]/edit/page.tsx            — مهمة 2
apps/web/modules/saas/finance/components/invoices/InvoiceView.tsx      — مهمة 3
apps/web/modules/saas/finance/components/invoices/InvoiceViewTab.tsx   — مهمة 3
apps/web/modules/saas/finance/components/invoices/InvoiceDetailsTab.tsx — مهمة 3
apps/web/modules/saas/finance/components/invoices/InvoiceActivityTab.tsx — مهمة 3
apps/web/modules/saas/finance/components/invoices/InvoicePreview.tsx   — مهمة 4
apps/web/modules/saas/finance/components/invoices/CreditNoteForm.tsx   — مهمة 5
apps/web/app/.../finance/invoices/[invoiceId]/credit-note/page.tsx     — مهمة 5
apps/web/modules/saas/finance/components/shared/StatusBadge.tsx        — مهمة 6
apps/web/modules/saas/finance/components/shared/AmountSummary.tsx      — مهمة 6
apps/web/modules/saas/finance/components/shared/ItemsEditor.tsx        — مهمة 7
packages/i18n/translations/ar.json                                     — مهمة 8
packages/i18n/translations/en.json                                     — مهمة 8
```

> **ابدأ بقراءة كل ملف موجود أولاً ثم حدد ما ينقص فعلاً قبل أي تعديل. لا تُعد كتابة ملفات كاملة إذا كان التعديل المطلوب صغيرًا.**

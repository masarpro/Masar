جودت، هذا برومبت المرحلة 2 مقسم لـ 3 مراحل فرعية. مبني على المعلومات الدقيقة من تقريري الـ Audit والـ Project:

---

## برومبت المرحلة 2 — System Prompt + قاعدة المعرفة

---

### المرحلة الفرعية 2.1 — ملفات معرفة الوحدات (Module Knowledge)

```
## المهمة
أنشئ 9 ملفات معرفة + ملف خريطة التنقل، كل ملف يصدّر دالة ترجع string يُحقن في system prompt المساعد الذكي.

## السياق
- المرحلة 1 مكتملة — الزر العائم والنافذة يعملان
- هذه الملفات ستُستخدم من packages/ai/prompts/assistant-system.ts
- كل ملف يصدّر دالة تأخذ locale ويرجع string
- المعلومات يجب أن تكون دقيقة ومفيدة للمساعد ليجاوب على أسئلة المستخدمين
- اكتب بالعربية مع المصطلحات التقنية بالإنجليزية

## المكان
`packages/ai/prompts/modules/`

## قواعد عامة لكل ملف
- export function get[Module]Knowledge(locale: string): string
- يرجع template literal string
- يحتوي: وصف الوحدة، العمليات الممكنة، الأسئلة الشائعة (5-8 أسئلة مع إجاباتها)، ملاحظات مهمة
- لا imports خارجية — فقط string
- حجم كل ملف: 80-150 سطر تقريباً — معلومات مكثفة وليست عامة

---

### ملف 1: `packages/ai/prompts/modules/projects.ts`

```typescript
// export function getProjectsKnowledge(locale: string): string
//
// المحتوى يغطي:
//
// ## وصف وحدة المشاريع
// - مسار الوحدة: /[org]/projects
// - المشاريع هي قلب المنصة — كل شيء يدور حولها
// - أنواع المشاريع: RESIDENTIAL (سكني), COMMERCIAL (تجاري), INDUSTRIAL (صناعي), INFRASTRUCTURE (بنية تحتية), RENOVATION (ترميم)
// - حالات المشروع: ACTIVE (نشط), COMPLETED (مكتمل), ON_HOLD (متوقف), CANCELLED (ملغي)
//
// ## العمليات الرئيسية
// - إنشاء مشروع: /[org]/projects/new — يحتاج اسم، نوع، عميل، تواريخ البداية والنهاية، قيمة العقد
// - عرض المشاريع: /[org]/projects — جدول مع فلترة حسب الحالة والبحث
// - داشبورد المشروع: /[org]/projects/[pid] — 3 بطاقات رئيسية: التنفيذ، المالية، الجدول الزمني
// - قوالب المشاريع: /[org]/projects/templates — إنشاء قوالب لتكرار هيكل المشاريع
//
// ## أقسام المشروع الفرعية
// - نظرة عامة (overview): ملخص شامل مع بطاقات KPI
// - التنفيذ (execution): مراحل التنفيذ مع phases و tasks
// - العمل الميداني (field): تقارير يومية، صور، مشاكل، تحديثات تقدم
// - المالية (finance): مصروفات المشروع، مستخلصات، عقد رئيسي، عقود باطن
// - الجدول الزمني (timeline): مراحل زمنية (milestones) مع حالات
// - المستندات (documents): مستندات المشروع مع approval workflow
// - أوامر التغيير (changes): DRAFT → SUBMITTED → APPROVED/REJECTED → IMPLEMENTED
// - المحادثات (chat): محادثة فريق (TEAM) ومحادثة مالك (OWNER)
// - الفريق (team): أعضاء المشروع مع أدوارهم
// - التحليلات (insights): تنبيهات وتحليلات المشروع
// - بوابة المالك (owner): رابط للمالك بدون حساب
//
// ## الأسئلة الشائعة
// س: كيف أنشئ مشروع جديد؟
// ج: اذهب لـ "المشاريع" → "مشروع جديد"، أدخل الاسم والنوع والعميل والتواريخ وقيمة العقد ثم احفظ
//
// س: كيف أشوف نسبة إنجاز المشروع؟
// ج: افتح المشروع — أول شيء تشوفه الداشبورد فيها نسبة الإنجاز في بطاقة التنفيذ (مخطط دائري)
//
// س: كيف أضيف عضو للمشروع؟
// ج: افتح المشروع → "الفريق" → "إضافة عضو" — اختر المستخدم وحدد دوره (مدير/مهندس/مشرف/محاسب/مشاهد)
//
// س: وش الفرق بين التنفيذ والعمل الميداني؟
// ج: التنفيذ (execution) يدير المراحل والمهام من أعلى. العمل الميداني (field) للتقارير اليومية والصور والمشاكل من الموقع
//
// س: كيف أنشئ تقرير يومي؟
// ج: المشروع → العمل الميداني → التقارير اليومية → "تقرير جديد" — اختر التاريخ، أضف ملاحظات وصور
//
// س: كيف أتابع مشاكل الموقع؟
// ج: المشروع → العمل الميداني → المشاكل — تشوف كل المشاكل مع درجة الخطورة (LOW/MEDIUM/HIGH/CRITICAL)
//
// ## ملاحظات مهمة
// - أدوار المشروع: MANAGER (كل الصلاحيات)، ENGINEER (تنفيذ + فني)، SUPERVISOR (إشراف ميداني)، ACCOUNTANT (مالي)، VIEWER (قراءة فقط)
// - كل قسم يظهر حسب صلاحيات الدور
// - التقارير اليومية تحتوي: الطقس، القوى العاملة، المعدات، الملاحظات، الصور
```

---

### ملف 2: `packages/ai/prompts/modules/finance.ts`

```typescript
// export function getFinanceKnowledge(locale: string): string
//
// ## وصف وحدة المالية
// المسار: /[org]/finance
// تدير كل شيء بعد توقيع العقد: فواتير، مقبوضات، مصروفات، حسابات بنكية، عملاء، تقارير
//
// ## الفرق المهم: التسعير vs المالية
// - "التسعير" (pricing): كل شيء قبل توقيع العقد — حصر كميات + عروض أسعار
// - "المالية" (finance): كل شيء بعد توقيع العقد — فواتير، مدفوعات، مصروفات
//
// ## الأقسام الفرعية
//
// ### الفواتير (/finance/invoices)
// - حالات الفاتورة: DRAFT → SENT → VIEWED → PARTIALLY_PAID → PAID (أو OVERDUE/CANCELLED)
// - أنواع: فاتورة عادية، فاتورة ضريبية (مع بيانات ZATCA)
// - كل فاتورة تحتوي: رقم تلقائي، عميل، بنود (وصف، كمية، سعر)، ضريبة VAT، خصم اختياري
// - يمكن تسجيل دفعات جزئية على الفاتورة
// - عند الدفع الكامل تتحول لـ PAID تلقائياً
// - فواتير ZATCA Phase 1: QR code جاهز ✅
//
// ### المقبوضات (/finance/payments)
// - سجل كل دفعة مستلمة: المبلغ، التاريخ، الحساب البنكي، العميل، المشروع، الفاتورة المرتبطة
// - رقم سند القبض تلقائي
// - يمكن طباعة سند القبض
//
// ### المصروفات (/finance/expenses)
// - 26 فئة مصروفات (مواد، عمالة، معدات، نقل، إيجار، ...)
// - حالات: PENDING → PAID أو CANCELLED
// - كل مصروف مرتبط بحساب بنكي ومشروع (اختياري)
// - يدعم الدفع الجزئي
// - يشمل مصروفات عقود الباطن في عرض موحد
//
// ### الحسابات البنكية (/finance/banks)
// - إنشاء حسابات (BANK/CASH/DIGITAL)
// - رصيد افتتاحي
// - مطابقة الرصيد مع الحركات
// - تعيين حساب افتراضي
//
// ### العملاء (/finance/clients)
// - بيانات العميل: الاسم، النوع (شركة/فرد)، الرقم الضريبي، جهات الاتصال
// - كود فريد لكل عميل
//
// ### التقارير (/finance/reports)
// - لوحة تحكم مالية: إحصائيات الفواتير، المقبوضات، المصروفات
// - تقارير حسب الفترة
//
// ### القوالب (/finance/templates)
// - قوالب للفواتير وعروض الأسعار
// - تخصيص التصميم والألوان والشعار
//
// ## عروض الأسعار (/pricing/quotations)
// - حالات: DRAFT → SENT → VIEWED → ACCEPTED/REJECTED/EXPIRED
// - يمكن تحويل عرض مقبول إلى فاتورة
// - بنود مع وصف وكمية وسعر
// - صلاحية (validUntil)
// - مرتبط بعميل ومشروع (اختياري)
//
// ## الأسئلة الشائعة
// س: كيف أنشئ فاتورة جديدة؟
// ج: المالية → الفواتير → "فاتورة جديدة" — اختر العميل، أضف البنود (وصف، كمية، سعر)، حدد الضريبة، ثم احفظ
//
// س: كيف أسجل دفعة على فاتورة؟
// ج: افتح الفاتورة → "إضافة دفعة" — أدخل المبلغ والتاريخ واختر الحساب البنكي. إذا المبلغ المدفوع = الإجمالي، الفاتورة تتحول لـ "مدفوعة" تلقائياً
//
// س: كيف أنشئ عرض سعر وأحوله لفاتورة؟
// ج: التسعير → عروض الأسعار → "عرض جديد" — أضف البنود وأرسله للعميل. بعد القبول، اضغط "تحويل لفاتورة"
//
// س: كيف أشوف المصروفات حسب المشروع؟
// ج: المالية → المصروفات — استخدم فلتر المشروع لعرض مصروفات مشروع محدد
//
// س: كيف أعرف رصيد حساباتي البنكية؟
// ج: المالية → الحسابات البنكية — تشوف كل حساب مع رصيده. اضغط "مطابقة" للتأكد من تطابق الرصيد مع الحركات
//
// س: هل الفواتير متوافقة مع هيئة الزكاة (ZATCA)؟
// ج: نعم، المرحلة الأولى جاهزة (QR code). المرحلة الثانية (الربط المباشر) قريباً
//
// ## التحويلات بين الحسابات
// - يمكن تحويل مبالغ بين الحسابات البنكية
// - كل تحويل يسجل: من حساب، إلى حساب، المبلغ، التاريخ
```

---

### ملف 3: `packages/ai/prompts/modules/execution.ts`

```typescript
// export function getExecutionKnowledge(locale: string): string
//
// ## وحدة التنفيذ الميداني والعمل الميداني
// مسار التنفيذ: /[org]/projects/[pid]/execution
// مسار العمل الميداني: /[org]/projects/[pid]/field
//
// ## التنفيذ (Execution) — إدارة المراحل
// - مراحل التنفيذ (Phases): كل مشروع فيه مراحل متتالية
// - كل مرحلة لها: اسم، وصف، تاريخ بداية ونهاية، وزن (%)، تقدم (%)
// - حالات المرحلة: NOT_STARTED → IN_PROGRESS → COMPLETED
// - المجموع الكلي للأوزان = 100%
// - نسبة إنجاز المشروع = مجموع (وزن المرحلة × نسبة إنجازها)
//
// ## العمل الميداني (Field) — 4 أنواع بيانات
//
// ### 1. التقارير اليومية (Daily Reports)
// - تسجيل يومي من الموقع
// - يحتوي: التاريخ، حالة الطقس، عدد العمال، المعدات المستخدمة، ملاحظات، صور
// - مسار: /field/daily-reports
//
// ### 2. الصور (Photos)
// - توثيق بصري لتقدم العمل
// - فلترة حسب التاريخ والمرحلة
//
// ### 3. المشاكل (Issues)
// - تسجيل مشاكل الموقع
// - درجات الخطورة: LOW (منخفض)، MEDIUM (متوسط)، HIGH (عالي)، CRITICAL (حرج)
// - حالات: OPEN → IN_PROGRESS → RESOLVED → CLOSED
// - كل مشكلة لها: وصف، الخطورة، المسؤول، صور
//
// ### 4. تحديثات التقدم (Progress Updates)
// - تحديث نسب إنجاز المراحل
// - مع ملاحظات وصور
//
// ## الأسئلة الشائعة
// س: كيف أضيف مرحلة تنفيذ جديدة؟
// ج: المشروع → التنفيذ → "إضافة مرحلة" — أدخل الاسم والوصف والتواريخ والوزن (%)
//
// س: كيف أحدّث نسبة إنجاز مرحلة؟
// ج: طريقتين: من التنفيذ مباشرة (تعديل المرحلة)، أو من العمل الميداني → تحديثات التقدم
//
// س: كيف أسجل مشكلة في الموقع؟
// ج: المشروع → العمل الميداني → المشاكل → "مشكلة جديدة" — وصف المشكلة، حدد الخطورة، أرفق صور
//
// س: كيف أشوف تقدم المشروع بشكل بصري؟
// ج: داشبورد المشروع فيه بطاقة التنفيذ مع مخطط دائري. أو صفحة التنفيذ فيها تفصيل كل مرحلة
```

---

### ملف 4: `packages/ai/prompts/modules/quantities.ts`

```typescript
// export function getQuantitiesKnowledge(locale: string): string
//
// ## وحدة حصر الكميات والتسعير
// مسار الكميات: /[org]/quantities
// مسار التسعير: /[org]/pricing
//
// ## دراسات التكلفة (Cost Studies)
// - تحليل تكاليف المشروع قبل التعاقد
// - 3 أنواع رئيسية:
//   1. إنشائي (Structural): أساسات، أعمدة، بلاطات، جدران
//   2. تشطيبات (Finishing): أرضيات، دهانات، سيراميك، نجارة
//   3. MEP (كهرباء وميكانيكا وسباكة): تكييف، كهرباء، صحي، حريق
//
// - كل بند فيه: وصف، وحدة، كمية، سعر الوحدة، الإجمالي
// - يمكن نسخ دراسة لتعديلها
// - معلمات المشروع: مساحة الأرض، عدد الأدوار، نسبة البناء
//
// ## عروض الأسعار (Quotations)
// - تُنشأ من دراسة التكلفة أو مستقلة
// - تحتوي بنود مع أسعار
// - تُرسل للعميل وتتبع حالتها (DRAFT → SENT → ACCEPTED/REJECTED)
// - عند القبول يمكن تحويلها لفاتورة
//
// ## الأسئلة الشائعة
// س: كيف أنشئ دراسة تكلفة؟
// ج: حصر الكميات → "دراسة جديدة" — اختر المشروع والنوع (إنشائي/تشطيب/MEP)، أدخل معلمات المشروع، ثم أضف البنود
//
// س: كيف أنشئ عرض سعر من دراسة التكلفة؟
// ج: افتح الدراسة → "تحويل لعرض سعر" — يتم نسخ البنود تلقائياً، اختر العميل وحدد الصلاحية
//
// س: وش الفرق بين حصر الكميات والتسعير؟
// ج: حصر الكميات = حساب الكميات والتكاليف. التسعير = إنشاء عروض أسعار للعملاء. الأول يغذي الثاني
```

---

### ملف 5: `packages/ai/prompts/modules/company.ts`

```typescript
// export function getCompanyKnowledge(locale: string): string
//
// ## وحدة إدارة المنشأة (Company Management)
// المسار: /[org]/company
// تدير التكاليف الثابتة للمنشأة (الشركة نفسها، وليس المشاريع)
// السؤال الرئيسي: "هل إيرادات مشاريعي تغطي مصاريف الشركة الشهرية؟"
//
// ## الأقسام
//
// ### الموظفون (/company/employees)
// - بيانات الموظف: الاسم، المسمى، الراتب الأساسي، البدلات، تاريخ التعيين
// - تعيينات المشاريع: كل موظف يمكن تعيينه لعدة مشاريع بنسب (مثلاً 50% مشروع A، 50% مشروع B)
// - حالات: ACTIVE (نشط)، TERMINATED (منتهي)
// - ملاحظة مهمة: الموظف ≠ مستخدم النظام — قد يكون موظف ميداني بدون حساب
//
// ### الأصول (/company/assets)
// - أصول الشركة: معدات، سيارات، أدوات
// - كل أصل له: فئة، نوع، تكلفة الشراء، تاريخ الشراء، تأمين
// - تعيين الأصل لمشروع وإرجاعه للمستودع
// - تنبيه تأمينات منتهية (قبل 30 يوم)
// - حالات: AVAILABLE (متاح)، ASSIGNED (معين لمشروع)، MAINTENANCE (صيانة)، RETIRED (متقاعد)
//
// ### مصروفات المنشأة (/company/expenses)
// - المصاريف الثابتة الشهرية: إيجار، كهرباء، إنترنت، رخص، إلخ
// - كل مصروف له: فئة، مبلغ، تكرار (شهري/ربعي/سنوي)
// - توزيع على المشاريع: يمكن توزيع المصروف على عدة مشاريع بنسب (المجموع ≤ 100%)
//
// ### دورات الرواتب (/company/payroll)
// - دورة شهرية: DRAFT → APPROVED
// - عند الإنشاء: يملأ تلقائياً بالموظفين النشطين مع حساب الرواتب
// - عند الاعتماد: ينشئ مصروفات مالية (FinanceExpense) لكل موظف
// - سجل granular: مصروف مالي لكل موظف (وليس مجمع) — متوافق مع WPS
//
// ### دورات ترحيل المصروفات (/company/expense-runs)
// - ترحيل المصاريف الشهرية للمنشأة إلى النظام المالي
// - DRAFT → POSTED (ينشئ مصروفات مالية PENDING)
// - أو CANCELLED (يلغي كل المصروفات المرتبطة)
//
// ## الأسئلة الشائعة
// س: كيف أضيف موظف جديد؟
// ج: إدارة المنشأة → الموظفون → "موظف جديد" — أدخل البيانات والراتب
//
// س: كيف أصرف الرواتب؟
// ج: إدارة المنشأة → الرواتب → "دورة جديدة" → اختر الشهر → "ملء تلقائي" → راجع → "اعتماد". المبالغ تظهر كمصروفات في المالية
//
// س: كيف أوزع مصروف الإيجار على المشاريع؟
// ج: المنشأة → المصروفات → افتح المصروف → "التوزيع" → حدد المشاريع والنسب (المجموع لا يتجاوز 100%)
//
// س: وش الفرق بين مصروف المنشأة ومصروف المالية؟
// ج: مصروف المنشأة = التعريف (إيجار 5000 شهرياً). ترحيله ينشئ مصروف مالية (الحركة الفعلية)
//
// ## مبدأ مهم
// - المنشأة = مصدر بيانات (data source)
// - المالية = مصدر الحقيقة (source of truth) للأرقام
// - الاستحقاق (accrual) ≠ الدفع (payment) — يتتبعان بشكل منفصل
```

---

### ملف 6: `packages/ai/prompts/modules/subcontracts.ts`

```typescript
// export function getSubcontractsKnowledge(locale: string): string
//
// ## وحدة عقود الباطن
// المسار: /[org]/projects/[pid]/finance/subcontracts
// تدير العلاقة مع مقاولي الباطن وعقودهم ودفعاتهم
//
// ## العمليات
// - إنشاء عقد باطن: رقم العقد (تلقائي)، اسم المقاول، الوصف، القيمة، التواريخ
// - حالات العقد: DRAFT → ACTIVE → COMPLETED أو TERMINATED أو SUSPENDED
// - شروط الدفع (Payment Terms): جدول دفعات العقد
// - أوامر تغيير: زيادة أو نقص قيمة العقد
// - تسجيل دفعات للمقاول
//
// ## مبدأ مهم
// دفعات مقاولي الباطن = مصروفات مشروع (وليست مصروفات منظمة)
// تظهر في مصروفات المشروع وليس في مصروفات المنشأة
//
// ## الأسئلة الشائعة
// س: كيف أنشئ عقد باطن؟
// ج: المشروع → المالية → عقود الباطن → "عقد جديد" — أدخل بيانات المقاول والقيمة والتواريخ
//
// س: كيف أسجل دفعة لمقاول باطن؟
// ج: افتح عقد الباطن → "دفعة جديدة" — أدخل المبلغ والتاريخ. الدفعة تظهر كمصروف مشروع
//
// س: كيف أضيف أمر تغيير على عقد باطن؟
// ج: افتح العقد → "أمر تغيير جديد" — حدد القيمة (إضافة أو خصم) والوصف
```

---

### ملف 7: `packages/ai/prompts/modules/settings.ts`

```typescript
// export function getSettingsKnowledge(locale: string): string
//
// ## إعدادات المنظمة
// المسار: /[org]/settings
//
// ### الإعدادات العامة (/settings/general)
// - اسم المنظمة، الشعار، الوصف
// - الـ slug (الرابط المختصر)
//
// ### الأعضاء (/settings/members)
// - إضافة أعضاء جدد (دعوة بالإيميل)
// - تعديل أدوار الأعضاء
// - إزالة أعضاء
//
// ### الأدوار (/settings/roles)
// - أدوار النظام الافتراضية: OWNER, PROJECT_MANAGER, ACCOUNTANT, ENGINEER, SUPERVISOR
// - إنشاء أدوار مخصصة مع صلاحيات محددة
// - حماية أدوار النظام من الحذف
//
// ### الفوترة (/settings/billing)
// - إدارة الاشتراك (FREE أو PRO)
// - FREE: عرض فقط (demo)
// - PRO: كل المميزات
//
// ### التكاملات (/settings/integrations)
// - إعدادات البريد الإلكتروني
// - إعدادات WhatsApp
// - إعدادات SMS
//
// ## نظام الصلاحيات
// 8 أقسام: projects, quantities, pricing, finance, employees, company, settings, reports
// كل قسم فيه صلاحيات فرعية (view, create, edit, delete, ...)
// OWNER: كل الصلاحيات
// PROJECT_MANAGER: المشاريع + الكميات + جزء من المالية
// ACCOUNTANT: المالية + الموظفين + الرواتب
// ENGINEER: المشاريع + الكميات (بدون حذف)
// SUPERVISOR: مشاهدة المشاريع + الكميات
```

---

### ملف 8: `packages/ai/prompts/modules/owner-portal.ts`

```typescript
// export function getOwnerPortalKnowledge(locale: string): string
//
// ## بوابة المالك (Owner Portal)
// مسار داخلي: /[org]/projects/[pid]/owner
// مسار المالك: /owner/[token]
//
// ## الغرض
// وصول مالك المشروع لمعلومات المشروع بدون إنشاء حساب
// يتم عبر رابط خاص (token-based access)
//
// ## ما يراه المالك
// - ملخص المشروع
// - الجدول الزمني والمراحل
// - جدول المدفوعات وحالتها
// - المحادثات مع المقاول (قناة OWNER منفصلة عن TEAM)
// - أوامر التغيير
// - التحديثات الرسمية
//
// ## كيفية الإنشاء
// المشروع → بوابة المالك → "إنشاء رابط وصول" — يتم إنشاء token يُرسل للمالك
//
// ## الأسئلة الشائعة
// س: كيف أعطي مالك المشروع وصول للمتابعة؟
// ج: افتح المشروع → "بوابة المالك" → "إنشاء رابط" — انسخ الرابط وأرسله للمالك. يقدر يتابع بدون حساب
//
// س: هل المالك يشوف كل شيء؟
// ج: لا — يشوف فقط: الملخص، الجدول الزمني، المدفوعات، الرسائل، أوامر التغيير. لا يشوف المصروفات أو التقارير الداخلية
```

---

### ملف 9: `packages/ai/prompts/modules/navigation.ts`

```typescript
// export function getNavigationKnowledge(locale: string, organizationSlug: string): string
//
// ## خريطة التنقل الكاملة
// يستخدمها المساعد لاقتراح روابط للمستخدم
//
// تصدّر دالة تبني خريطة المسارات مع organizationSlug:
//
// const routes = {
//   dashboard: `/${org}`,
//   projects: {
//     list: `/${org}/projects`,
//     new: `/${org}/projects/new`,
//     templates: `/${org}/projects/templates`,
//     detail: (pid: string) => `/${org}/projects/${pid}`,
//     execution: (pid: string) => `/${org}/projects/${pid}/execution`,
//     field: {
//       dailyReports: (pid: string) => `/${org}/projects/${pid}/field/daily-reports`,
//       photos: (pid: string) => `/${org}/projects/${pid}/field/photos`,
//       issues: (pid: string) => `/${org}/projects/${pid}/field/issues`,
//       progress: (pid: string) => `/${org}/projects/${pid}/field/progress`,
//     },
//     finance: (pid: string) => `/${org}/projects/${pid}/finance`,
//     timeline: (pid: string) => `/${org}/projects/${pid}/timeline`,
//     documents: (pid: string) => `/${org}/projects/${pid}/documents`,
//     chat: (pid: string) => `/${org}/projects/${pid}/chat`,
//     changes: (pid: string) => `/${org}/projects/${pid}/changes`,
//     team: (pid: string) => `/${org}/projects/${pid}/team`,
//     insights: (pid: string) => `/${org}/projects/${pid}/insights`,
//     owner: (pid: string) => `/${org}/projects/${pid}/owner`,
//     subcontracts: (pid: string) => `/${org}/projects/${pid}/finance/subcontracts`,
//   },
//   finance: {
//     dashboard: `/${org}/finance`,
//     invoices: `/${org}/finance/invoices`,
//     newInvoice: `/${org}/finance/invoices/new`,
//     payments: `/${org}/finance/payments`,
//     expenses: `/${org}/finance/expenses`,
//     banks: `/${org}/finance/banks`,
//     clients: `/${org}/finance/clients`,
//     reports: `/${org}/finance/reports`,
//     templates: `/${org}/finance/templates`,
//     settings: `/${org}/finance/settings`,
//   },
//   pricing: {
//     quotations: `/${org}/pricing/quotations`,
//     studies: `/${org}/pricing/studies`,
//   },
//   company: {
//     dashboard: `/${org}/company`,
//     employees: `/${org}/company/employees`,
//     assets: `/${org}/company/assets`,
//     expenses: `/${org}/company/expenses`,
//     payroll: `/${org}/company/payroll`,
//     expenseRuns: `/${org}/company/expense-runs`,
//     reports: `/${org}/company/reports`,
//   },
//   settings: {
//     general: `/${org}/settings/general`,
//     members: `/${org}/settings/members`,
//     roles: `/${org}/settings/roles`,
//     billing: `/${org}/settings/billing`,
//     integrations: `/${org}/settings/integrations`,
//   },
//   notifications: `/${org}/notifications`,
//   chatbot: `/${org}/chatbot`,
// };
//
// يرجع string يحتوي كل المسارات بشكل مقروء
// مع ملاحظات التنقل:
// - كل المسارات تبدأ بـ /app/ قبل organizationSlug
// - مسارات المشروع تحتاج projectId
// - إذا المستخدم في مشروع محدد، استخدم projectId الحالي من السياق
```

---

### ملف 10: `packages/ai/prompts/modules/index.ts`

```typescript
// barrel export لكل الوحدات
export { getProjectsKnowledge } from './projects';
export { getFinanceKnowledge } from './finance';
export { getExecutionKnowledge } from './execution';
export { getQuantitiesKnowledge } from './quantities';
export { getCompanyKnowledge } from './company';
export { getSubcontractsKnowledge } from './subcontracts';
export { getSettingsKnowledge } from './settings';
export { getOwnerPortalKnowledge } from './owner-portal';
export { getNavigationKnowledge } from './navigation';
```

## التحقق
- كل ملف يصدّر دالة واحدة
- لا imports خارجية (كل ملف self-contained)
- pnpm build ينجح
```

---

### المرحلة الفرعية 2.2 — System Prompt Builder

```
## المهمة
أنشئ ملف بناء الـ System Prompt الذي يجمع كل المعرفة ويحقن السياق الديناميكي.

## السياق
- المرحلة 2.1 مكتملة — ملفات المعرفة جاهزة
- هذا الملف سيُستدعى من API Route (المرحلة 3 لاحقاً)
- يبني system prompt مخصص لكل طلب حسب: المستخدم، المنظمة، الصفحة الحالية، المشروع

## الملف

### `packages/ai/prompts/assistant-system.ts`

```typescript
// يصدّر:
// 1. interface AssistantContext
// 2. function buildSystemPrompt(context: AssistantContext): string
// 3. function getRelevantModules(section: string): string[]

// --- الأنواع ---

export interface AssistantContext {
  // المستخدم
  userName: string;
  userRole: string; // دور المستخدم في المنظمة
  locale: string;   // 'ar' | 'en'
  
  // المنظمة
  organizationName: string;
  organizationSlug: string;
  organizationId: string;
  
  // الصفحة الحالية
  currentPage: string;    // المسار
  currentSection: string; // من AssistantSection type
  
  // المشروع (اختياري — فقط إذا داخل مشروع)
  projectId?: string;
  projectName?: string;
  projectStatus?: string;
  projectProgress?: number;  // نسبة الإنجاز
  projectBudget?: number;    // قيمة العقد
  
  // بيانات ملخصة إضافية (تُحقن حسب الصفحة)
  contextData?: Record<string, any>;
}

// --- الدالة الرئيسية ---

export function buildSystemPrompt(context: AssistantContext): string {
  // 1. الهوية الأساسية (دائماً تُضاف)
  const identity = buildIdentity(context);
  
  // 2. المعرفة ذات الصلة (حسب الصفحة)
  const relevantModules = getRelevantModules(context.currentSection);
  const knowledge = relevantModules
    .map(mod => getModuleKnowledge(mod, context.locale, context.organizationSlug))
    .join('\n\n');
  
  // 3. السياق الديناميكي
  const dynamicContext = buildDynamicContext(context);
  
  // 4. قواعد السلوك
  const rules = buildRules(context);
  
  // 5. خريطة التنقل (دائماً تُضاف — مختصرة)
  const nav = getNavigationKnowledge(context.locale, context.organizationSlug);
  
  return `${identity}\n\n${knowledge}\n\n${dynamicContext}\n\n${nav}\n\n${rules}`;
}

// --- الدوال المساعدة ---

// buildIdentity: يبني قسم الهوية
// المحتوى:
// أنت "مساعد مسار" — المساعد الذكي لمنصة مسار لإدارة مشاريع المقاولات في السعودية.
// - اسمك: مساعد مسار
// - لغتك الأساسية: العربية. إذا سألك المستخدم بالإنجليزية، جاوب بالإنجليزية
// - شخصيتك: ودود، محترف، مختصر، عملي
// - المستخدم الحالي: {userName} — دوره: {userRole}
// - المنظمة: {organizationName}
// - العملة: ريال سعودي (ر.س / SAR)

// getRelevantModules: يحدد أي modules يحقنها حسب القسم
// القواعد:
// - dashboard → ['projects', 'finance'] (ملخص عام)
// - projects, project-overview → ['projects', 'execution']
// - project-execution, project-field → ['execution']
// - project-finance → ['finance', 'subcontracts']
// - project-timeline → ['projects'] (قسم الجدول الزمني)
// - project-documents, project-changes → ['projects']
// - project-chat, project-team → ['projects']
// - project-owner → ['owner-portal']
// - finance → ['finance']
// - quantities → ['quantities']
// - company → ['company']
// - settings → ['settings']
// - أي شيء آخر → ['projects', 'finance'] (الأكثر شيوعاً)
//
// ملاحظة مهمة: لا تحقن كل الـ modules دائماً — هذا يستهلك tokens
// فقط الـ modules ذات الصلة + navigation دائماً

// getModuleKnowledge: يستدعي الدالة الصحيحة من ملفات modules
// switch على اسم الوحدة ويستدعي الدالة المقابلة

// buildDynamicContext: يبني السياق الديناميكي
// المحتوى:
// ## السياق الحالي
// - الصفحة: {اسم القسم بالعربي}
// - [إذا فيه مشروع]: المشروع: {projectName} | الحالة: {projectStatus} | الإنجاز: {projectProgress}% | الميزانية: {projectBudget} ر.س
// - [إذا فيه contextData]: يعرض البيانات الملخصة

// buildRules: قواعد السلوك
// المحتوى:
// ## قواعد مهمة — التزم بها دائماً:
// 1. أجب بالعربية إلا إذا سألك بالإنجليزية
// 2. كن مختصراً ومباشراً — لا تكتب مقالات طويلة
// 3. إذا سأل عن كيفية عمل شيء، أعطه الخطوات بوضوح مع رابط الصفحة
// 4. لا تخترع بيانات — إذا ما تعرف أو ما عندك معلومات، قل ذلك بوضوح
// 5. أنت read-only — لا تقدر تعدل بيانات، فقط تقرأ وتجاوب
// 6. استخدم المصطلحات السعودية في البناء والمقاولات
// 7. عند اقتراح التنقل، استخدم المسار الكامل: /app/{organizationSlug}/...
// 8. إذا استخدمت أداة (tool) وفشلت أو رجعت فارغة، أخبر المستخدم بدلاً من الاختراع
// 9. الأرقام المالية: استخدم فاصلة للآلاف ونقطة للكسور (مثال: 1,500,000.00 ر.س)
// 10. لا تتحدث عن تفاصيل تقنية (API, database, endpoints) — المستخدم مقاول وليس مبرمج

```

## التحقق
- الملف يصدّر buildSystemPrompt + AssistantContext interface
- الدالة ترجع string مكتمل
- الـ imports من ملفات modules تعمل
- pnpm build ينجح
```

---

### المرحلة الفرعية 2.3 — ربط System Prompt مع AssistantPanel (تجريبي)

```
## المهمة
عدّل AssistantPanel ليستخدم system prompt حقيقي بدلاً من الرد المؤقت (setTimeout).
في هذه المرحلة نربط مع AI SDK مباشرة بدون tools — فقط system prompt + streamText.

## السياق
- المراحل 2.1 و 2.2 مكتملة
- packages/ai/ موجودة مع AI SDK (anthropic + openai)
- يوجد حزم: ai@5.0.93, @ai-sdk/react@2.0.93, @ai-sdk/anthropic@2.0.44
- يوجد endpoint API حالي للـ chatbot — لا تعدله. سننشئ endpoint جديد

## الملفات المطلوبة

### 1. إنشاء API Route: `apps/web/app/api/ai/assistant/route.ts`

```typescript
// POST /api/ai/assistant
// 
// هذا الـ route يستقبل رسائل من AssistantPanel ويرد عبر streaming
//
// 1. استقبل: { messages: Message[], context: PageContextPayload }
//    - messages: مصفوفة رسائل من useChat
//    - context: { organizationSlug, organizationId, organizationName, currentPage, currentSection, projectId?, projectName?, locale }
//
// 2. التحقق من المصادقة:
//    - اقرأ الـ session (ابحث عن الطريقة المستخدمة في الـ chatbot endpoint الحالي واتبع نفس النمط)
//    - إذا لا يوجد session → return 401
//
// 3. بناء system prompt:
//    import { buildSystemPrompt } from '@repo/ai/prompts/assistant-system';
//    const systemPrompt = buildSystemPrompt({
//      userName: session.user.name,
//      userRole: /* من session أو member */,
//      locale: context.locale || 'ar',
//      organizationName: context.organizationName,
//      organizationSlug: context.organizationSlug,
//      organizationId: context.organizationId,
//      currentPage: context.currentPage,
//      currentSection: context.currentSection,
//      projectId: context.projectId,
//      projectName: context.projectName,
//    });
//
// 4. استدعاء Claude:
//    import { streamText } from 'ai';
//    import { anthropic } from '@ai-sdk/anthropic';
//    
//    const result = streamText({
//      model: anthropic('claude-sonnet-4-20250514'),
//      system: systemPrompt,
//      messages,
//      maxTokens: 1000,  // ردود مختصرة
//    });
//    
//    return result.toDataStreamResponse();
//
// ملاحظات:
// - لا tools في هذه المرحلة — فقط system prompt
// - ابحث عن كيف يستورد الـ chatbot الحالي anthropic client واتبع نفس النمط
// - ابحث عن ملف: packages/ai/ لمعرفة الـ exports المتاحة
// - إذا كان الـ anthropic import مختلف عن المتوقع، استخدم ما هو موجود
// - rate limiting: 30 request/minute (استخدم نفس الآلية الموجودة إذا وُجدت)
```

### 2. تعديل AssistantPanel.tsx

```typescript
// التعديل: استبدل الرد المؤقت (setTimeout) بـ useChat من @ai-sdk/react
//
// التغييرات:
//
// 1. أزل useState للـ messages و isLoading
//
// 2. استخدم useChat:
//    import { useChat } from '@ai-sdk/react';
//    
//    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
//      api: '/api/ai/assistant',
//      body: {
//        context: {
//          organizationSlug: assistant.organizationSlug,
//          organizationId: /* تحتاج إضافته للـ AssistantContext */,
//          organizationName: assistant.organizationName,
//          currentPage: assistant.pageContext.route,
//          currentSection: assistant.pageContext.section,
//          projectId: assistant.pageContext.projectId,
//          projectName: assistant.pageContext.projectName,
//          locale: /* من useLocale() */,
//        },
//      },
//    });
//
// 3. "محادثة جديدة" = setMessages([])
//
// 4. مرر messages و isLoading لـ AssistantMessages
//
// 5. استبدل AssistantInput:
//    - value = input
//    - onChange = (val) => handleInputChange({ target: { value: val } })
//    - onSubmit = () => handleSubmit()
//    أو استخدم form مع handleSubmit مباشرة
//
// 6. Quick Actions: عند الضغط، استدعي handleSubmit مع الـ prompt كقيمة
//    - أبسط طريقة: setInput(prompt) ثم handleSubmit()
//    - أو: append({ role: 'user', content: prompt })
//    ابحث في ai-sdk/react docs عن أفضل طريقة

// ملاحظة مهمة:
// إذا كنت تحتاج organizationId في الـ context:
// - تحقق من الـ layout — قد يمرره في params أو عبر context
// - أو أضفه كـ prop لـ AssistantProvider
// - أو استخدم ORPC query لجلبه من organizationSlug
```

### 3. تعديل AssistantProvider.tsx (إذا لزم)

```typescript
// أضف organizationId لـ AssistantContextType و AssistantProvider props
// إذا كان organization layout يمررها، استخدمها
// إذا لا — يمكن جلبها عبر useQuery أو من params
```

## التحقق
- [ ] pnpm build ينجح
- [ ] افتح المساعد واكتب "مرحبا" — يجب أن يرد Claude مباشرة عبر streaming
- [ ] اسأل "كيف أنشئ فاتورة؟" — يجب أن يعطي خطوات صحيحة (من system prompt)
- [ ] اسأل "وين أنا الحين؟" — يجب أن يعرف الصفحة الحالية (من context)
- [ ] إذا داخل مشروع، اسأل "وش اسم المشروع؟" — يجب أن يجاوب صح
- [ ] "محادثة جديدة" تمسح الرسائل وتبدأ من جديد
- [ ] Streaming يعمل — الكلمات تظهر تدريجياً
- [ ] على خطأ (مثلاً API key غير موجود): رسالة خطأ واضحة بدل crash
```

---

هذه المراحل الثلاث تغطي المرحلة 2 كاملة. بعد تنفيذها سيكون عندك مساعد ذكي يعرف كل شيء عن المنصة ويجاوب من system prompt — لكن بدون وصول لبيانات المستخدم الفعلية (تلك تجي في المرحلة 3 مع AI Tools).


# سجل قرارات: إغلاق ثغرات القفل في الدفعات + توحيد قراءة IP

> **الفرع:** `payment-locks` (من `main` بعد دمج PR #47)
> **التاريخ:** 2026-07-05

---

## المرحلة 0 — نتائج القراءة المركزة

### 1. `addSubcontractClaimPayment` — `subcontract-claims.ts:796`
- **الوضع:** `$transaction` موجودة + تحقق سقف (`netAmount - paidAmount` بـ `Number` مع سماحية 0.01) — لكن **بلا قفل FOR UPDATE**. دفعتان متزامنتان تقرآن نفس `paidAmount` وتنجحان معاً.
- **الحالات المدفوعة المقبولة:** `APPROVED`, `PARTIALLY_PAID` فقط.
- **حقل السقف:** `claim.netAmount` (صافي المستخلص بعد الاستقطاعات).
- **update/delete للدفعة:** **غير موجودين** في المستودع (لا `subcontractPayment.update` ولا `.delete` في أي مكان) — لا شيء يحتاج الحماية نفسها.

### 2. `createSubcontractPayment` — `subcontract.ts:610`
- **الوضع:** `$transaction` بلا قفل **وبلا سقف إطلاقاً**.
- **معلومة حاسمة:** الدفعات المباشرة ودفعات المستخلصات صفوف في **نفس الجدول** `subcontract_payments` (دفعة المستخلص لها `claimId`، المباشرة `claimId = null`، الحالة الافتراضية `COMPLETED`).
- **حساب السقف القائم في الملف نفسه** (`getSubcontractsSummary`): `value + أوامر التغيير APPROVED` والدفعات بحالة `COMPLETED`.

### 3. أوامر تغيير الباطن — `subcontract.ts:533,567`
- `createSubcontractChangeOrder`: يسمح بالإنشاء المباشر بحالة `APPROVED` — بلا transaction وبلا قفل.
- `updateSubcontractChangeOrder`: تحديث **بالـ id فقط** — لا يتحقق من انتماء الأمر للعقد أو المنظمة (ثغرة ملكية)، بلا قفل.
- `deleteSubcontractChangeOrder`: حذف بالـ id فقط — نفس ثغرة الملكية، وحذف أمر معتمد يخفض السقف بلا تحقق.

### 4. `createProjectPayment` — `project-payments.ts:406`
- **الوضع:** `$transaction` + `withUniqueRetry` بلا قفل وبلا سقف.
- **الحالات:** لا يوجد حقل status على `ProjectPayment` — كل الصفوف تُحتسب.
- **سقف المطالبات القائم** (`createProjectClaim`): `contract.value + projectChangeOrder (APPROVED|IMPLEMENTED).costImpact`، ويتخطى التحقق إن لم يوجد عقد أو كان السقف ≤ 0.
- **دوال أخرى تعدّل المبالغ:** `updateProjectPayment` (تعديل مبلغ)، `replaceProjectPaymentGroup` (حذف + إعادة إنشاء) — تحتاج الحماية نفسها.

### نمط الاختبار المتبع
`packages/api/__tests__/modules/finance/concurrent-claims.test.ts`: ثلاث طبقات — حساب سقف نقي، محاكاة تسلسل القفل بـ `Promise.all`، وtripwire على المصدر (`readFileSync` + regex على `FOR UPDATE`). بلا DB حقيقية. الاختبارات الجديدة في `concurrent-payments.test.ts` بنفس البنية.

---

## القرارات المتخذة

### قرار المرحلة 1: قفل صف **العقد** لا صف المستخلص
النمط القائم في `subcontract-claims.ts` (إنشاء/تعديل/اعتماد المستخلص) يقفل `subcontract_contracts` — اتبعت الموجود. كما أن قفل العقد يسلسل دفعات المستخلصات مع الدفعات المباشرة (المرحلة 2) وأوامر التغيير (المرحلة 3) على صف واحد مشترك، فلا سباق بين المسارات الثلاثة. الترتيب: قراءة `contractId` من المستخلص → قفل العقد → **إعادة قراءة** المستخلص داخل القفل (قيمة `paidAmount` مستقرة الآن).

### قرار مفوَّض — سقف المرحلة 2 (دفعة العقد المباشرة)
**المعادلة:** `مجموع كل دفعات العقد بحالة COMPLETED (المباشرة + دفعات المستخلصات معاً — نفس الجدول) + الدفعة الجديدة ≤ قيمة العقد + مجموع أوامر التغيير APPROVED`.
- المساران ليسا متوازيين بلا مجموع موحّد — يجتمعان طبيعياً في `subcontract_payments`، فالتجميع واحد.
- حالة أوامر التغيير المحتسبة: `APPROVED` فقط (enum `SubcontractCOStatus` لا يحوي IMPLEMENTED) — مطابق لـ `getSubcontractsSummary`.
- إن كان السقف المعدّل ≤ 0 يُتخطى التحقق (عقود بلا قيمة محددة) — مطابق لنمط `createProjectClaim`.
- المقارنات بـ `Prisma.Decimal` مع سماحية 0.01 (نمط دفعات المستخلصات القائم).

### قرار المرحلة 3: نطاق التحقق عند تغيّر السقف
- التحقق يجري عند: إنشاء أمر بحالة `APPROVED` مباشرة، تحويل أمر إلى `APPROVED`، تعديل مبلغ أمر `APPROVED` قائم، إلغاء اعتماد أمر (APPROVED → غيرها)، **وحذف أمر معتمد** (نفس أثر التخفيض — أُدرج رغم أن المهمة ذكرت الاعتماد/التعديل فقط).
- **الأرضية:** السقف الجديد يجب ألا يقل عن `max(إجمالي المستخلصات المعتمدة grossAmount بحالات APPROVED|PARTIALLY_PAID|PAID، إجمالي الدفعات COMPLETED)`.
- **إصلاح ملكية مصاحب:** `updateSubcontractChangeOrder` و`deleteSubcontractChangeOrder` أصبحا يتحققان من انتماء الأمر للعقد والمنظمة (كانا يحدّثان/يحذفان بالـ id المجرد) — الـ procedures تمرر `contractId` و`organizationId` أصلاً.

### قرار مفوَّض — سقف المرحلة 4 (دفعة المشروع)
**المعادلة:** `مجموع كل دفعات المشروع + الجديدة ≤ قيمة العقد + projectChangeOrder (APPROVED|IMPLEMENTED).costImpact` — نفس سقف المطالبات في `createProjectClaim` حرفياً.
- **دفعة حرة مقابل دفعة على مرحلة:** كلاهما تحصيل نقدي فعلي ضد قيمة العقد، والـ spillover يمكن أن يفيض عن المراحل عمداً (التصميم القائم يلحق الفائض بآخر مرحلة)، لذا السقف على **الإجمالي الكلي** لا على المرحلة. الدفعات لا تُربط بمطالبات في هذا النموذج (لا `claimId` على `ProjectPayment`) فخيار "المعتمد غير المدفوع" غير قابل للتطبيق.
- إن لم يوجد عقد → لا سقف (الدفعات الحرة مسموحة اليوم بلا عقد — لا نكسرها).
- الحماية نفسها على `updateProjectPayment` (عند زيادة المبلغ) و`replaceProjectPaymentGroup` (إعادة إنشاء بمجموع جديد — يُستثنى مجموع المجموعة القديمة من المجموع القائم).

### المرحلة 5: توحيد قراءة IP
`getClientIp` يفضّل `x-real-ip` (يضبطه Vercel ولا يُزوَّر) ثم `x-forwarded-for`. القراءات المباشرة الخمس كانت تتخطى `x-real-ip`. التوقيع متوافق: كل المواضع تملك `Headers` object.

---

## حالة التنفيذ (2026-07-05)

نُفّذت المراحل 1–5 كاملة:
- **م1:** قفل + سقف دفعة المستخلص (`subcontract-claims.ts`) + رسالة خطأ مفصّلة في `add-claim-payment.ts`.
- **م2:** `createSubcontractPayment` — قفل العقد + سقف `value + APPROVED COs` مقابل دفعات `COMPLETED` (`PAYMENT_EXCEEDS_CONTRACT`).
- **م3:** أوامر التغيير الثلاثة داخل transactions مع قفل العقد + تحقق ملكية (`CHANGE_ORDER_NOT_FOUND`) + أرضية `CEILING_BELOW_COMMITTED`. **تنقيح على القرار:** الأرضية تُفحص فقط عندما تُخفَّض مساهمة الأمر في السقف (delta < 0) — رفع سقف متدنٍّ قديم نحو التصحيح لا يُحجب أبداً. عَرَضاً: عدّ `orderNo` انتقل داخل القفل فزال سباق تكرار الأرقام.
- **م4:** `lockProjectContract` + `assertProjectPaymentCeiling` على create/update/replace في `project-payments.ts` مع استثناء المبالغ المستبدلة، وmapping في `create.ts` و`update.ts`.
- **م5:** المواضع الخمسة تستخدم `getClientIp` من `rate-limit.ts`.

الاختبارات: `concurrent-payments.test.ts` وُسّع (سقف العقد المباشر، أرضية COs، سقف المشروع مع الاستثناء، tripwires على الملفات الثلاثة). **ملاحظة:** دُفع الفرع بطلب صريح قبل إتمام type-check/tests في الجلسة.

## اكتُشف ولم يُعالج (خارج النطاق)
- ثغرة ملكية مماثلة محتملة في procedures أخرى تحدّث بالـ id المجرد (لم تُمسح شاملاً — فقط أوامر التغيير أُصلحت لأنها ضمن نطاق المرحلة 3).
- `updateProjectPayment` يعدّل مبلغ صف واحد من مجموعة split دون إعادة توزيع — سلوك قائم لم يُمس (الواجهة تستخدم `replaceProjectPaymentGroup` للمجموعات).

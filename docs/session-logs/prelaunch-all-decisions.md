# سجل قرارات جلسة ما قبل الإطلاق — prelaunch-all-fixes

> التاريخ: 2026-07-05 | التنفيذ: Claude Code (ذاتي بالكامل)
> الصيغة: `[المرحلة] القرار | البدائل المرفوضة | السبب | الثقة`

---

## قرارات عامة

- **[عام] شجرة العمل تحتوي تعديلات غير مُرتكبة من جلسة سابقة (loading skeletons + صفحات quantities/photos).** القرار: تُترك كما هي، وكل commit يضيف ملفاته بشكل صريح (`git add <paths>`) وليس `git add -A`. | البديل المرفوض: `git stash` (خطر فقدان عمل المالك) أو ارتكابها ضمن مراحلي (تلويث الـcommits). | الثقة: عالي
- **[عام] النشر:** بطلب من المالك (رسالة أثناء الجلسة): استخدام `git push --no-verify` عند الدفع. | الثقة: عالي

## المرحلة 0 — نتائج التحقق

### المرحلة 3 (webhook): فرضية Moyasar غير صحيحة ⚠️
- grep شامل للمستودع: **صفر** نتائج لـ`moyasar` — لا provider ولا route ولا env var. المزوّد الوحيد الموصول هو **Stripe** (`packages/payments/provider/index.ts:1` يصدّر stripe فقط).
- التحقق من توقيع Stripe **موجود أصلاً** عبر `constructEventAsync` مع `STRIPE_WEBHOOK_SECRET` (`packages/payments/provider/stripe/index.ts:145-157`)، مع idempotency عبر `checkEventProcessed`.
- الفجوات الفعلية: (1) غياب `STRIPE_WEBHOOK_SECRET` يمر كـcast `as string` ويفشل بشكل غامض، (2) فشل التحقق يُسجَّل بـ`logger.error` فقط دون Sentry.
- **القرار:** لا أبني تكامل Moyasar من الصفر (كود ميت غير قابل للاختبار مقابل بوابة غير موجودة في الكود). أُحصّن Stripe webhook الموجود: fail-closed صريح عند غياب الـsecret + تسجيل Sentry عند فشل التحقق. | البديل المرفوض: بناء endpoint Moyasar وهمي — يخالف "لا كود ميت" ولا يمكن التحقق منه. | الثقة: عالي — لكن ⚠️ **على المالك تأكيد هوية بوابة الدفع الفعلية**؛ إن كانت Moyasar فعلاً فتكاملها غير موجود في الكود أصلاً (وليس فقط webhook التحقق).

### المرحلة 2 (credit note opening balance): محلول مسبقاً على الأرجح ⏭️
- الإشعار الدائن يُنشأ بمبالغ **سالبة**: `packages/database/prisma/queries/finance.ts:1720-1724` (`negTotalAmount`) مع تعليق "Bug #9 fix" (حد المبلغ، سطر 1698-1715) و"Bug #8 fix" (تحديث paidAmount للفاتورة الأصلية، سطر 1778-1790).
- الرصيد الافتتاحي في `client-statements.ts:47-78` يجمع `_sum.totalAmount` — والسالب يطرح تلقائياً → فاتورة 10,000 + إشعار 2,000 قبل الفترة = 8,000 ✓
- حركات الفترة (سطر 115-124) تعرض الإشعار في عمود الدائن بـ`Math.abs` — متسق مع الافتتاحي.
- بانتظار فحص aging report وملخصات العملاء (وكيل الاختبارات) قبل الشطب النهائي.

### المرحلة 4 (تحصين النقاط العامة): محلولة مسبقاً بالكامل ⏭️
- **4.أ CAPTCHA:** Cloudflare Turnstile مطبّق فعلاً:
  - Server: `packages/api/lib/turnstile.ts:30-74` — `verifyTurnstileToken` fail-closed (الإنتاج بدون `TURNSTILE_SECRET_KEY` = رفض؛ أي فشل fetch = رفض BAD_REQUEST).
  - Contact: `packages/api/modules/contact/procedures/submit-contact-form.ts:22-24` — rate limit IP `PUBLIC_FORM` 3/دقيقة + Turnstile.
  - Newsletter: `packages/api/modules/newsletter/procedures/subscribe-to-newsletter.ts:25-28` — نفس النمط.
  - Widget: `apps/web/modules/shared/components/TurnstileWidget.tsx:40-44` — `language: "ar"` + `size: flexible` + dev bypass.
- **4.ب Rate limiting بوابة المالك:** موجود فعلاً في `packages/api/modules/project-owner/procedures/exchange-token.ts:24-31` — IP‏ `OWNER_EXCHANGE` 5/دقيقة + per-token 30/دقيقة + تأخير 1 ثانية على الفشل؛ وكل endpoints البوابة تستدعي `rateLimitToken` (30/دقيقة).
- **القرار:** لا عمل مطلوب. ⚠️ يتبقى على المالك ضبط `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` في Vercel (بدون site key لن يعمل نموذج التواصل في الإنتاج لأن الزر يبقى معطلاً). | الثقة: عالي
- ملاحظة خارج النطاق (توثيق فقط): endpoints العامة تقرأ IP من `x-forwarded-for` مباشرة بينما يوجد helper أفضل `getClientIp` يفضّل `x-real-ip` (`rate-limit.ts:360`) — توحيدها تحسين مستقبلي.


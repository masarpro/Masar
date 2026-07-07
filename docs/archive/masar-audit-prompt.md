# برومبت تدقيق شامل لمنصة مسار — الإصدار 4.0

## التعليمات العامة

أنت مدقق تقني محترف. مطلوب منك إجراء تدقيق شامل ومعمّق لمنصة **مسار (Masar)** — منصة SaaS لإدارة المشاريع الإنشائية. التقرير يجب أن يكون **مرجعاً كاملاً** للمشروع بكل تفاصيله، بدون مجاملة وبدون تجميل.

**مهم جداً:**
- اقرأ كل ملف فعلياً قبل أي تحليل — لا تخمّن أبداً
- كل رقم يجب أن يكون من القراءة الفعلية
- لا تكرر معلومات من تقارير سابقة — اقرأ الوضع الحالي فقط
- كن صريحاً وقاسياً في النقد — المطلوب الحقيقة لا المجاملة
- التقرير يجب أن يتجاوز **5,000 سطر** ويصل إلى **8,000 سطر**
- اكتب التقرير بالعربية مع المصطلحات التقنية بالإنجليزية

---

## المرحلة 0: الإحصائيات الأولية (نفّذ أولاً)

قبل أي شيء، نفّذ هذه الأوامر واحفظ النتائج لاستخدامها في التقرير:

```bash
# 1. إحصائيات الملفات
echo "=== FILE COUNTS ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" | wc -l
find . -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" | wc -l
find . -name "*.prisma" -not -path "*/node_modules/*" | wc -l

# 2. إحصائيات الأسطر
echo "=== LINE COUNTS ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -exec cat {} + | wc -l
find . -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -exec cat {} + | wc -l
cat packages/database/prisma/schema.prisma | wc -l

# 3. عدد الصفحات والـ Layouts
echo "=== PAGES & LAYOUTS ==="
find apps/web/app -name "page.tsx" | wc -l
find apps/web/app -name "layout.tsx" | wc -l
find apps/web/app -name "loading.tsx" | wc -l
find apps/web/app -name "error.tsx" | wc -l
find apps/web/app -name "not-found.tsx" | wc -l

# 4. عدد الـ Models والـ Enums
echo "=== PRISMA MODELS & ENUMS ==="
grep -c "^model " packages/database/prisma/schema.prisma
grep -c "^enum " packages/database/prisma/schema.prisma

# 5. عدد الـ API Endpoints (عدد الدوال المُصدّرة في routers)
echo "=== API ENDPOINTS ==="
find packages/api -name "*.ts" -path "*/modules/*" -exec grep -l "protectedProcedure\|publicProcedure\|subscriptionProcedure\|adminProcedure" {} + | wc -l

# 6. أكبر 50 ملف حسب الأسطر
echo "=== LARGEST 50 FILES ==="
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -not -path "*/generated/*" -exec wc -l {} + | sort -rn | head -50

# 7. عدد "use client"
echo "=== USE CLIENT COUNT ==="
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec grep -l '"use client"' {} + | wc -l

# 8. عدد Suspense
echo "=== SUSPENSE USAGE ==="
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec grep -l "Suspense" {} + | wc -l

# 9. عدد dynamic imports
echo "=== DYNAMIC IMPORTS ==="
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec grep -l "dynamic(" {} + | wc -l

# 10. عدد <img> vs next/Image
echo "=== IMG vs IMAGE ==="
find . -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" -exec grep -l "<img " {} + | wc -l
find . -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" -exec grep -l "from \"next/image\"" {} + | wc -l

# 11. مفاتيح الترجمة
echo "=== TRANSLATION KEYS ==="
wc -l apps/web/messages/ar.json
wc -l apps/web/messages/en.json

# 12. عدد الـ hooks المخصصة
echo "=== CUSTOM HOOKS ==="
find . -name "use-*.ts" -o -name "use-*.tsx" -o -name "use*.ts" | grep -v node_modules | grep -v .next | wc -l

# 13. Dependencies
echo "=== DEPENDENCIES ==="
cat apps/web/package.json | grep -c '"'

# 14. عدد ملفات الاختبارات
echo "=== TEST FILES ==="
find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | grep -v node_modules | wc -l

# 15. Hardcoded Arabic strings
echo "=== HARDCODED ARABIC ==="
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/messages/*" -not -path "*/i18n/*" -exec grep -l '[أ-ي]' {} + | wc -l

# 16. console.log في الكود
echo "=== CONSOLE LOGS ==="
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec grep -c "console\.\(log\|warn\|error\)" {} + | awk -F: '{sum += $2} END {print sum}'

# 17. TODO/FIXME/HACK comments
echo "=== TODO/FIXME/HACK ==="
find . \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" -exec grep -c "TODO\|FIXME\|HACK\|XXX" {} + | awk -F: '{sum += $2} END {print sum}'

# 18. عدد الـ Zod schemas
echo "=== ZOD SCHEMAS ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -exec grep -l "z\.object\|z\.string\|z\.number" {} + | wc -l

# 19. Prisma indexes
echo "=== PRISMA INDEXES ==="
grep -c "@@index" packages/database/prisma/schema.prisma
grep -c "@@unique" packages/database/prisma/schema.prisma

# 20. Package versions
echo "=== KEY PACKAGE VERSIONS ==="
cat apps/web/package.json | grep -E '"next"|"react"|"@tanstack|"zod"|"prisma"|"hono"|"better-auth"'
```

---

## المرحلة 1: قراءة الهيكل العام

### 1.1 اقرأ هذه الملفات أولاً:
```
- apps/web/package.json (كل الـ dependencies والـ scripts)
- apps/web/next.config.ts (كامل — headers, redirects, CSP, optimizations)
- apps/web/tsconfig.json
- turbo.json
- pnpm-workspace.yaml
- package.json (الجذر)
- packages/database/prisma/schema.prisma (كامل — كل model وenum وindex)
- apps/web/messages/ar.json (عدّ المفاتيح وقارن مع en.json)
- apps/web/messages/en.json
- .env.local.example أو .env.example (إن وُجد)
```

### 1.2 اقرأ هيكل المجلدات:
```
- ls -la apps/web/app/ (كل المستويات حتى عمق 4)
- ls -la packages/ (كل الحزم)
- ls -la apps/web/modules/ (كل الوحدات)
- ls -la apps/web/hooks/
- ls -la apps/web/modules/saas/ (كل الوحدات الفرعية)
```

---

## المرحلة 2: تحليل كل طبقة

### 2.1 طبقة قاعدة البيانات (Prisma Schema)

اقرأ `packages/database/prisma/schema.prisma` بالكامل وسجّل:

1. **كل model** — اسمه، حقوله، أنواعها، العلاقات، الـ indexes، الـ constraints
2. **كل enum** — اسمه وقيمه
3. **خريطة العلاقات** — من يرتبط بمن (one-to-many, many-to-many)
4. **تحليل الـ indexes** — هل هناك indexes مفقودة للاستعلامات المتوقعة؟
5. **Decimal precision** — هل كل الحقول المالية تستخدم Decimal(15,2)؟
6. **Cascade deletes** — ما تأثير حذف Organization أو Project؟
7. **Soft delete patterns** — هل يوجد archivedAt/deletedAt؟
8. **Connection pooling** — اقرأ إعدادات الاتصال
9. **Migration history** — هل يوجد ملفات migrations؟

### 2.2 طبقة المصادقة والصلاحيات

اقرأ هذه الملفات:
```
- packages/auth/ (كل الملفات)
- packages/api/lib/auth/ أو أي مكان فيه إعداد BetterAuth
- packages/api/lib/rate-limit.ts
- packages/api/lib/permissions/ أو أي ملف صلاحيات
- packages/api/procedures/ أو أي ملف فيه protectedProcedure/subscriptionProcedure
- apps/web/app/auth/ (كل صفحات المصادقة)
- apps/web/modules/saas/auth/ (كل المكونات)
```

سجّل:
1. طرق المصادقة المدعومة (Email, OAuth, Magic Link, Passkey, 2FA)
2. إعدادات الجلسة (مدة، تجديد، freshAge)
3. الأدوار الـ 6 وصلاحياتها الـ 42
4. كيف يعمل verifyOrganizationAccess
5. كيف يعمل enforceFeatureAccess
6. Rate limiting — كل المستويات والحدود
7. Circuit breaker للـ Redis
8. Owner Portal authentication — كيف يعمل الـ token exchange
9. ثغرات أمنية (session lifetime, 2FA enforcement, brute force)

### 2.3 طبقة API (oRPC + Hono)

اقرأ **كل** ملفات الـ API modules:
```
packages/api/modules/ (كل مجلد وكل ملف router فيه)
packages/api/lib/ (كل utilities)
packages/api/index.ts أو app.ts (الـ entry point)
apps/web/app/api/ (كل الـ route handlers)
```

لكل module سجّل:
1. عدد الـ endpoints (قراءة/كتابة)
2. نوع الـ procedure (public/protected/subscription/admin)
3. الـ input schema (Zod) — هل يوجد .max()؟ هل الـ validation كافية؟
4. الـ output — ماذا يُرجع؟
5. الحماية — verifyAccess، featureGate، audit log
6. مشاكل N+1 queries
7. Unbounded queries (بدون pagination أو limit)
8. Error handling patterns
9. الـ Business logic — ملخص ما يفعله كل endpoint

**قائمة الـ 39 module المتوقعة:**
finance, company, pricing, super-admin, project-execution, subcontracts, project-finance, project-documents, project-change-orders, project-owner, project-field, dashboard, project-timeline, projects, project-templates, exports, onboarding, activation-codes, ai, org-users, project-contract, attachments, integrations, notifications, project-payments, digests, project-chat, project-team, roles, shares, admin, organizations, payments, project-insights, project-updates, contact, newsletter, users, leads

### 2.4 طبقة الواجهة (Frontend) — **تعمّق هنا بشكل خاص**

#### 2.4.1 كل الصفحات (page.tsx)
اقرأ كل صفحة وسجّل:
- ما البيانات التي تجلبها؟
- هل هي Server Component أو Client Component؟
- هل تستخدم Suspense؟
- هل تستخدم loading.tsx مع skeleton مناسب؟
- هل تستخدم error.tsx؟
- حجم المكون الرئيسي (عدد الأسطر)
- هل هناك dynamic imports؟ مع loading fallback؟

#### 2.4.2 كل الـ Layouts (layout.tsx)
اقرأ كل layout وسجّل:
- ماذا يفعل؟ (session check, org validation, etc.)
- هل هو Server أو Client Component؟
- هل يُسبّب re-render عند التنقل؟
- هل يجلب بيانات (waterfall)؟
- **مشكلة تراكم الطبقات:** هل الـ layouts المتداخلة تُسبّب أن المستخدم يرى محتوى يظهر ثم يختفي ثم يظهر محتوى آخر؟

#### 2.4.3 تحليل UX/UI معمّق — **الأهم**

اقرأ هذه الملفات بعناية:
```
- apps/web/modules/saas/shared/components/sidebar/ (كل ملفات الـ sidebar)
- apps/web/modules/saas/shared/components/ai-assistant/ (كل ملفات المساعد)
- apps/web/modules/saas/shared/components/skeletons.tsx
- apps/web/modules/shared/components/ (كل المكونات المشتركة)
- apps/web/modules/ui/ (كل مكونات UI)
- apps/web/app/(saas)/app/layout.tsx
- apps/web/app/(saas)/app/[organizationSlug]/layout.tsx
- apps/web/app/(saas)/app/[organizationSlug]/projects/[projectId]/layout.tsx
```

حلّل وسجّل:
1. **مشكلة الطبقات (Layout Stacking):**
   - كم layout يمر بها المستخدم قبل رؤية المحتوى؟
   - هل كل layout يجلب بيانات مستقلة (waterfall)؟
   - هل المستخدم يرى skeleton ثم محتوى ثم skeleton آخر ثم محتوى آخر؟
   - ما هو الترتيب الزمني لما يراه المستخدم عند فتح صفحة مشروع؟

2. **مشكلة Flash of Content:**
   - هل يظهر محتوى ثم يختفي (flash) عند التنقل؟
   - هل الـ sidebar يُعاد رسمه؟
   - هل هناك layout shift واضح؟
   - هل الـ loading states تتطابق مع الشكل النهائي؟

3. **سرعة التنقل:**
   - اقرأ Cache-Control headers في next.config.ts — ما تأثيرها؟
   - اقرأ prefetch strategy في SidebarNav — كم رابط لديه prefetch؟
   - اقرأ React Query settings — ما هي staleTime و gcTime؟
   - هل هناك middleware.ts؟ (أو غيابه)
   - ما هو مسار الطلب من النقر على رابط حتى ظهور المحتوى؟

4. **حجم الـ Bundle:**
   - كم مكون "use client"؟
   - ما أكبر 30 مكون client؟
   - هل يوجد tree-shaking لـ lucide-react/recharts/radix?
   - هل يوجد bundle analyzer مُثبّت؟
   - ما الـ dependencies الأثقل؟

5. **Responsive Design:**
   - اقرأ sidebar collapse behavior
   - اقرأ table responsive behavior
   - اقرأ dialog/sheet responsive behavior
   - هل الأزرار والحقول مناسبة للموبايل؟
   - هل الـ Gantt Chart يعمل على شاشات صغيرة؟

6. **RTL Issues:**
   - كيف يُكتشف اتجاه الصفحة؟ (server vs client)
   - هل هناك flash of wrong direction؟
   - هل كل المكونات تستخدم logical properties (ms-, me-, ps-, pe-)؟
   - هل الأيقونات الاتجاهية مقلوبة في RTL؟

7. **Dark Mode:**
   - هل كل المكونات تدعم Dark Mode؟
   - هل هناك ألوان hardcoded لا تتغير في Dark Mode؟
   - هل الرسوم البيانية تدعم Dark Mode؟

8. **Accessibility:**
   - هل هناك aria-labels مناسبة؟
   - هل الـ keyboard navigation يعمل؟
   - هل الـ focus management سليم في dialogs و sheets؟
   - هل ألوان التباين كافية؟

#### 2.4.4 تحليل المكونات الضخمة
اقرأ أكبر 30 مكون (حسب الأسطر) وسجّل لكل واحد:
- عدد الأسطر
- ما يفعله
- لماذا هو كبير
- كيف يمكن تقسيمه
- هل يستخدم React.memo أو useMemo أو useCallback؟
- هل هو "use client"؟ وما حجم الـ JS bundle المتوقع؟

#### 2.4.5 شجرة الـ Providers
اقرأ كل الـ providers المتداخلة وسجّل:
- ترتيبها من الخارج للداخل
- ما يفعله كل provider
- هل هناك re-renders غير ضرورية؟
- هل هناك error boundaries بينها؟

### 2.5 طبقة الذكاء الاصطناعي

اقرأ:
```
- packages/ai/ (كل الملفات)
- apps/web/app/api/ai/ (كل الـ routes)
- apps/web/modules/saas/shared/components/ai-assistant/ (كل المكونات)
- apps/web/modules/saas/ai/ إن وُجد
```

سجّل:
1. الـ Model المستخدم والإعدادات
2. System prompt — اقرأه كاملاً
3. كل الأدوات (tools) — ماذا يفعل كل واحد، ما المدخلات والمخرجات
4. Streaming implementation
5. حدود الاستخدام (tokens, messages, steps)
6. Feature gating
7. Page context injection — كيف يعرف AI أين المستخدم
8. UX للمساعد — كيف يُفتح/يُغلق، أين يظهر، هل يعيق الاستخدام

### 2.6 طبقة التكاملات

اقرأ:
```
- packages/api/lib/zatca/ (كل ملفات ZATCA)
- packages/mail/ (كل ملفات البريد)
- packages/payments/ (كل ملفات الدفع)
- packages/storage/ (كل ملفات التخزين)
```

### 2.7 طبقة الاختبارات

اقرأ كل ملفات الاختبارات الموجودة:
```
find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | grep -v node_modules
```

---

## المرحلة 3: هيكل التقرير المطلوب

اكتب التقرير بالهيكل التالي. **كل قسم يجب أن يكون مفصّلاً بعمق:**

---

### جدول المحتويات

```
الجزء الأول: الملخص التنفيذي
  1.1 ما هو مسار وما هي رؤيته
  1.2 الأرقام الرئيسية (من القراءة الفعلية)
  1.3 تقييم الجاهزية التفصيلي (كل وحدة بنسبة مئوية مع تبرير)
  1.4 أهم 20 مشكلة حرجة (مرتبة Critical → High → Medium)
  1.5 أهم 10 نقاط قوة
  1.6 ملخص التوصيات العاجلة (جدول)
  1.7 خارطة طريق مقترحة (3 مراحل)

الجزء الثاني: البنية التقنية والمعمارية
  2.1 مكدس التقنيات مع الإصدارات الفعلية
  2.2 هيكل Monorepo التفصيلي (شجرة كاملة)
  2.3 App Router Structure (كل route group مع عدد الصفحات)
  2.4 Data Flow (من المستخدم حتى قاعدة البيانات — مفصّل)
  2.5 Architecture Diagram (ASCII)
  2.6 تقييم القرارات المعمارية (صحيحة ✅ / مشكوكة ❌)
  2.7 Technical Debt (كل دين تقني مع شدته)

الجزء الثالث: قاعدة البيانات
  3.1 كل الـ Models (جدول: رقم، اسم، وصف، حقول رئيسية)
  3.2 كل الـ Enums (جدول مُصنّف)
  3.3 خريطة العلاقات (diagram)
  3.4 تحليل الـ Indexes (موجودة ومفقودة)
  3.5 Cascade Delete Analysis
  3.6 Decimal Precision Audit
  3.7 Connection Pooling وRegion Analysis
  3.8 Data Integrity (optimistic locking, unique constraints)
  3.9 تقديرات حجم البيانات وScalability

الجزء الرابع: نظام المصادقة والصلاحيات
  4.1 BetterAuth Configuration
  4.2 طرق المصادقة المدعومة
  4.3 نظام الأدوار (6 أدوار)
  4.4 الـ 42 صلاحية (جدول كامل)
  4.5 مصفوفة الصلاحيات (دور × صلاحية)
  4.6 Middleware Chain
  4.7 Session Management
  4.8 الثغرات الأمنية في المصادقة
  4.9 OAuth Configuration

الجزء الخامس: طبقة API
  5.1 oRPC Architecture
  5.2 كل الـ Modules (39) مع عدد Endpoints
  5.3 Procedure Levels (جدول: public/protected/subscription/admin)
  5.4 Input Validation Analysis (هل كل field له .max()؟)
  5.5 Error Handling Patterns
  5.6 API Performance Analysis (N+1, unbounded queries)
  5.7 Missing Endpoints
  5.8 API Security Audit

الجزء السادس: واجهة المستخدم — **القسم الأطول والأعمق**
  6.1 كل الصفحات (171+) — جدول مفصّل
  6.2 كل الـ Layouts (17+) — تحليل مفصّل
  6.3 Component Architecture
  6.4 State Management (React Query settings بالتفصيل)
  6.5 Form Handling
  6.6 Tables
  6.7 RTL Implementation — تحليل معمّق
  6.8 Responsive Design — تحليل معمّق
  6.9 Accessibility Audit
  6.10 Dark Mode Audit

الجزء السابع: تحليل الأداء وبطء التنقل ⚠️ — **قسم حرج**
  7.1 تحليل Bundle Size
  7.2 Client vs Server Components (عدد كل نوع)
  7.3 Layout Re-rendering Analysis
  7.4 لماذا التنقل بطيء؟ — 10+ أسباب مع ملفات وأسطر محددة
  7.5 مشكلة تراكم الطبقات (Layout Stacking) — تحليل تفصيلي
  7.6 مشكلة Flash of Content
  7.7 مشكلة ظهور واختفاء المحتوى
  7.8 Cache-Control Headers Analysis
  7.9 Prefetch Strategy Analysis
  7.10 React Query Cache Analysis
  7.11 Region Mismatch Impact
  7.12 Dynamic Imports Analysis
  7.13 Image Optimization Audit
  7.14 Font Loading Analysis
  7.15 خطة تحسين الأداء (جدول: خطوة، أثر، صعوبة)

الجزء الثامن: الأمان ⚠️
  8.1 Security Headers Analysis
  8.2 CSP Analysis (كل directive)
  8.3 Authentication Vulnerabilities
  8.4 Authorization Vulnerabilities (IDOR, Privilege Escalation)
  8.5 Input Validation Gaps
  8.6 XSS Vectors
  8.7 CSRF Protection
  8.8 SQL Injection Protection
  8.9 File Upload Security
  8.10 Rate Limiting Analysis (كل مستوى)
  8.11 Multi-tenant Isolation
  8.12 API Key / Secret Exposure
  8.13 Owner Portal Security
  8.14 Third-party Dependencies
  8.15 OWASP Top 10 Checklist
  8.16 Security Remediation Plan

الجزء التاسع: الوحدات الوظيفية — **تحليل كل وحدة**
  9.1 إدارة المشاريع
  9.2 التنفيذ الميداني
  9.3 الجدول الزمني و Gantt
  9.4 النظام المالي
  9.5 المطالبات
  9.6 العقود ومقاولو الباطن
  9.7 بوابة المالك
  9.8 إدارة الشركة (HR)
  9.9 دراسات الكميات (Quantity Surveying)
  9.10 الذكاء الاصطناعي (مساعد مسار)
  9.11 نظام المستندات
  9.12 نظام الإشعارات
  9.13 Super Admin Panel
  9.14 Onboarding Wizard
  9.15 نظام التسعير والعروض
  9.16 نظام CRM/Leads
  9.17 ملخص الجودة لكل وحدة (جدول /10)

الجزء العاشر: التكاملات الخارجية
  10.1 ZATCA Phase 1 (تحليل مفصّل للكود)
  10.2 ZATCA Phase 2 (ما المفقود)
  10.3 Stripe Integration
  10.4 Supabase Storage
  10.5 Email System (Resend + alternatives)
  10.6 OAuth Providers
  10.7 AI APIs (Anthropic + OpenAI)
  10.8 تقييم كل تكامل

الجزء الحادي عشر: الترجمة والتدويل
  11.1 next-intl Configuration
  11.2 عدد مفاتيح الترجمة (ar vs en)
  11.3 Hardcoded Strings (قائمة كل الأماكن)
  11.4 RTL Issues
  11.5 Missing Translations
  11.6 Translation Quality

الجزء الثاني عشر: الاختبارات و CI/CD
  12.1 الوضع الحالي (كل ملف اختبار موجود)
  12.2 Test Coverage Estimate
  12.3 CI/CD Pipeline
  12.4 Deployment Process
  12.5 خطة اختبارات مقترحة

الجزء الثالث عشر: التوصيات والخلاصة
  13.1 أهم 30 توصية مرتبة (Quick Wins → شهر → 3 أشهر → 6 أشهر)
  13.2 Quick Wins (يوم واحد) — جدول مفصّل
  13.3 Medium Term — جدول
  13.4 Long Term — جدول
  13.5 ما يجب عدم فعله (Anti-recommendations)
  13.6 تقييم عام: نقاط القوة
  13.7 تقييم عام: نقاط الضعف
  13.8 هل المنصة جاهزة للمستخدمين الحقيقيين؟
  13.9 ما الذي قد يسبب فشل المنصة؟
  13.10 ما الذي يميزها عن المنافسين؟

الملاحق — **مهمة جداً**
  ملحق أ: Environment Variables المطلوبة (كل variable مع وصفه)
  ملحق ب: كل API Endpoints — جدول (module, read count, write count, total)
  ملحق ج: مصفوفة الصلاحيات الكاملة (42 صلاحية × 6 أدوار)
  ملحق د: خريطة المسارات (Route Map) — كل URL ووصفه
  ملحق هـ: كل المكتبات الرئيسية (اسم، إصدار، غرض)
  ملحق و: أوامر التطوير المهمة
  ملحق ز: Glossary (مصطلحات مسار)
  ملحق ح: Security Checklist (مكتمل/غير مكتمل)
```

---

## الملحق التفصيلي المطلوب (يضاف بعد الملاحق الرئيسية)

```
الملحق التفصيلي 1: تحليل معمّق لكل وحدة API
  - لكل module من الـ 39: كل endpoint بالتفصيل
  - المدخلات، المخرجات، الحماية، التقييم
  - أمثلة كود من الملفات الفعلية

الملحق التفصيلي 2: تحليل أنماط الأداء في Database Queries
  - N+1 patterns محتملة
  - Indexes المفقودة بالتفصيل
  - Connection pooling settings
  - Region mismatch impact calculations

الملحق التفصيلي 3: تحليل نظام Feature Gating
  - الـ 9+ features المحكومة
  - كود آلية الفحص
  - FREE vs PRO limits

الملحق التفصيلي 4: تحليل ZATCA
  - Phase 1 implementation details
  - Phase 2 requirements و gap analysis

الملحق التفصيلي 5: تحليل نظام Email
  - كل القوالب
  - Provider abstraction code

الملحق التفصيلي 6: تحليل نظام الاشتراكات
  - Activation codes
  - Stripe webhooks
  - Plan management

الملحق التفصيلي 7: تحليل React Query
  - كل stale times
  - Cache invalidation patterns
  - تأثير على التنقل

الملحق التفصيلي 8: تحليل صفحات الواجهة
  - كل صفحة مشروع (72+) بالتفصيل
  - صفحات التسعير
  - صفحات الشركة
  - صفحات المالية
  - صفحات الإعدادات
  - بوابة المالك

الملحق التفصيلي 9: تحليل مكونات Sidebar
  - AppSidebar.tsx
  - SidebarNav.tsx (prefetch analysis)
  - use-sidebar-menu.ts (القائمة الكاملة)
  - SidebarHeader, SidebarFooter
  - sidebar-context.tsx

الملحق التفصيلي 10: تحليل نظام القوالب المالية
  - TemplateCustomizer analysis
  - Component palette
  - Performance issues

الملحق التفصيلي 11: تحليل نظام Onboarding
  - كل خطوة بالتفصيل
  - Checklist on Dashboard

الملحق التفصيلي 12: تحليل أنماط الأخطاء
  - ORPCError codes
  - Arabic error messages
  - Frontend error handling

الملحق التفصيلي 13: تحليل نظام التصدير
  - كل export endpoint
  - PDF generation
  - CSV generation
  - ICS generation

الملحق التفصيلي 14: تحليل نظام المشاركة
  - Share links
  - Token-based access
  - Cache headers

الملحق التفصيلي 15: تحليل نظام Digests
  - Weekly reports
  - Subscriptions

الملحق التفصيلي 16: تحليل نظام التكاملات
  - WhatsApp/SMS settings
  - Delivery logs
  - Bulk messaging

الملحق التفصيلي 17: تحليل Dashboard
  - getAll endpoint (كل البيانات)
  - Performance concerns
  - Caching recommendations

الملحق التفصيلي 18: تحليل كل Custom Hook
  - لكل hook: المسار، الحجم، الغرض، التقنية، التقييم
  - ازدواجيات وhooks مفقودة

الملحق التفصيلي 19: تحليل نظام Rate Limiting
  - كل مستوى بالتفصيل
  - Circuit breaker code
  - In-memory fallback
  - تقييم الأمان

الملحق التفصيلي 20: تحليل متغيرات البيئة
  - تصنيف حسب الحساسية (حرجة/مهمة/عامة)
  - تحليل أمني
  - غياب validation schema

الملحق التفصيلي 21: تحليل Prisma Indexes
  - كل index موجود
  - كل index مفقود مع التأثير المتوقع

الملحق التفصيلي 22: تحليل الثيمات والتصميم
  - CSS variables (light & dark)
  - Chart colors
  - RTL CSS
  - Fonts
  - تقييم التناسق البصري

الملحق التفصيلي 23: تحليل شجرة Providers
  - كل provider بالترتيب
  - ما يفعله
  - مشاكل الأداء
  - Error boundaries

الملحق التفصيلي 24: تحليل next.config.ts
  - Security headers بالتفصيل
  - CSP directives
  - Cache-Control لكل route
  - Redirects
  - Package optimizations

الملحق التفصيلي 25: تحليل نظام Build
  - Turborepo pipeline
  - Scripts
  - Docker configuration

الملحق التفصيلي 26: تحليل أكبر 30 مكون
  - لكل مكون: اسم، أسطر، وحدة، تحليل، خطة تقسيم

الملحق التفصيلي 27: تحليل مكونات UI الأساسية
  - كل مكون (35+) مع وصفه

الملحق التفصيلي 28: تحليل نظام الجداول
  - TanStack React Table usage
  - كل تنفيذ جدول
  - Pagination patterns

الملحق التفصيلي 29: تحليل Loading States
  - كل skeleton component
  - تطابق مع المحتوى النهائي

الملحق التفصيلي 30: ملخص إحصائي شامل
  - إحصائيات الكود (جدول شامل)
  - إحصائيات الأداء المُقدّرة
  - إحصائيات الأمان
  - مقارنة مع المنافسين
```

---

## المرحلة 4: تعليمات خاصة لقسم الأداء والـ UX

هذا القسم الأهم في التقرير. أريد تحليلاً عميقاً لتجربة المستخدم الفعلية:

### 4.1 تتبّع رحلة المستخدم

**السيناريو 1: فتح صفحة مشروع من الداشبورد**
تتبّع ما يحدث خطوة بخطوة:
1. المستخدم ينقر على رابط المشروع
2. ما الذي يحدث في كل layout على الطريق؟
3. ما البيانات التي تُجلب في كل مستوى؟
4. ما الذي يراه المستخدم في كل مرحلة؟ (skeleton? blank? content?)
5. هل هناك لحظات "يظهر شيء ثم يختفي"؟
6. كم ثانية حتى يرى المحتوى النهائي؟

**السيناريو 2: إنشاء فاتورة**
1. النقر على "فاتورة جديدة"
2. تحميل النموذج
3. ملء البيانات
4. الحفظ والإصدار
5. ما المشاكل في كل خطوة؟

**السيناريو 3: التنقل السريع بين الأقسام**
1. من الداشبورد للمشاريع
2. من المشاريع لمشروع محدد
3. من المشروع للمالية
4. من المالية للفواتير
5. ما الذي يُعاد تحميله في كل خطوة؟

### 4.2 تحليل Waterfall في الـ Layouts

اقرأ كل layout متداخل وحدّد:
```
Root Layout → يفعل ماذا؟ (0ms أو Xms)
  └─ (saas) Layout → يفعل ماذا؟ (session check = Xms)
      └─ app Layout → يفعل ماذا؟ (org validation = Xms)
          └─ [orgSlug] Layout → يفعل ماذا؟ (subscription check = Xms + sidebar render)
              └─ projects Layout → يفعل ماذا؟
                  └─ [projectId] Layout → يفعل ماذا؟ (project validation = Xms)
                      └─ page.tsx → المحتوى الفعلي
```

**حدّد:**
- هل كل layout ينتظر البيانات قبل عرض children؟
- هل يوجد parallel data fetching أو sequential waterfall؟
- ما إجمالي الوقت المتوقع قبل ظهور المحتوى؟

### 4.3 تحليل مشكلة "يظهر ثم يختفي"

هذه المشكلة تحدث عادة بسبب:
1. Server Component يعرض shell → ثم Client Component يأخذ وقت للـ hydrate
2. Layout يعرض sidebar → ثم inner layout يعرض loading
3. React Query يعرض cached data → ثم يحذفها عند refetch
4. Suspense boundary يعرض fallback → ثم يختفي عند تحميل البيانات
5. Multiple loading states تتراكب

**حدّد أي من هذه الأنماط موجود في مسار وأين بالضبط.**

---

## المرحلة 5: تعليمات الكتابة

### أسلوب الكتابة:
- **بالعربية** مع المصطلحات التقنية بالإنجليزية
- **مباشر وصريح** — لا مجاملة، لا "مع الاحترام"، لا "ممتاز لكن..."
- **أرقام دقيقة** — كل رقم من القراءة الفعلية
- **ملفات محددة** — اذكر اسم الملف الكامل وأرقام الأسطر
- **أمثلة كود** عند الحاجة (مقتطفات قصيرة)
- **جداول** لتنظيم البيانات
- **ASCII diagrams** للهياكل والعلاقات

### التنسيق:
- استخدم Markdown
- عناوين واضحة (#, ##, ###)
- جداول مُنسّقة
- كود blocks مع syntax highlighting
- قوائم مرقّمة للأولويات
- رموز للشدة: 🔴 حرج | 🟠 عالي | 🟡 متوسط | 🟢 منخفض | ✅ جيد | ⚠️ تحذير | ❌ مفقود

### الحد الأدنى لكل قسم:
- الملخص التنفيذي: 300+ سطر
- قاعدة البيانات: 400+ سطر
- المصادقة والصلاحيات: 300+ سطر
- طبقة API: 400+ سطر
- واجهة المستخدم: 500+ سطر
- الأداء وبطء التنقل: 500+ سطر
- الأمان: 400+ سطر
- الوحدات الوظيفية: 600+ سطر
- التكاملات: 200+ سطر
- الترجمة: 150+ سطر
- الاختبارات: 150+ سطر
- التوصيات: 300+ سطر
- الملاحق التفصيلية: 2000+ سطر
- **الإجمالي: 6,000-8,000+ سطر**

---

## المرحلة 6: ملف الإخراج

احفظ التقرير في ملف واحد:
```
MASAR_FULL_AUDIT_REPORT_v4.md
```

في بداية التقرير أضف:
```markdown
> **تاريخ التقرير:** [التاريخ الحالي]
> **الإصدار:** 4.0
> **مبني على قراءة فعلية لكل ملف في المشروع**
> **عدد الملفات المقروءة:** [العدد الفعلي]
> **عدد أسطر الكود:** [العدد الفعلي]
> **وقت التدقيق:** [تقدير]
```

---

## تذكيرات نهائية

1. **اقرأ أولاً، اكتب ثانياً** — لا تبدأ الكتابة حتى تقرأ كل ملف مطلوب
2. **لا تخمّن** — إذا لم تجد ملفاً، قل أنه غير موجود
3. **كن قاسياً** — المطلوب تقرير تدقيق حقيقي لا مديح
4. **الأرقام أولاً** — كل ادعاء يجب أن يكون مدعوماً برقم أو مرجع ملف
5. **تعمّق في الأداء** — هذا أهم قسم لأن المستخدمين يشتكون من البطء
6. **تعمّق في UX** — مشكلة الطبقات والظهور/الاختفاء مزعجة جداً
7. **لا تنسَ الملاحق التفصيلية** — هي التي تجعل التقرير مرجعاً كاملاً
8. **5,000 سطر هو الحد الأدنى** — الهدف 6,000-8,000

---

## ابدأ الآن

ابدأ بالمرحلة 0 (الإحصائيات)، ثم المرحلة 1 (قراءة الهيكل)، ثم اقرأ كل ملف حسب المرحلة 2، ثم اكتب التقرير حسب المرحلة 3.

**أعطني التقرير كاملاً في ملف واحد.**

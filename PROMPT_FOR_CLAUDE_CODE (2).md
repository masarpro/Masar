# برومبت توليد التقرير الشامل لمنصة مسار

> **انسخ كل شيء تحت هذا السطر وأعطيه لكلاود كود**

---

## التعليمات

أنت مطلوب منك إنتاج **تقرير تقني شامل ومفصّل** لمنصة "مسار" (Masar) لإدارة المشاريع الإنشائية. التقرير يجب أن يكون **5,000 سطر على الأقل** ومكتوب بالعربية مع المصطلحات التقنية بالإنجليزية. يجب أن يكون مبنياً على **قراءة فعلية للكود** وليس تخمين.

### قواعد صارمة:

1. **اقرأ الملفات فعلياً** — لا تتخمن أي معلومة. كل رقم وكل اسم ملف يجب أن يكون من قراءة حقيقية.
2. **5,000 سطر كحد أدنى** — اكتب التقرير على دفعات (batches) كل دفعة ≤ 800 سطر. استخدم `appendFile` أو كتابة تدريجية.
3. **التقرير بالعربية** — المصطلحات التقنية بالإنجليزية داخل النص العربي.
4. **لا تختصر** — فصّل كل شيء. اذكر أسماء الملفات الكاملة، أسماء الدوال، أسماء الجداول، أسماء المكونات.
5. **كن صريحاً وقاسياً** — لا تجامل. اذكر كل مشكلة وكل ثغرة وكل نقطة ضعف بوضوح.
6. **احفظ التقرير** في ملف `MASAR_FULL_AUDIT_REPORT.md` في الـ root.

---

## خطة القراءة (اتبعها بالترتيب)

### المرحلة 0: فهم الهيكل العام
```bash
# 1. هيكل المشروع الكامل
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.prisma" -o -name "*.json" | head -500
tree -L 4 --dirsfirst -I "node_modules|.next|dist|.turbo|.git" .

# 2. ملفات الإعدادات الجذرية
cat package.json
cat turbo.json
cat pnpm-workspace.yaml
cat .env.example || cat .env.local.example

# 3. إعدادات Next.js
cat apps/web/next.config.ts

# 4. إعدادات TypeScript
cat tsconfig.json
cat apps/web/tsconfig.json
```

### المرحلة 1: قاعدة البيانات (أهم جزء)
```bash
# اقرأ schema.prisma بالكامل — هذا أساس كل شيء
cat packages/database/prisma/schema.prisma

# اقرأ ملفات seed و migrations إن وجدت
ls packages/database/prisma/migrations/ 2>/dev/null
cat packages/database/prisma/seed.ts 2>/dev/null
cat packages/database/prisma/permissions.ts

# اقرأ Prisma client setup
cat packages/database/index.ts
cat packages/database/prisma/zod/index.ts | head -100
```

**المطلوب في التقرير لهذا القسم:**
- قائمة بكل الـ 85 model مع وصف كل واحد ووظيفته
- قائمة بكل الـ 65 enum مع قيمها
- خريطة العلاقات (Relations Map) — أي model مرتبط بأي model
- تحليل الـ Indexes: هل هي كافية؟ هل هناك queries بطيئة محتملة بسبب نقص indexes؟
- تحليل الـ Constraints: unique, cascade deletes, onDelete behavior
- المشاكل المحتملة في schema: حقول nullable لا يجب أن تكون، حقول مفقودة، علاقات غير مثالية
- حجم الـ schema وتعقيده — هل يحتاج refactoring؟
- Decimal fields — هل كل الحقول المالية تستخدم Decimal فعلاً؟
- Soft delete vs Hard delete — أي pattern مستخدم ولماذا قد يكون مشكلة

### المرحلة 2: نظام المصادقة والصلاحيات
```bash
# BetterAuth configuration
cat packages/auth/auth.ts
cat packages/auth/client.ts
cat packages/auth/index.ts

# Middleware
cat apps/web/middleware.ts
cat packages/api/orpc/middleware/

# Procedures (حماية الـ API)
cat packages/api/orpc/procedures.ts

# Permissions system
cat packages/database/prisma/permissions.ts
find . -path "*/modules/*" -name "*.ts" | xargs grep -l "verifyProjectAccess\|verifyOrganizationMembership\|protectedProcedure\|adminProcedure" | head -30

# Session handling
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "useSession\|getSession\|session" | head -20
```

**المطلوب في التقرير:**
- شرح مفصل لنظام BetterAuth وكيف تم تهيئته
- كل طرق المصادقة (Google OAuth, Email, Magic Link, etc.)
- نظام الصلاحيات: كل الأدوار (6 أدوار) وكل الصلاحيات (42 صلاحية)
- مصفوفة الصلاحيات كاملة (أي دور يملك أي صلاحية)
- **ثغرات أمنية**: endpoints بدون حماية، procedures خاطئة، تسريب بيانات
- تحليل الـ session management: هل هناك مشاكل في انتهاء الجلسات؟
- Owner Portal tokens: هل تنتهي صلاحيتها؟ ما هي الثغرة بالضبط؟
- CSRF protection, rate limiting, brute force protection

### المرحلة 3: طبقة الـ API بالكامل
```bash
# Router الرئيسي
cat packages/api/orpc/router.ts

# كل modules الـ API
ls packages/api/modules/
for dir in packages/api/modules/*/; do
  echo "=== $(basename $dir) ==="
  ls "$dir"
  # اقرأ كل ملف في كل module
  for f in "$dir"*.ts; do
    echo "--- $f ---"
    cat "$f"
  done
done

# Hono setup
cat packages/api/hono.ts
cat apps/web/app/api/[[...route]]/route.ts

# ORPC middleware
cat packages/api/orpc/middleware/*.ts
```

**المطلوب في التقرير:**
- قائمة بكل الـ 400+ endpoints مجمّعة حسب الـ module
- لكل endpoint: الاسم، النوع (query/mutation)، المدخلات، المخرجات، مستوى الحماية
- تحليل **كل module** على حدة:
  - ما الذي يفعله؟
  - هل هو مكتمل؟
  - هل فيه مشاكل؟
  - هل الـ validation كافي؟
  - هل الـ error handling مناسب؟
- **الأنماط السيئة**: N+1 queries, missing pagination, unbounded queries, missing error handling
- **الثغرات الأمنية**: endpoints تسمح بالوصول لبيانات منظمات أخرى، missing organizationId checks
- تحليل الـ middleware: ما الذي يمر عبره كل request؟
- subscriptionProcedure: لماذا غير مستخدم؟ ما الخطر؟

### المرحلة 4: صفحات الواجهة (كل صفحة)
```bash
# اعرض كل الصفحات
find apps/web/app -name "page.tsx" -o -name "layout.tsx" | sort

# اقرأ كل صفحة (page.tsx)
find apps/web/app -name "page.tsx" | sort | while read f; do
  echo "=== $f ==="
  cat "$f"
done

# Layouts
find apps/web/app -name "layout.tsx" | sort | while read f; do
  echo "=== $f ==="
  cat "$f"
done
```

**المطلوب في التقرير:**
- قائمة بكل الـ 104 صفحة مع وصف كل صفحة
- شرح routing structure: App Router groups, dynamic routes, parallel routes
- كل layout وما الذي يضيفه (sidebar, header, navigation)
- **مشاكل الأداء في التنقل**: 
  - هل هناك صفحات ثقيلة؟
  - هل الـ layouts تعمل re-render غير ضروري؟
  - هل هناك data fetching في layout يبطئ كل الصفحات الفرعية؟
  - استخدام `"use client"` vs Server Components
  - Suspense boundaries — هل موجودة؟
- Loading states: هل كل صفحة لها loading.tsx؟
- Error boundaries: هل كل صفحة لها error.tsx؟

### المرحلة 5: المكونات (Components)
```bash
# مكونات الـ modules
find apps/web/modules -name "*.tsx" | sort | head -100
wc -l $(find apps/web/modules -name "*.tsx") | sort -rn | head -50

# مكونات UI المشتركة
ls apps/web/components/
find apps/web/components -name "*.tsx" | sort

# أكبر المكونات (بعدد الأسطر)
find apps/web -name "*.tsx" | xargs wc -l | sort -rn | head -30

# Hooks مخصصة
find apps/web -name "use*.ts" -o -name "use*.tsx" | sort
```

**المطلوب في التقرير:**
- تصنيف المكونات حسب الوحدة
- أكبر 30 مكون وتعقيدهم
- **مشاكل الأداء في المكونات**:
  - مكونات ضخمة تحتاج تقسيم
  - re-renders غير ضرورية
  - missing React.memo / useMemo / useCallback
  - heavy computations في render
- تحليل hooks المخصصة
- تكرار الكود (Code duplication)
- Accessibility: هل المكونات accessible؟

### المرحلة 6: نظام التنقل والأداء (سبب البطء)
```bash
# Navigation components
find . -name "*.tsx" -path "*nav*" -o -name "*.tsx" -path "*sidebar*" -o -name "*.tsx" -path "*header*" | grep -v node_modules | sort
cat apps/web/modules/saas/shared/components/sidebar*.tsx 2>/dev/null
cat apps/web/modules/saas/shared/components/navigation*.tsx 2>/dev/null
cat apps/web/modules/saas/shared/components/mobile*.tsx 2>/dev/null

# Next.js config (prefetch, images, etc.)
cat apps/web/next.config.ts

# Bundle analysis
cat apps/web/package.json | grep -A5 "dependencies"

# Loading states
find apps/web/app -name "loading.tsx" | sort

# Suspense usage
find apps/web -name "*.tsx" | xargs grep -l "Suspense" | head -20

# Dynamic imports
find apps/web -name "*.tsx" | xargs grep -l "dynamic(" | head -20

# Image optimization
find apps/web -name "*.tsx" | xargs grep -l "next/image\|<img" | head -20

# Font loading
cat apps/web/app/layout.tsx
find apps/web -name "*.ts" -o -name "*.tsx" | xargs grep -l "font\|Font" | head -10
```

**المطلوب في التقرير (قسم مهم جداً — سبب بطء التنقل):**
- **تحليل شامل لأسباب بطء التنقل بين الصفحات:**
  1. حجم الـ JavaScript bundle — ما هي أكبر المكتبات؟
  2. هل هناك `"use client"` مفرط في layouts؟
  3. هل الـ sidebar/navigation يعمل re-mount عند كل تنقل؟
  4. هل هناك API calls في الـ layout تتكرر عند كل navigation؟
  5. هل هناك data fetching waterfall (sequential requests)؟
  6. هل الـ prefetch معطل؟
  7. حجم الـ fonts وطريقة تحميلها
  8. هل هناك مكونات ثقيلة (charts, tables) تتحمل مع كل صفحة؟
  9. Suspense boundaries المفقودة
  10. Missing `loading.tsx` files
  11. Server Components vs Client Components — هل التوزيع صحيح؟
  12. Connection pooling issues مع Supabase
  13. Region mismatch (Vercel Frankfurt vs Supabase India)
  14. Missing React Query cache strategies
  15. Redundant re-fetching on navigation
- **لكل سبب اذكر**: الملف المسبب، السطر، والحل المقترح بالتفصيل

### المرحلة 7: النظام المالي
```bash
# Finance modules
ls packages/api/modules/finance*/
cat packages/api/modules/finance*/*.ts

# Invoice templates
find apps/web -path "*invoice*" -name "*.tsx" | sort
find apps/web -path "*quotation*" -name "*.tsx" | sort

# ZATCA
cat packages/api/lib/zatca/*.ts
find . -name "*.ts" | xargs grep -l "zatca\|ZATCA" | head -20

# Payment related
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "payment\|Payment" | head -30

# Expense related
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "expense\|Expense" | head -30

# Claims
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "claim\|Claim" | head -30
```

**المطلوب في التقرير:**
- شرح كامل لنظام الفواتير والعروض والمصروفات والمدفوعات والمطالبات
- ZATCA Phase 1: ما المطبق وما الناقص
- ZATCA Phase 2: ما المطلوب بالتفصيل
- مشاكل النظام المالي الحالية
- دقة الحسابات: هل هناك مشاكل في حساب الضريبة أو الإجماليات؟
- تقرير ربحية المشروع: كيف يعمل وهل هو دقيق؟

### المرحلة 8: نظام الاشتراكات والصلاحيات المالية
```bash
# Subscription/billing
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "subscription\|Subscription\|subscriptionProcedure" | head -30
cat packages/api/modules/subscription*/*.ts 2>/dev/null
cat packages/api/modules/billing*/*.ts 2>/dev/null
cat packages/api/modules/activation*/*.ts 2>/dev/null

# Feature gates
find . -name "*.ts" | xargs grep -l "featureGate\|FeatureGate\|checkSubscription" | head -20

# Pricing
find apps/web -path "*pricing*" -name "*.tsx" | sort
find apps/web -path "*choose-plan*" -name "*.tsx" | sort
```

**المطلوب:**
- نظام الاشتراكات بالكامل (FREE vs PRO)
- نظام أكواد التفعيل
- Soft walls: كيف تعمل وأين مطبقة وأين مفقودة
- subscriptionProcedure: لماذا موجود ولكن غير مستخدم
- Stripe integration status

### المرحلة 9: التخزين والملفات
```bash
# Storage
find . -name "*.ts" | xargs grep -l "supabase.*storage\|S3\|upload\|bucket" | head -20
cat packages/api/modules/storage*/*.ts 2>/dev/null
cat packages/api/modules/documents*/*.ts 2>/dev/null

# File upload components
find apps/web -name "*.tsx" | xargs grep -l "dropzone\|upload\|Dropzone" | head -20
```

### المرحلة 10: الذكاء الاصطناعي
```bash
# AI module
ls apps/web/modules/saas/ai/
find apps/web/modules/saas/ai -name "*.tsx" -o -name "*.ts" | sort
cat apps/web/modules/saas/ai/**/*.ts 2>/dev/null
cat apps/web/modules/saas/ai/**/*.tsx 2>/dev/null

# AI API routes
find apps/web/app/api -path "*ai*" -o -path "*chat*" | sort
cat apps/web/app/api/ai*/*.ts 2>/dev/null

# AI tools
find . -name "*.ts" | xargs grep -l "ai.*tool\|Tool\|streamText" | head -20
```

**المطلوب:**
- شرح مساعد مسار الذكي بالكامل
- كل الأدوات الـ 6 المتاحة وما تفعله
- Streaming implementation
- محدوديات النظام الحالي
- تكلفة API calls
- Context window management

### المرحلة 11: البريد الإلكتروني
```bash
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "resend\|Resend\|sendEmail\|email" | head -20
find . -path "*email*" -name "*.tsx" | sort
cat packages/api/modules/email*/*.ts 2>/dev/null
```

### المرحلة 12: الترجمة (i18n)
```bash
# Translation files
ls apps/web/i18n/
find apps/web/i18n -name "*.json" | sort
# حجم كل ملف ترجمة
wc -l $(find apps/web/i18n -name "*.json") | sort -rn | head -20
# مفاتيح مفقودة
cat apps/web/i18n/ar.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))" 2>/dev/null
```

**المطلوب:**
- عدد مفاتيح الترجمة
- مفاتيح مفقودة بين العربي والإنجليزي
- جودة الترجمة
- Hardcoded strings في الكود (غير مترجمة)

### المرحلة 13: الأمان (تحليل معمّق)
```bash
# Environment variables
cat .env.example 2>/dev/null || cat .env.local.example 2>/dev/null
find . -name "*.env*" -not -path "*/node_modules/*" | sort

# Security headers
cat apps/web/next.config.ts | grep -A20 "headers\|security\|CSP"
cat apps/web/middleware.ts

# Rate limiting
find . -name "*.ts" | xargs grep -l "rateLimit\|rate.limit\|throttle" | head -20

# Input sanitization
find . -name "*.ts" | xargs grep -l "sanitize\|escape\|DOMPurify\|xss" | head -20

# SQL injection potential (raw queries)
find . -name "*.ts" | xargs grep -l "raw\|rawQuery\|\$queryRaw\|\$executeRaw" | head -20

# CORS
find . -name "*.ts" | xargs grep -l "cors\|CORS\|origin" | head -20

# Exposed secrets patterns
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "API_KEY\|SECRET\|PASSWORD\|TOKEN" | head -30
```

**المطلوب (قسم حرج):**
- **تحليل أمني شامل لكل ثغرة محتملة:**
  1. Owner Portal token expiry — التفاصيل الدقيقة
  2. projectChat endpoint security — ما الثغرة بالضبط؟
  3. projectDocuments endpoint security — ما الثغرة بالضبط؟
  4. Missing CSP headers
  5. Missing rate limiting (beyond contact/newsletter)
  6. CORS misconfiguration إن وجدت
  7. SQL injection possibilities (raw queries)
  8. XSS possibilities (user input rendering)
  9. CSRF protection status
  10. File upload security (type validation, size limits, malware scanning)
  11. API key exposure in client code
  12. Missing input validation on specific endpoints
  13. Insecure direct object references (IDOR)
  14. Privilege escalation possibilities
  15. Data leakage between organizations (multi-tenant isolation)
- **لكل ثغرة**: شدتها (Critical/High/Medium/Low)، الملف، السطر، والحل المقترح

### المرحلة 14: الأداء
```bash
# Bundle size indicators
cat apps/web/package.json
find . -name "package.json" -not -path "*/node_modules/*" | xargs grep -l "dependencies" | head -10

# Heavy imports
find apps/web -name "*.tsx" -o -name "*.ts" | xargs grep -l "import.*from" | head -5 | xargs head -30

# Image optimization
find apps/web -name "*.tsx" | xargs grep "next/image\|<img" | head -20

# Database query patterns
find packages/api -name "*.ts" | xargs grep -c "prisma\." | sort -t: -k2 -rn | head -20

# N+1 query patterns
find packages/api -name "*.ts" | xargs grep -B2 -A5 "for.*await\|\.map.*prisma\|forEach.*prisma" | head -50
```

**المطلوب:**
- **تحليل أداء شامل:**
  1. JavaScript bundle size analysis
  2. Database query performance (N+1, missing indexes, heavy joins)
  3. API response times — potential bottlenecks
  4. Image loading strategy
  5. Font loading impact
  6. Third-party script impact
  7. Server-side rendering performance
  8. React Query caching strategy effectiveness
  9. Vercel cold starts
  10. Database connection pool efficiency
  11. Region latency (Vercel Frankfurt → Supabase India)
- **Lighthouse estimation**: ما هو التقدير لـ Performance, Accessibility, Best Practices, SEO

### المرحلة 15: التنفيذ الميداني (Field Execution)
```bash
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "execution\|field\|daily.*report\|supervisor" | head -30
cat packages/api/modules/execution*/*.ts 2>/dev/null
cat packages/api/modules/field*/*.ts 2>/dev/null
find apps/web -path "*field*" -o -path "*execution*" | sort
```

### المرحلة 16: بوابة المالك (Owner Portal)
```bash
find apps/web/app -path "*owner*" | sort
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "owner.*portal\|ownerToken\|owner.*token" | head -20
cat packages/api/modules/owner*/*.ts 2>/dev/null
```

### المرحلة 17: نظام الإشعارات
```bash
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "notification\|Notification" | head -30
cat packages/api/modules/notification*/*.ts 2>/dev/null
```

### المرحلة 18: Gantt Chart
```bash
find apps/web -path "*gantt*" -o -path "*timeline*" | sort
find apps/web -name "*.tsx" | xargs grep -l "gantt\|Gantt" | head -20
```

### المرحلة 19: Super Admin
```bash
find apps/web/app -path "*admin*" | sort
cat packages/api/modules/admin*/*.ts 2>/dev/null
find apps/web/modules/saas/admin -name "*.tsx" | sort
```

### المرحلة 20: Onboarding
```bash
find apps/web -path "*onboarding*" | sort
cat apps/web/modules/saas/onboarding/**/*.tsx 2>/dev/null
```

---

## هيكل التقرير المطلوب (جدول المحتويات)

```markdown
# التقرير التدقيقي الشامل لمنصة مسار (Masar Platform Comprehensive Audit)

> تاريخ التقرير: [التاريخ]
> الإصدار: 3.0
> مبني على قراءة فعلية لكل ملف في المشروع
> عدد الملفات المقروءة: [العدد الفعلي]
> عدد أسطر الكود: [العدد الفعلي]

---

## الجزء الأول: الملخص التنفيذي (300+ سطر)
### 1.1 ما هو مسار وما هي رؤيته
### 1.2 الأرقام الرئيسية (محدّثة من القراءة الفعلية)
### 1.3 تقييم الجاهزية التفصيلي (لكل module نسبة مع تبرير)
### 1.4 أهم 20 مشكلة حرجة (مرتبة حسب الأولوية مع شرح مفصل لكل واحدة)
### 1.5 أهم 10 نقاط قوة
### 1.6 ملخص التوصيات العاجلة
### 1.7 خارطة طريق مقترحة (3 أشهر، 6 أشهر، سنة)

## الجزء الثاني: البنية التقنية والمعمارية (500+ سطر)
### 2.1 مكدس التقنيات بالكامل مع إصداراتها الفعلية
### 2.2 هيكل Monorepo التفصيلي (كل حزمة ودورها)
### 2.3 App Router Structure (كل route group وغرضه)
### 2.4 Data Flow: من الضغط على زر إلى الـ database والعودة
### 2.5 Architecture Diagrams (ASCII art)
### 2.6 تقييم القرارات المعمارية (ما كان صحيحاً وما كان خاطئاً)
### 2.7 Technical Debt التفصيلي

## الجزء الثالث: قاعدة البيانات (800+ سطر)
### 3.1 كل الـ Models (85 model) مع شرح كل واحد
### 3.2 كل الـ Enums (65 enum) مع قيمها
### 3.3 خريطة العلاقات التفصيلية
### 3.4 تحليل الـ Indexes
### 3.5 تحليل الـ Constraints
### 3.6 مشاكل الـ Schema
### 3.7 اقتراحات التحسين
### 3.8 Prisma Configuration و Connection Pooling
### 3.9 Data Integrity Issues

## الجزء الرابع: نظام المصادقة والصلاحيات (400+ سطر)
### 4.1 BetterAuth Configuration التفصيلي
### 4.2 طرق المصادقة المدعومة
### 4.3 نظام الأدوار (6 أدوار) مع شرح كل واحد
### 4.4 الـ 42 صلاحية مع مصفوفة كاملة
### 4.5 Middleware chain
### 4.6 Session Management
### 4.7 الثغرات الأمنية في المصادقة
### 4.8 OAuth configuration تفاصيل

## الجزء الخامس: طبقة API (800+ سطر)
### 5.1 ORPC Architecture
### 5.2 كل الـ Modules (36 module) مع كل endpoints
### 5.3 Procedure Levels (public, protected, admin, subscription)
### 5.4 Input Validation Analysis
### 5.5 Error Handling Patterns
### 5.6 API Performance Analysis
### 5.7 Missing Endpoints (ما يحتاجه المشروع ولا يوجد)
### 5.8 API Security Audit
### 5.9 مقارنة كل endpoint بـ best practices

## الجزء السادس: واجهة المستخدم (600+ سطر)
### 6.1 كل الصفحات (104) مع وصف ولقطات تدفق
### 6.2 كل الـ Layouts (16)
### 6.3 Component Architecture
### 6.4 State Management Strategy (React Query, Zustand, Context)
### 6.5 Form Handling (React Hook Form + Zod)
### 6.6 Table Components (TanStack Table)
### 6.7 RTL Implementation Quality
### 6.8 Responsive Design Analysis
### 6.9 Accessibility Audit (a11y)
### 6.10 Dark Mode Implementation

## الجزء السابع: تحليل الأداء وبطء التنقل (500+ سطر) ⚠️ مهم جداً
### 7.1 تحليل Bundle Size
### 7.2 Client Components vs Server Components Distribution
### 7.3 Layout Re-rendering Analysis
### 7.4 Navigation Performance — لماذا التنقل بطيء؟
### 7.5 Data Fetching Waterfalls
### 7.6 React Query Cache Configuration
### 7.7 Prefetch Strategy
### 7.8 Image and Font Loading
### 7.9 Third-party Libraries Impact
### 7.10 Suspense and Loading States Audit
### 7.11 Database Query Performance
### 7.12 Connection Pool Analysis
### 7.13 Regional Latency (Vercel ↔ Supabase)
### 7.14 Cold Start Analysis
### 7.15 خطة تحسين الأداء خطوة بخطوة (مرتبة حسب الأثر)

## الجزء الثامن: الأمان (500+ سطر) ⚠️ حرج
### 8.1 Security Headers Audit
### 8.2 Authentication Vulnerabilities
### 8.3 Authorization Vulnerabilities (IDOR, Privilege Escalation)
### 8.4 Input Validation Gaps
### 8.5 XSS Vectors
### 8.6 CSRF Protection
### 8.7 SQL Injection Analysis
### 8.8 File Upload Security
### 8.9 Rate Limiting Gaps
### 8.10 Multi-tenant Isolation Audit
### 8.11 API Key / Secret Exposure
### 8.12 Owner Portal Security Deep Dive
### 8.13 Third-party Dependency Vulnerabilities
### 8.14 OWASP Top 10 Checklist Against Masar
### 8.15 Security Remediation Plan (مرتب حسب الأولوية)

## الجزء التاسع: الوحدات الوظيفية (600+ سطر)
### 9.1 إدارة المشاريع
### 9.2 التنفيذ الميداني (Field Execution)
### 9.3 الجدول الزمني ومخطط Gantt
### 9.4 النظام المالي (فواتير، عروض، مصروفات، مدفوعات)
### 9.5 المطالبات (Claims)
### 9.6 العقود والمقاولين من الباطن
### 9.7 بوابة المالك (Owner Portal)
### 9.8 إدارة الشركة (موظفين، رواتب، أصول)
### 9.9 دراسات الكميات (Quantity Surveying)
### 9.10 الذكاء الاصطناعي (مساعد مسار)
### 9.11 نظام المستندات
### 9.12 نظام الإشعارات
### 9.13 Super Admin Panel
### 9.14 Onboarding Wizard
### 9.15 لكل وحدة: ما يعمل، ما لا يعمل، ما ينقص، الجودة /10

## الجزء العاشر: التكاملات الخارجية (200+ سطر)
### 10.1 ZATCA (Phase 1 & Phase 2 requirements)
### 10.2 SPL National Address API
### 10.3 Stripe
### 10.4 Supabase Storage (S3)
### 10.5 Resend / SES
### 10.6 Google OAuth
### 10.7 Anthropic API / OpenAI API
### 10.8 تقييم كل تكامل ومشاكله

## الجزء الحادي عشر: الترجمة والتدويل (200+ سطر)
### 11.1 next-intl Configuration
### 11.2 عدد مفاتيح الترجمة
### 11.3 Hardcoded Strings Audit
### 11.4 RTL Issues
### 11.5 Missing Translations
### 11.6 Translation Quality

## الجزء الثاني عشر: الاختبارات و CI/CD (200+ سطر)
### 12.1 الوضع الحالي للاختبارات (أو غيابها)
### 12.2 Test Coverage Estimate
### 12.3 CI/CD Pipeline
### 12.4 Deployment Process
### 12.5 خطة اختبارات مقترحة (أي tests يجب كتابتها أولاً)

## الجزء الثالث عشر: التوصيات والخلاصة (300+ سطر)
### 13.1 أهم 30 توصية مرتبة حسب الأولوية والأثر
### 13.2 Quick Wins (تحسينات يمكن تطبيقها في يوم)
### 13.3 Medium Term (أسبوع - شهر)
### 13.4 Long Term (1-3 أشهر)
### 13.5 ما يجب عدم فعله (Anti-recommendations)
### 13.6 تقييم عام: نقاط القوة
### 13.7 تقييم عام: نقاط الضعف
### 13.8 هل المنصة جاهزة للمستخدمين الحقيقيين؟
### 13.9 ما الذي قد يسبب فشل المنصة؟
### 13.10 ما الذي يميزها عن المنافسين؟

## الملاحق (500+ سطر)
### ملحق أ: قائمة كل الملفات المقروءة
### ملحق ب: كل Environment Variables المطلوبة
### ملحق ج: كل API Endpoints (جدول كامل)
### ملحق د: مصفوفة الصلاحيات الكاملة
### ملحق هـ: خريطة المسارات (Route Map)
### ملحق و: كل المكتبات المستخدمة مع إصداراتها
### ملحق ز: Database Schema Visual (ASCII)
### ملحق ح: أوامر التطوير المهمة
### ملحق ط: Glossary (مصطلحات مسار)
### ملحق ي: Security Checklist
```

---

## تعليمات الكتابة التقنية

### 1. الكتابة على دفعات
```
نظراً لأن التقرير طويل جداً (5000+ سطر)، اكتبه على دفعات:
- الدفعة 1: الأجزاء 1-3 (الملخص + البنية + قاعدة البيانات)
- الدفعة 2: الأجزاء 4-5 (المصادقة + API)
- الدفعة 3: الأجزاء 6-7 (الواجهة + الأداء)
- الدفعة 4: الأجزاء 8-9 (الأمان + الوحدات)
- الدفعة 5: الأجزاء 10-13 + الملاحق

لكل دفعة:
1. اقرأ الملفات المطلوبة أولاً
2. اكتب ≤ 800 سطر
3. استخدم append للإضافة للملف
```

### 2. مستوى التفصيل المطلوب
```
❌ خاطئ: "النظام المالي يعمل بشكل جيد"
✅ صحيح: "النظام المالي يحتوي على 4 وحدات: الفواتير (invoices.ts - 15 endpoint)، 
العروض (quotations.ts - 12 endpoint)، المصروفات (expenses.ts - 8 endpoints)، 
المدفوعات (payments.ts - 10 endpoints). الفواتير تدعم ZATCA Phase 1 QR عبر 
generateZatcaQR() في packages/api/lib/zatca/qr.ts (سطر 45). 
المشكلة: الفاتورة لا تتحقق من صلاحية الـ VAT number قبل التوليد."

❌ خاطئ: "التنقل بطيء"
✅ صحيح: "التنقل بطيء بسبب 5 أسباب رئيسية:
1. Layout في apps/web/app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx 
   يحتوي على 3 API calls (getOrganization, getProjects, getNotifications) 
   تتنفذ sequentially عند كل navigation
2. Sidebar component في modules/saas/shared/components/sidebar.tsx 
   (450 سطر) يستخدم 'use client' ويحمل كل الأيقونات والقوائم مع كل render
3. Missing Suspense boundary في project layout..."
```

### 3. تنسيق الثغرات الأمنية
```markdown
#### 🔴 CRITICAL: [اسم الثغرة]
- **الملف:** `path/to/file.ts` (سطر XX)
- **الوصف:** شرح تفصيلي للثغرة
- **السيناريو:** كيف يمكن استغلالها
- **الأثر:** ما الضرر المحتمل
- **الحل:** كود أو خطوات الإصلاح
```

### 4. تنسيق مشاكل الأداء
```markdown
#### ⚡ [اسم المشكلة]
- **الموقع:** `path/to/file.tsx` (سطر XX)
- **السبب:** شرح تقني
- **الأثر على المستخدم:** ماذا يشعر المستخدم (بطء X ثانية)
- **الحل:** خطوات التحسين
- **التأثير المتوقع:** تحسين بنسبة X%
```

---

## تنبيهات مهمة

1. **لا تنسخ من التقرير القديم PROJECT_REPORT.md** — اكتب كل شيء من الصفر بناءً على قراءة جديدة.
2. **التاريخ الحالي هو مارس 2026** — استخدمه في التقرير.
3. **كن قاسياً وصريحاً** — هذا تقرير تدقيق وليس مديح. أي مشكلة تجدها اذكرها بوضوح.
4. **أعطِ أولوية لـ:**
   - أسباب بطء التنقل (سأل عنها المستخدم تحديداً)
   - الثغرات الأمنية (حرج قبل الإطلاق)
   - المشاكل المالية (جوهر المنتج)
5. **Environment variable:** `CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000`
6. **احفظ الملف في:** `MASAR_FULL_AUDIT_REPORT.md` في root المشروع

---

## أمر التشغيل

```bash
# قبل التشغيل، اضبط:
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000

# شغّل Claude Code في Plan Mode أولاً:
claude "اقرأ التعليمات في PROMPT_FOR_CLAUDE_CODE.md ونفذها بالكامل. ابدأ بالمرحلة 0 واقرأ هيكل المشروع، ثم اتبع كل مرحلة بالترتيب. اكتب التقرير على دفعات في ملف MASAR_FULL_AUDIT_REPORT.md. لا تختصر."
```

# إعادة تصميم صفحات المصادقة (Login + Signup) — تصميم احترافي Split-Screen

## المرحلة 0: القراءة الإلزامية (اقرأ أولاً، لا تخمّن)

اقرأ الملفات التالية بالكامل قبل كتابة أي كود:

```
# Auth Layout
cat apps/web/app/auth/layout.tsx

# Login Page & Form
cat apps/web/app/auth/login/page.tsx
find apps/web -path "*/auth*" -name "*login*" -o -path "*/auth*" -name "*Login*" | head -20
grep -r "LoginForm" apps/web/modules --include="*.tsx" -l
grep -r "LoginForm" apps/web/app --include="*.tsx" -l

# Signup Page & Form  
cat apps/web/app/auth/signup/page.tsx
grep -r "SignupForm" apps/web/modules --include="*.tsx" -l
grep -r "SignupForm" apps/web/app --include="*.tsx" -l

# Read the actual form components
# (paths will be revealed from grep above — read them ALL)

# Auth shared components
find apps/web/modules -path "*auth*" -type f -name "*.tsx" | head -30

# Current social/OAuth components
grep -r "github" apps/web/modules --include="*.tsx" -l -i
grep -r "passkey" apps/web/modules --include="*.tsx" -l -i  
grep -r "magic" apps/web/modules --include="*.tsx" -l -i
grep -r "magicLink" apps/web/modules --include="*.tsx" -l -i

# Footer component in auth
grep -r "supastarter" apps/web --include="*.tsx" -l -i
grep -r "supastarter" apps/web --include="*.ts" -l -i
grep -r "Built with" apps/web --include="*.tsx" -l -i

# Masar color scheme / theme
cat apps/web/app/globals.css | head -100
grep -r "primary" config/ --include="*.ts" -l
cat tailwind.config.ts 2>/dev/null || cat apps/web/tailwind.config.ts 2>/dev/null

# Landing page for design reference (to match style)
cat apps/web/app/\(marketing\)/\[locale\]/page.tsx | head -80
find apps/web/modules/marketing -name "*.tsx" -type f | head -20

# Translation keys for auth
grep -A2 -B2 "login\|signup\|signIn\|signUp\|createAccount\|magicLink\|passkey" packages/i18n/messages/ar.json | head -80
grep -A2 -B2 "login\|signup\|signIn\|signUp\|createAccount\|magicLink\|passkey" packages/i18n/messages/en.json | head -80
```

**بعد القراءة فقط:** حدد المسارات الدقيقة لـ:
1. `LoginForm` component
2. `SignupForm` component  
3. Auth layout (`auth/layout.tsx`)
4. أي مكون OAuth/Social مشترك
5. أي مكون Footer في Auth
6. ملفات الترجمة المعنية

---

## 🔴 القائمة الحمراء — لا تلمس هذه الملفات أبداً

```
packages/auth/                          # BetterAuth config - لا تغيّر
packages/api/                           # Backend API
packages/database/                      # Prisma schema
apps/web/app/(saas)/                    # التطبيق الرئيسي
apps/web/app/(marketing)/               # الصفحة الرئيسية (اقرأ فقط للمرجع)
apps/web/modules/saas/shared/           # مكونات مشتركة
apps/web/app/auth/verify/               # صفحة التحقق 2FA
apps/web/app/auth/forgot-password/      # نسيت كلمة المرور
apps/web/app/auth/reset-password/       # إعادة تعيين
apps/web/app/auth/change-password/      # تغيير كلمة المرور
```

---

## المرحلة 1: إعادة تصميم Auth Layout — Split-Screen

### المطلوب

تحويل `apps/web/app/auth/layout.tsx` من تصميم بسيط (كارد وسط الصفحة) إلى **Split-Screen Layout** احترافي:

### التصميم المطلوب

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ┌─────────────────────────┬──────────────────────────┐     │
│   │                         │                          │     │
│   │    [Form Area]          │   [Brand Panel]          │     │
│   │                         │                          │     │
│   │    النموذج هنا          │   ● شعار مسار كبير       │     │
│   │    (children)           │   ● عبارة القيمة          │     │
│   │                         │   ● "كم ربحت؟            │     │
│   │    أبيض/شفاف            │     كم عندي؟             │     │
│   │    مع padding مريح      │     من مدين لي؟"         │     │
│   │                         │                          │     │
│   │                         │   ● أشكال هندسية خفيفة   │     │
│   │                         │   ● Gradient خلفية       │     │
│   │                         │                          │     │
│   └─────────────────────────┴──────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**ملاحظة RTL مهمة:** في RTL، الجانب الأيمن هو الأول بصرياً. لذلك:
- **الجانب الأيمن (55-60%)**: لوحة العلامة التجارية (Brand Panel) — يراها المستخدم أولاً
- **الجانب الأيسر (40-45%)**: منطقة النموذج (Form Area)

### مواصفات Brand Panel

```tsx
// الخلفية: gradient من ألوان مسار الأساسية
// استخدم ألوان primary الموجودة في theme مسار
// مثال: from-primary/90 via-primary/70 to-primary/50 أو ما يناسب الـ theme

// المحتوى (مركّز عمودياً):
// 1. شعار مسار (كبير) — استخدم نفس مكون Logo الموجود
// 2. العنوان الرئيسي: "أدِر مشاريعك بذكاء" 
// 3. العبارة الفرعية: "منصة متكاملة لإدارة مشاريع المقاولات"
// 4. ثلاث نقاط قيمة بأيقونات صغيرة:
//    - "تتبع أرباحك بدقة"
//    - "إدارة مالية شاملة"  
//    - "تقارير فورية وذكية"
// 5. أشكال هندسية زخرفية خفيفة (CSS shapes) — دوائر/مربعات شفافة جزئياً
//    تمثل عناصر البناء بشكل مجرد (لا صور، فقط CSS/SVG خفيف)
```

### مواصفات Form Area

```tsx
// خلفية: bg-background (أبيض في light / داكن في dark)
// عرض: max-w-md مع padding مريح (p-8 أو p-10)
// المحتوى: {children} — سيحتوي LoginForm أو SignupForm
// بدون أي footer أو روابط supastarter
// أسفل النموذج فقط: رابط التبديل (لديك حساب؟ / ليس لديك حساب؟)
```

### الموبايل (Responsive)

```
// على الشاشات الصغيرة (< lg):
// - Brand Panel يختفي تماماً (hidden)
// - Form Area يأخذ كامل الشاشة
// - شعار مسار يظهر فوق النموذج (صغير)
// - خلفية خفيفة gradient بدل اللوحة الكاملة
```

### تفاصيل تقنية

```tsx
// استخدم flex أو grid:
// <div className="flex min-h-screen">
//   <div className="hidden lg:flex lg:w-[55%] ...">  {/* Brand Panel */}
//   <div className="flex-1 flex items-center justify-center ..."> {/* Form */}

// Dark mode: Brand Panel يتكيف — gradient أغمق، نصوص أفتح
// استخدم Tailwind logical properties: ps-, pe-, ms-, me-, start, end
// لا تستخدم ml-, mr-, left, right

// أضف subtle animation للأشكال الهندسية (اختياري):
// animate-pulse بطيء أو float خفيف
```

---

## المرحلة 2: تحديث LoginForm

### التغييرات المطلوبة

#### 2.1 حذف GitHub OAuth
```
- احذف زر GitHub بالكامل
- أبقِ فقط زر Google
- حوّل من صف أزرار (flex-row) إلى زر واحد كامل العرض لـ Google
```

#### 2.2 إخفاء Passkey
```
- احذف زر "تسجيل الدخول باستخدام مفتاح المرور" بالكامل
- لا تحذف الكود backend — فقط أخفِ الزر من الـ UI
- إذا كان هناك import لمكتبة passkey، أبقِه لكن لا تعرض الـ UI
```

#### 2.3 نقل Magic Link — استبدال Passkey بزر "الدخول بالبريد الإلكتروني"
```
- الحالي: magic link موجود كـ Tab ("رابط سحري") بجانب tab "كلمة المرور"
- المطلوب: 
  1. احذف نظام الـ Tabs بالكامل
  2. اعرض نموذج كلمة المرور كـ default (بدون tab)
  3. أضف زر أسفل النموذج (قبل Google): "الدخول بالبريد الإلكتروني"
     - الزر يكون بنمط outline/secondary (ليس primary)
     - أيقونة Mail بجانب النص
     - عند الضغط: يستدعي نفس وظيفة Magic Link الموجودة
     - يظهر حقل email ورسالة "سنرسل لك رابط دخول على بريدك"
```

#### 2.4 تحسين تصميم النموذج
```
- العنوان: "مرحباً بعودتك" (أكبر حجماً، font-bold)
- الوصف: "سجّل دخولك للمتابعة" (أصغر، text-muted-foreground)
- حقول الإدخال: أكبر قليلاً (h-11 أو h-12)
- زر الدخول الرئيسي: أكبر (h-11)، بلون primary واضح
- فاصل "أو" بتصميم أنظف (divider with text)
- زر Google: حجم مطابق لزر الدخول الرئيسي
- "نسيت كلمة المرور؟" — رابط واضح تحت حقل كلمة المرور
- مسافات أكبر بين العناصر (space-y-4 أو space-y-5)
```

#### 2.5 الهيكل النهائي لصفحة Login
```
┌─────────────────────────────────┐
│         مرحباً بعودتك           │  ← عنوان كبير
│     سجّل دخولك للمتابعة        │  ← وصف
│                                 │
│  ┌─────────────────────────┐    │
│  │  البريد الإلكتروني       │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  كلمة المرور        👁   │    │  ← نسيت كلمة المرور؟
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │      تسجيل الدخول       │    │  ← زر primary كبير
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  ✉ الدخول بالبريد       │    │  ← زر outline (Magic Link)
│  │    الإلكتروني            │    │
│  └─────────────────────────┘    │
│                                 │
│  ──────── أو تابع بـ ────────   │
│                                 │
│  ┌─────────────────────────┐    │
│  │      G  Google          │    │  ← زر Google فقط
│  └─────────────────────────┘    │
│                                 │
│   ليس لديك حساب؟ إنشاء حساب →  │
└─────────────────────────────────┘
```

---

## المرحلة 3: تحديث SignupForm

### التغييرات المطلوبة

#### 3.1 حذف GitHub OAuth
```
- نفس التغيير: احذف زر GitHub، أبقِ Google فقط
```

#### 3.2 تحسين تصميم النموذج
```
- العنوان: "إنشاء حساب جديد" (أكبر حجماً)
- الوصف: "ابدأ بإدارة مشاريعك في دقائق" (مشجع وواضح)
- نفس تحسينات حجم الحقول والأزرار من LoginForm
- ترتيب الحقول: الاسم → البريد → كلمة المرور
- زر "إنشاء حساب" — primary كبير
- فاصل "أو"
- زر Google
- "لديك حساب بالفعل؟ تسجيل الدخول →"
```

#### 3.3 الهيكل النهائي لصفحة Signup
```
┌─────────────────────────────────┐
│       إنشاء حساب جديد           │
│   ابدأ بإدارة مشاريعك في دقائق  │
│                                 │
│  ┌─────────────────────────┐    │
│  │  الاسم                   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  البريد الإلكتروني       │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  كلمة المرور        👁   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │      إنشاء حساب         │    │  ← primary
│  └─────────────────────────┘    │
│                                 │
│  ──────── أو تابع بـ ────────   │
│                                 │
│  ┌─────────────────────────┐    │
│  │      G  Google          │    │
│  └─────────────────────────┘    │
│                                 │
│  لديك حساب بالفعل؟ تسجيل الدخول → │
└─────────────────────────────────┘
```

---

## المرحلة 4: إزالة كل آثار Supastarter

### البحث والحذف الشامل
```bash
# ابحث في كل الملفات
grep -r "supastarter" apps/web --include="*.tsx" --include="*.ts" -l
grep -r "Built with" apps/web --include="*.tsx" -l
grep -r "Privacy policy" apps/web/app/auth --include="*.tsx" -l
grep -r "Terms and conditions" apps/web/app/auth --include="*.tsx" -l
```

### المطلوب
```
- احذف footer "Built with supastarter | Privacy policy | Terms and conditions" بالكامل
- إذا كان هناك حاجة لروابط قانونية، استبدلها بـ:
  "سياسة الخصوصية | الشروط والأحكام" مع روابط مسار الفعلية
  بتصميم خفيف (text-xs text-muted-foreground) أسفل منطقة النموذج
- لا تحذف الروابط من marketing pages — فقط من auth pages
```

---

## المرحلة 5: تحديث الترجمة

### مفاتيح الترجمة المطلوبة (ar.json و en.json)

```json
// ar.json - أضف أو عدّل:
{
  "auth.login.title": "مرحباً بعودتك",
  "auth.login.description": "سجّل دخولك للمتابعة",
  "auth.login.emailLogin": "الدخول بالبريد الإلكتروني",
  "auth.login.emailLoginDescription": "سنرسل لك رابط دخول على بريدك الإلكتروني",
  "auth.login.orContinueWith": "أو تابع بـ",
  "auth.login.noAccount": "ليس لديك حساب؟",
  "auth.login.createAccount": "إنشاء حساب",
  
  "auth.signup.title": "إنشاء حساب جديد",
  "auth.signup.description": "ابدأ بإدارة مشاريعك في دقائق",
  "auth.signup.orContinueWith": "أو تابع بـ",
  "auth.signup.hasAccount": "لديك حساب بالفعل؟",
  "auth.signup.login": "تسجيل الدخول",
  
  "auth.brand.headline": "أدِر مشاريعك بذكاء",
  "auth.brand.subheadline": "منصة متكاملة لإدارة مشاريع المقاولات",
  "auth.brand.feature1": "تتبع أرباحك بدقة",
  "auth.brand.feature2": "إدارة مالية شاملة",
  "auth.brand.feature3": "تقارير فورية وذكية"
}

// en.json - أضف المقابلات الإنجليزية
```

**مهم:** ابحث عن المفاتيح الحالية أولاً واستخدم نفس النمط (namespace) الموجود. لا تنشئ namespace جديد إذا كان يوجد واحد بالفعل.

---

## المرحلة 6: التحقق والتأكد

```bash
# 1. Type check
pnpm type-check
# أو
cd apps/web && npx tsc --noEmit

# 2. تأكد من عدم وجود آثار supastarter في auth
grep -r "supastarter" apps/web/app/auth --include="*.tsx"
# يجب أن يكون النتيجة: فارغة

# 3. تأكد من عدم وجود GitHub في auth UI
grep -r "github\|GitHub" apps/web/app/auth --include="*.tsx" -i
grep -r "github\|GitHub" apps/web/modules/saas/auth --include="*.tsx" -i 2>/dev/null
# يجب أن يكون النتيجة: فارغة (أو imports فقط بدون UI)

# 4. تأكد من عدم وجود passkey button ظاهر
grep -r "passkey\|Passkey\|مفتاح المرور" apps/web/app/auth --include="*.tsx"
# يجب أن يكون النتيجة: فارغة

# 5. Build test
pnpm build
```

---

## قواعد عامة

### RTL
- استخدم **فقط** Tailwind logical properties: `ps-`, `pe-`, `ms-`, `me-`, `start`, `end`
- **ممنوع**: `pl-`, `pr-`, `ml-`, `mr-`, `left`, `right` (في layout/spacing)
- Brand Panel يكون على **اليمين** في RTL (أول عنصر في flex/grid)

### Dark Mode
- تأكد أن Brand Panel يعمل في dark mode
- gradient يتكيف مع الوضع الداكن
- النصوص والأيقونات تتغير حسب الوضع

### لا تكسر الوظائف
- Magic Link يجب أن يعمل بنفس الطريقة — فقط نقلنا مكان الزر
- Google OAuth يبقى يعمل كما هو
- Forgot Password يبقى يعمل
- التوجيه بعد Login/Signup يبقى كما هو
- 2FA redirect يبقى كما هو
- Invitation-only mode في Signup يبقى يعمل

### الجودة
- لا تنشئ مكونات جديدة إلا إذا كان ضرورياً
- استخدم shadcn/ui components الموجودة (Button, Input, Label, etc.)
- استخدم lucide-react للأيقونات
- كل النصوص تمر عبر next-intl (useTranslations)
- اتبع نفس patterns الموجودة في الكود

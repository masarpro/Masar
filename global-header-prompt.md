# برومبت: إنشاء شريط علوي موحّد (Global Header) لمنصة مسار

## الهدف العام

إنشاء شريط علوي ثابت (Global Header) بارتفاع ~48-52px يظهر في **كل صفحات التطبيق** بدون استثناء — بنفس التصميم والحجم والمحتوى. هذا الشريط يحل محل الرؤوس المختلفة الموجودة حالياً في كل صفحة (التحية + الساعة + اسم القسم).

## ⚠️ القائمة الحمراء — ملفات ممنوع لمسها

- `structural-calculations.ts`
- `derivation-engine.ts`
- أي ملفات في `packages/database/prisma/schema/`
- أي ملفات اختبارات في `__tests__/`

## ⚠️ تعليمات إلزامية

1. **اقرأ كل ملف فعلياً قبل تعديله** — لا تفترض أي أسماء أو paths
2. أضف مفاتيح الترجمة في `ar.json` و `en.json` معاً في كل مرحلة
3. استخدم `ms-` و `me-` و `ps-` و `pe-` بدل `ml-` و `mr-` و `pl-` و `pr-` (RTL-safe)
4. نفّذ `tsc --noEmit` بعد كل مرحلة للتحقق
5. لا تضف أي dependencies جديدة — استخدم فقط المكتبات الموجودة (lucide-react, shadcn, etc.)

---

## المرحلة 0: التشخيص وقراءة الملفات (لا تعديل)

**الهدف:** فهم الهيكل الحالي بالكامل قبل أي تعديل.

### المطلوب قراءته:

```
# 1. هيكل Sidebar الكامل
اقرأ كل ملفات:
apps/web/modules/saas/shared/components/sidebar/

الملفات المتوقعة:
- AppSidebar.tsx (~150-200 سطر)
- SidebarNav.tsx (~180-300 سطر)
- SidebarHeader.tsx (~60 سطر)
- SidebarFooter.tsx (~80 سطر) ← هنا UserMenu + Clock + ColorModeToggle + LocaleSwitch
- SidebarInset.tsx (~40 سطر) ← هنا يُلف المحتوى الرئيسي
- sidebar-context.tsx (~80 سطر)
- use-sidebar-menu.ts (~200 سطر)
- use-is-mobile.ts (~25 سطر)
- index.ts (barrel exports)

# 2. Layout الرئيسي للـ organization
اقرأ:
apps/web/app/(saas)/app/[organizationSlug]/layout.tsx

# 3. صفحة الرئيسية (Dashboard) — لفهم الـ header الحالي
اقرأ:
apps/web/app/(saas)/app/[organizationSlug]/page.tsx
أو أي ملف يحتوي على header الداشبورد (ابحث عن النص "مرحبا" أو "أهلاً" أو الساعة)

# 4. صفحة المالية — header مختلف
اقرأ:
apps/web/app/(saas)/app/[organizationSlug]/finance/page.tsx

# 5. صفحة المشروع — header ثالث مختلف
اقرأ:
apps/web/app/(saas)/app/[organizationSlug]/projects/[projectId]/layout.tsx
(ابحث عن ProjectShell أو ProjectHeader)

# 6. مكونات مساعدة
ابحث عن واقرأ:
- ColorModeToggle component (أينما كان مساره)
- LocaleSwitch component
- UserMenu component (أو أي dropdown للمستخدم في SidebarFooter)
- SidebarClock component (إن وجد كملف منفصل)

# 7. ملفات الترجمة
اقرأ أول 50 سطر من:
apps/web/messages/ar.json
apps/web/messages/en.json
لفهم هيكل المفاتيح ونمط التسمية
```

### المخرج المطلوب:

بعد القراءة، أنشئ تقريراً مختصراً يوضح:
1. المسار الدقيق لكل ملف ذُكر أعلاه
2. ما الذي يعرضه كل header حالياً في كل صفحة
3. أي مكونات موجودة فعلاً في `SidebarFooter` (بالاسم الدقيق والـ import path)
4. كيف يُلف المحتوى حالياً (هل `SidebarInset` يلف المحتوى مباشرة؟ هل هناك wrapper إضافي?)
5. هل هناك `<header>` tag أو div بدور header في أي layout مشترك؟

**لا تُعدّل أي ملف في هذه المرحلة.**

---

## المرحلة 1: إنشاء مكون GlobalHeader

**الهدف:** إنشاء المكون الجديد بدون ربطه بأي مكان بعد.

### 1.1 أنشئ الملف التالي:

```
apps/web/modules/saas/shared/components/global-header/GlobalHeader.tsx
```

### 1.2 مواصفات المكون:

```tsx
"use client"

// المكون: GlobalHeader
// الارتفاع: h-[52px] أو h-13 (ثابت)
// الخلفية: bg-background (أبيض/داكن حسب الوضع)
// حد سفلي: border-b border-border/40 (خفيف جداً)
// الـ layout: flex items-center justify-between px-4

// ====== الجانب الأيمن (RTL = بداية الصفحة) ======
// يحتوي على breadcrumb أو عنوان القسم الحالي
// - أيقونة القسم (من sidebar menu) + اسم القسم
// - مثل: 🏠 الرئيسية، 💰 المالية، 📁 المشاريع، 📐 التسعير
// - استخدم usePathname() + useSidebarMenu() لتحديد القسم النشط
// - إذا كنا داخل مشروع: أيقونة 📁 + اسم "المشاريع" + فاصل + اسم المشروع (بخط أخف)
// - الخط: text-base font-medium للقسم الرئيسي، text-sm text-muted-foreground للفرعي
// - بجانب اسم القسم: أيقونة القسم نفسها (من lucide-react) بلون primary/60

// ====== الجانب الأيسر (RTL = نهاية الصفحة) ======
// يحتوي على 3 عناصر بترتيب من اليسار للداخل:
//
// 1. أفاتار المستخدم (UserAvatar):
//    - دائرة 32x32px
//    - إذا المستخدم عنده صورة → عرضها
//    - إذا لا → عرض أول حرفين من الاسم بخلفية primary/10
//    - عند الضغط → dropdown menu يحتوي:
//      * اسم المستخدم + الإيميل (header)
//      * فاصل
//      * إعدادات الحساب (رابط)
//      * تبديل اللغة (عربي ↔ English) — نقل من SidebarFooter
//      * فاصل
//      * تسجيل الخروج
//    - استخدم DropdownMenu من shadcn/ui
//    - استخدم session data من useSession() أو الـ hook الموجود
//
// 2. أيقونة الإشعارات (NotificationBell):
//    - أيقونة Bell من lucide-react
//    - حجم 18px
//    - زر ghost بحجم 36x36px مع hover:bg-muted rounded-lg
//    - نقطة حمراء صغيرة (w-2 h-2 bg-destructive rounded-full) في الزاوية العلوية اليسرى
//    - ⚠️ في هذه المرحلة: الزر لا يفعل شيئاً (placeholder)
//    - لاحقاً سنربطه بنظام إشعارات
//
// 3. تبديل وضع الألوان (ColorModeToggle):
//    - انقل المكون الموجود بالضبط من SidebarFooter
//    - نفس الأيقونة (Sun/Moon)
//    - نفس الـ styling: زر ghost 36x36px مع hover:bg-muted rounded-lg
//    - حجم الأيقونة 18px
```

### 1.3 أنشئ barrel export:

```
apps/web/modules/saas/shared/components/global-header/index.ts
```

يُصدّر `GlobalHeader` كـ default و named export.

### 1.4 أضف مفاتيح الترجمة:

في `ar.json` أضف تحت مفتاح جديد `"globalHeader"`:
```json
{
  "globalHeader": {
    "notifications": "الإشعارات",
    "noNotifications": "لا توجد إشعارات",
    "accountSettings": "إعدادات الحساب",
    "signOut": "تسجيل الخروج",
    "switchLanguage": "English",
    "colorMode": "وضع الألوان"
  }
}
```

في `en.json`:
```json
{
  "globalHeader": {
    "notifications": "Notifications",
    "noNotifications": "No notifications",
    "accountSettings": "Account settings",
    "signOut": "Sign out",
    "switchLanguage": "العربية",
    "colorMode": "Color mode"
  }
}
```

### 1.5 تحقق:

```bash
cd apps/web && npx tsc --noEmit
```

---

## المرحلة 2: دمج GlobalHeader في Layout المشترك

**الهدف:** وضع GlobalHeader في المكان الصحيح ليظهر في كل الصفحات.

### 2.1 حدد نقطة الدمج الصحيحة:

المكون `SidebarInset` (أو ما يعادله) هو الـ wrapper الذي يحتوي على محتوى الصفحة بجانب الـ Sidebar. الـ GlobalHeader يجب أن يكون **أول عنصر داخل هذا الـ wrapper** — فوق محتوى الصفحة مباشرة.

```
اقرأ SidebarInset.tsx أولاً لفهم هيكله.
```

**السيناريو المتوقع:**
```tsx
// SidebarInset.tsx (الحالي)
export function SidebarInset({ children }) {
  return (
    <div className="flex-1 overflow-auto ...">
      {children}  // ← محتوى الصفحة
    </div>
  );
}

// SidebarInset.tsx (بعد التعديل)
import { GlobalHeader } from "../global-header";

export function SidebarInset({ children }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden ...">
      <GlobalHeader />  // ← ثابت في الأعلى
      <div className="flex-1 overflow-auto">
        {children}  // ← محتوى الصفحة يتمرر
      </div>
    </div>
  );
}
```

**⚠️ تنبيه مهم:** 
- إذا كان `SidebarInset` لا يلف المحتوى بهذه الطريقة، ابحث عن المكان الصحيح في layout chain.
- قد يكون في `apps/web/app/(saas)/app/[organizationSlug]/layout.tsx` مباشرة.
- **اقرأ الملفات أولاً** وحدد المكان الأنسب.
- تأكد أن الـ GlobalHeader ثابت (sticky/fixed نسبياً) وأن المحتوى تحته يتمرر.

### 2.2 تأكد أن الـ header ثابت:

الـ GlobalHeader يجب أن يكون ثابتاً — لا يتحرك مع تمرير المحتوى:
- استخدم `sticky top-0 z-30` على الـ GlobalHeader div
- أو اجعل الـ parent `flex flex-col h-full` والـ header بدون flex-shrink والمحتوى `flex-1 overflow-y-auto`

### 2.3 تحقق بصرياً:

بعد الدمج، تأكد أن:
- الشريط يظهر في أعلى كل الصفحات
- لا يتحرك عند التمرير
- لا يتداخل مع أي عناصر أخرى
- يتكيف مع RTL/LTR

```bash
cd apps/web && npx tsc --noEmit
```

---

## المرحلة 3: تنظيف SidebarFooter

**الهدف:** إزالة العناصر التي انتقلت للـ GlobalHeader من الـ SidebarFooter.

### 3.1 اقرأ SidebarFooter.tsx:

```
اقرأ الملف بالكامل أولاً.
```

### 3.2 أزل العناصر التالية:

1. **SidebarClock** (الساعة) — احذفها نهائياً، لا نحتاجها في أي مكان
2. **ColorModeToggle** — تم نقله للـ GlobalHeader
3. **UserMenu** (dropdown المستخدم) — تم نقله للـ GlobalHeader

### 3.3 أبقِ في SidebarFooter:

- **LocaleSwitch** (تبديل اللغة) — أبقه في الـ sidebar footer كـ fallback (لكن أيضاً موجود في GlobalHeader user dropdown)
  - **ملاحظة:** إذا أردت حذفه من السايدبار بالكامل، يمكنك ذلك بشرط أن يكون موجوداً في dropdown المستخدم في GlobalHeader.
  - **القرار:** احذفه من SidebarFooter. يكفي وجوده في user dropdown فقط.

### 3.4 بعد الحذف:

- إذا أصبح SidebarFooter فارغاً أو شبه فارغ — يمكنك:
  - إما حذف المكون بالكامل وإزالة استخدامه من AppSidebar
  - أو تركه مع padding فقط لإبقاء مسافة سفلية

### 3.5 تنظيف الـ imports:

- أزل أي imports غير مستخدمة من SidebarFooter
- أزل أي imports غير مستخدمة من AppSidebar إذا حذفت SidebarFooter
- أزل ملف SidebarClock إذا كان ملفاً منفصلاً

### 3.6 تحقق:

```bash
cd apps/web && npx tsc --noEmit
```

---

## المرحلة 4: إزالة الرؤوس القديمة من الصفحات

**الهدف:** حذف أو تعديل أقسام الـ header القديمة من كل صفحة لمنع التكرار.

### ⚠️ تنبيه حرج:

**لا تحذف المحتوى السياقي** — فقط احذف العناصر التي أصبحت مكررة (التحية، الساعة، اسم القسم بشكل مستقل). الأشياء الخاصة بالصفحة (مثل شريط التقدم في المشروع، أزرار الإجراءات في الفاتورة) تبقى كما هي.

### 4.1 صفحة الرئيسية (Dashboard):

```
ابحث عن المكون الذي يعرض: "أهلاً [الاسم]" + "شركة مسار" + التاريخ + الساعة

هذا الـ header قسمه لجزأين:
- الجزء الذي يحتوي على: التحية + الساعة + التاريخ → احذفه بالكامل
- ⚠️ إذا كان التاريخ (الخميس 19 مارس) مفيداً → يمكن إبقاؤه كنص صغير في بداية المحتوى
```

### 4.2 صفحة المالية (Finance Dashboard):

```
ابحث عن المكون الذي يعرض: "المالية" + "مرحباً [الاسم]" + "Emad lk" + الساعة + الأيقونة

احذف:
- الساعة (AM 05:17)
- التحية ("مرحباً بك Emad lk")

أبقِ:
- لا شيء — كل هذه البيانات أصبحت في GlobalHeader
- ⚠️ إذا كان هناك عنوان "المالية" كبير مع أيقونة → احذفه. اسم القسم أصبح في GlobalHeader breadcrumb.
```

### 4.3 صفحة المشاريع (Projects List):

```
نفس النمط:
- ابحث عن header المشاريع الذي يعرض "المشاريع" + "مرحباً بك" + الساعة
- احذف التحية والساعة
- عنوان "المشاريع" أصبح في GlobalHeader
```

### 4.4 صفحة تفاصيل المشروع (Project Detail):

```
⚠️ هنا حذر شديد!

الـ header الحالي يعرض:
- اسم المشروع + حالته (نشط)
- قيمة العقد + الاحتفاظ
- شريط التقدم
- Tabs التنقل (نظرة عامة، التنفيذ، عقود الباطن...)
- أزرار (العرض، التحديثات)

→ لا تحذف أي من هذا!
→ فقط احذف: الساعة (AM 05:18) إن وجدت هنا أيضاً
→ الباقي هو "Page Header سياقي" ويبقى كما هو تحت الـ GlobalHeader
```

### 4.5 صفحات التسعير ودراسات الكميات:

```
- ابحث عن header الدراسة الذي يعرض اسم الدراسة + معلومات المبنى
- هذا header سياقي → لا تحذفه
- فقط احذف الساعة إن وجدت
```

### 4.6 صفحات إنشاء (فاتورة، مصروف، عرض سعر):

```
- هذه الصفحات لها action headers (حفظ كمسودة، إصدار) ← لا تحذفها
- فقط احذف: الساعة + التحية إن وجدت
```

### 4.7 البحث الشامل:

```bash
# ابحث عن كل مكونات الـ header/التحية في المشروع
grep -rn "SidebarClock\|مرحبا\|مرحباً\|أهلاً\|greeting\|welcomeSection\|pageHeader.*clock\|AM \|PM " \
  apps/web/modules/ apps/web/app/ \
  --include="*.tsx" --include="*.ts" \
  -l
```

راجع كل ملف ناتج وقرر: هل الـ header يحتوي على عناصر مكررة مع GlobalHeader؟ إذا نعم → احذف المكرر فقط.

### 4.8 تحقق:

```bash
cd apps/web && npx tsc --noEmit
```

---

## المرحلة 5: التصميم والتلميع

**الهدف:** ضبط التصميم ليتطابق مع النمط الحالي في مسار.

### 5.1 التصميم المطلوب بالتفصيل:

```
┌─────────────────────────────────────────────────────────────────┐
│  [👤 Avatar]  [🔔]  [🌙]          [أيقونة القسم]  اسم القسم   │
│   ← يسار (في RTL)                              يمين (في RTL) → │
│                                                                   │
│  ارتفاع: 52px                                                    │
│  خلفية: bg-background (أبيض في light, داكن في dark)              │
│  حد سفلي: border-b border-border/30                              │
│  padding: px-4 (أو px-5)                                         │
│  z-index: 30 (فوق المحتوى، تحت modals)                          │
│  التصميم يطابق النمط الحالي: مسطح، نظيف، بدون ظلال             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 تطابق التصميم مع الـ Sidebar:

- نفس لون الخلفية: `bg-background`
- نفس لون الحدود: `border-border`
- نفس حجم الأيقونات: `w-[18px] h-[18px]`
- نفس أنماط الأزرار: `hover:bg-muted rounded-lg`
- نفس الخطوط: `font-sans` (النظام يستخدم font stack default)

### 5.3 الأفاتار:

```tsx
// إذا المستخدم عنده image:
<img src={session.user.image} className="w-8 h-8 rounded-full object-cover" />

// إذا لا:
<div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
  {getInitials(session.user.name)} // أول حرف أو حرفين
</div>
```

### 5.4 نقطة الإشعارات:

```tsx
<div className="relative">
  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
    <Bell className="h-[18px] w-[18px]" />
  </Button>
  {/* نقطة حمراء — تظهر دائماً كـ placeholder */}
  <span className="absolute top-1.5 start-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
</div>
```

### 5.5 Responsive:

```
- Desktop (≥1280px): يظهر كاملاً بجانب الـ Sidebar
- Mobile (<1280px): يظهر بعرض الشاشة الكامل
- عند طي الـ Sidebar: يتمدد الـ GlobalHeader ليأخذ المساحة المتاحة
```

### 5.6 تحقق:

```bash
cd apps/web && npx tsc --noEmit
pnpm --filter web build
```

---

## المرحلة 6: التحقق النهائي

### 6.1 قائمة التحقق:

```
□ GlobalHeader يظهر في صفحة الرئيسية
□ GlobalHeader يظهر في صفحة المشاريع
□ GlobalHeader يظهر في صفحة تفاصيل مشروع
□ GlobalHeader يظهر في صفحة المالية
□ GlobalHeader يظهر في صفحة الفواتير
□ GlobalHeader يظهر في صفحة إنشاء فاتورة
□ GlobalHeader يظهر في صفحة التسعير
□ GlobalHeader يظهر في صفحة دراسة كميات
□ GlobalHeader يظهر في صفحة الإعدادات
□ GlobalHeader يظهر في صفحة المنشأة

□ الساعة لا تظهر في أي مكان
□ التحية ("مرحباً/أهلاً") لا تظهر في أي header
□ ColorModeToggle لا يظهر في SidebarFooter
□ UserMenu لا يظهر في SidebarFooter
□ LocaleSwitch لا يظهر في SidebarFooter (تم نقله لـ user dropdown)

□ أيقونة الإشعارات تظهر مع النقطة الحمراء (placeholder فقط)
□ أفاتار المستخدم يعرض الحرف الأول من الاسم
□ dropdown المستخدم يعمل (إعدادات، تبديل لغة، تسجيل خروج)
□ تبديل وضع الألوان يعمل (light ↔ dark)

□ الشريط لا يتحرك عند تمرير المحتوى
□ الشريط يتكيف مع طي/فتح الـ Sidebar
□ الشريط يتكيف مع RTL/LTR
□ اسم القسم يتغير عند التنقل بين الصفحات

□ لا يوجد أي أخطاء TypeScript
□ لا يوجد أي أخطاء بناء
□ ملفات الترجمة (ar.json + en.json) تم تحديثها
□ لا يوجد مكونات أو imports غير مستخدمة
```

### 6.2 أوامر التحقق النهائية:

```bash
cd apps/web && npx tsc --noEmit
pnpm --filter web build
# إذا نجح كل شيء → المهمة مكتملة
```

---

## ملاحظات معمارية مهمة

### لماذا SidebarInset هو المكان الصحيح:

```
AppSidebar (يسار/يمين)  |  SidebarInset (المحتوى الرئيسي)
                          |  ┌──────────────────────────┐
                          |  │ GlobalHeader ← هنا       │
                          |  ├──────────────────────────┤
                          |  │                          │
                          |  │ Page Content (scrollable)│
                          |  │                          │
                          |  └──────────────────────────┘
```

الـ GlobalHeader يجب أن يكون **داخل SidebarInset** (لا في layout.tsx فوق كل شيء) لأنه:
- لا يغطي الـ Sidebar
- عرضه يتكيف تلقائياً مع طي/فتح الـ Sidebar
- لا يحتاج حسابات margin/padding يدوية

### التعامل مع اسم القسم:

استخدم `usePathname()` لتحديد القسم الحالي:
```typescript
const pathname = usePathname();

function getCurrentSection(pathname: string) {
  if (pathname.includes('/finance')) return { icon: DollarSign, label: t('finance') };
  if (pathname.includes('/projects')) return { icon: FolderOpen, label: t('projects') };
  if (pathname.includes('/pricing')) return { icon: Calculator, label: t('pricing') };
  if (pathname.includes('/company')) return { icon: Building2, label: t('company') };
  if (pathname.includes('/settings')) return { icon: Settings, label: t('settings') };
  return { icon: Home, label: t('home') };
}
```

أو الأفضل: استخدم `useSidebarMenu()` hook الموجود الذي يبني القائمة ديناميكياً — استخرج القسم النشط منه.

### حجم الشاشة الصغير (Mobile):

على الموبايل، الـ Sidebar يصبح overlay. الـ GlobalHeader يبقى ظاهراً بعرض الشاشة الكامل. أضف **hamburger button** (☰) على يمين الشريط (في RTL) لفتح الـ sidebar إذا لم يكن هناك زر بالفعل.

ابحث أولاً: هل يوجد زر فتح sidebar على الموبايل في المكان الحالي؟ إذا نعم → انقله للـ GlobalHeader. إذا لا → أضفه.

```tsx
// على الموبايل فقط:
{isMobile && (
  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
    <Menu className="h-5 w-5" />
  </Button>
)}
```

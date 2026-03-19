# تنفيذ: إنشاء Global Header موحّد لمنصة مسار

> هذا البرومبت يعتمد على نتائج التشخيص (Phase 0) — كل المسارات والأسماء مأخوذة من القراءة الفعلية.

## ⛔ القائمة الحمراء — ملفات ممنوع لمسها

- `structural-calculations.ts`
- `derivation-engine.ts`
- أي ملفات في `packages/database/prisma/schema/`

## ⚠️ تعليمات إلزامية

1. **اقرأ كل ملف فعلياً قبل تعديله** — حتى لو ذُكر مساره هنا
2. أضف مفاتيح الترجمة في `packages/i18n/translations/ar.json` و `packages/i18n/translations/en.json` معاً
3. استخدم `ms-` و `me-` و `ps-` و `pe-` بدل `ml-` و `mr-` و `pl-` و `pr-` (RTL-safe)
4. نفّذ `tsc --noEmit` بعد كل مرحلة
5. لا تضف أي dependencies جديدة

---

## الهيكل الحالي (من التشخيص)

```
AppWrapper (SidebarProvider)
  └─ div.flex.min-h-screen
      ├─ AppSidebar (fixed, z-60)
      │   ├─ SidebarHeader
      │   ├─ SidebarNav
      │   └─ SidebarFooter ← [UserMenu, SidebarClock, LocaleSwitch, ColorModeToggle]
      └─ SidebarInset (flex-1)
          └─ main.rounded-3xl.bg-background
              └─ div.max-w-[1400px].mx-auto
                  └─ {children}  ← لا يوجد header مشترك
```

**الرؤوس الحالية لكل صفحة (كلها inline — ليست في layout مشترك):**

| الصفحة | المكون | المحتوى |
|--------|--------|---------|
| Dashboard | Inline في Dashboard.tsx (سطور 71-98) | أيقونة + تحية + اسم المنظمة + تاريخ + ساعة |
| Finance | FinanceHeader.tsx | أيقونة Wallet + "المالية" + تحية + ساعة |
| Finance (alt) | WelcomeBanner.tsx | بنر gradient + تحية + تاريخ |
| Projects list | ProjectsHeader.tsx | أيقونة FolderKanban + "المشاريع" + تحية + ساعة |
| Project detail | ProjectHeader.tsx | زر رجوع + أيقونة + اسم المشروع + تحية + ساعة + updates btn + ViewAsSelector + ContractBar |
| Company | CompanyHeader.tsx | أيقونة Building2 + "المنشأة" + تحية + ساعة |

**المكونات الموجودة فعلاً:**

| المكون | المسار | الأسطر |
|--------|--------|--------|
| ColorModeToggle | `apps/web/modules/shared/components/ColorModeToggle.tsx` | 82 |
| LocaleSwitch | `apps/web/modules/shared/components/LocaleSwitch.tsx` | 72 |
| UserMenu | `apps/web/modules/saas/shared/components/UserMenu.tsx` | 174 |
| SidebarClock | `apps/web/modules/saas/shared/components/SidebarClock.tsx` | 43 |
| UserAvatar | `apps/web/modules/shared/components/UserAvatar.tsx` | 45 |

**ملاحظة مهمة:** UserMenu الحالي (174 سطر) فيه dropdown يحتوي على: color mode submenu + settings + docs + home + logout. سنعيد استخدام أجزاء منه.

---

## المرحلة 1: إنشاء مكون GlobalHeader

### 1.1 اقرأ هذه الملفات أولاً (لفهم الأنماط والـ imports):

```
apps/web/modules/shared/components/ColorModeToggle.tsx
apps/web/modules/shared/components/LocaleSwitch.tsx
apps/web/modules/saas/shared/components/UserMenu.tsx
apps/web/modules/shared/components/UserAvatar.tsx
apps/web/modules/saas/shared/components/sidebar/SidebarInset.tsx
apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts
```

### 1.2 أنشئ المجلد والملفات:

```
apps/web/modules/saas/shared/components/global-header/
├── GlobalHeader.tsx
└── index.ts
```

### 1.3 مواصفات `GlobalHeader.tsx`:

```tsx
"use client"

// === الارتفاع والتصميم ===
// - ارتفاع ثابت: h-[52px]
// - خلفية: bg-background
// - حد سفلي: border-b border-border/30
// - padding: px-4
// - sticky top-0 z-30
// - flex items-center justify-between
// - التصميم مسطح نظيف — لا ظلال، لا gradients

// === الجانب الأيمن (بداية السطر في RTL) ===
//
// يعرض: أيقونة القسم + اسم القسم الحالي
//
// استخدم usePathname() لتحديد القسم:
//
// المنطق:
// - إذا pathname يحتوي '/finance' → أيقونة Wallet + "المالية"
// - إذا pathname يحتوي '/projects/[id]' → أيقونة FolderKanban + "المشاريع" (فقط اسم القسم، ليس اسم المشروع)
// - إذا pathname يحتوي '/projects' → أيقونة FolderKanban + "المشاريع"
// - إذا pathname يحتوي '/pricing' → أيقونة Calculator + "التسعير"
// - إذا pathname يحتوي '/company' → أيقونة Building2 + "المنشأة"
// - إذا pathname يحتوي '/settings' → أيقونة Settings + "الإعدادات"
// - إذا pathname يحتوي '/account' → أيقونة User + "الحساب"
// - default → أيقونة Home + "الرئيسية"
//
// التصميم:
// - أيقونة بحجم 20px بلون primary/70
// - اسم القسم: text-base font-medium text-foreground
// - gap-2.5 بين الأيقونة والنص
// - استخدم useTranslations() — المفاتيح موجودة غالباً تحت "navigation" أو "sidebar"
//   ابحث في ar.json عن الترجمات الموجودة واستخدمها بدل إضافة جديدة

// === الجانب الأيسر (نهاية السطر في RTL) ===
//
// يحتوي 3 عناصر بترتيب (من الحافة للداخل):
//
// 1. أفاتار المستخدم مع Dropdown:
//    - استخدم UserAvatar الموجود (من apps/web/modules/shared/components/UserAvatar.tsx)
//    - حجم: w-8 h-8
//    - لفّه بـ DropdownMenu من shadcn
//    - محتوى الـ Dropdown:
//      * header: اسم المستخدم + الإيميل (غير قابل للضغط)
//      * فاصل (DropdownMenuSeparator)
//      * إعدادات الحساب → رابط لصفحة الإعدادات
//      * تبديل اللغة (عربي ↔ English) → استخدم نفس منطق LocaleSwitch الموجود
//      * فاصل
//      * تسجيل الخروج → استخدم نفس منطق signOut الموجود في UserMenu
//    - ⚠️ اقرأ UserMenu.tsx (174 سطر) بعناية — انسخ منطق signOut والـ session access بالضبط
//    - ⚠️ اقرأ LocaleSwitch.tsx — انسخ منطق تبديل اللغة بالضبط (useRouter + usePathname + locale switching)
//
// 2. أيقونة الإشعارات (placeholder):
//    - أيقونة Bell من lucide-react حجم 18px
//    - Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted"
//    - نقطة حمراء صغيرة:
//      <span className="absolute top-1.5 start-1.5 w-2 h-2 bg-destructive rounded-full 
//             ring-2 ring-background" />
//    - ⚠️ الزر لا يفعل شيئاً الآن — فقط placeholder
//    - لا تبني أي dropdown أو API للإشعارات
//
// 3. تبديل وضع الألوان:
//    - استخدم ColorModeToggle الموجود مباشرة كـ import
//    - أو إذا كان تصميمه لا يناسب الـ header (حجمه كبير أو شكله مختلف):
//      أنشئ نسخة مبسطة: زر ghost بأيقونة Sun/Moon فقط بدون dropdown
//      استخدم نفس الـ useTheme() hook من next-themes

// === Mobile hamburger ===
//
// على الشاشات الصغيرة (< xl breakpoint):
// - أضف زر hamburger (أيقونة Menu من lucide) على أقصى يمين الشريط (start في RTL)
// - عند الضغط → يستدعي setMobileOpen(true) من sidebar-context
// - استخدم useIsMobile() من use-is-mobile.ts
// - استخدم useSidebar() من sidebar-context.tsx
//
// ⚠️ اقرأ أولاً: هل يوجد hamburger button حالياً في AppSidebar.tsx؟ 
// إذا نعم → يجب نقله/حذفه من هناك ووضعه في GlobalHeader
// لأن المستخدم على الموبايل يحتاج الزر في الـ header وليس في sidebar مخفي
```

### 1.4 أنشئ `index.ts`:

```ts
export { GlobalHeader } from "./GlobalHeader";
```

### 1.5 أضف مفاتيح الترجمة:

ابحث أولاً في `ar.json` و `en.json` عن مفاتيح موجودة مثل `"home"`, `"finance"`, `"projects"`, `"pricing"`, `"company"`, `"settings"`. استخدمها إذا وجدت.

أضف فقط المفاتيح الناقصة تحت مفتاح `"globalHeader"`:

```json
// في ar.json — أضف في المستوى الأول:
"globalHeader": {
  "notifications": "الإشعارات",
  "noNotifications": "لا توجد إشعارات",
  "accountSettings": "إعدادات الحساب",
  "signOut": "تسجيل الخروج",
  "switchToEnglish": "English",
  "switchToArabic": "العربية"
}

// في en.json:
"globalHeader": {
  "notifications": "Notifications",
  "noNotifications": "No notifications",
  "accountSettings": "Account settings",
  "signOut": "Sign out",
  "switchToEnglish": "English",
  "switchToArabic": "العربية"
}
```

### 1.6 تحقق:

```bash
cd apps/web && npx tsc --noEmit
```

---

## المرحلة 2: دمج GlobalHeader في SidebarInset

### 2.1 اقرأ SidebarInset.tsx (43 سطر) بالكامل

بناءً على التشخيص، الهيكل الحالي هو:
```tsx
// SidebarInset الحالي (تقريبي):
<div className="flex-1 ...margin-adjusts-for-sidebar...">
  <main className="rounded-3xl bg-background">
    <div className="max-w-[1400px] mx-auto">
      {children}
    </div>
  </main>
</div>
```

### 2.2 عدّل SidebarInset ليصبح:

```tsx
import { GlobalHeader } from "../global-header";

// الهيكل الجديد:
<div className="flex-1 flex flex-col ...الـ classes الأصلية بدون min-h-screen إن وجد...">
  <GlobalHeader />
  <main className="flex-1 overflow-y-auto rounded-3xl bg-background">
    <div className="max-w-[1400px] mx-auto">
      {children}
    </div>
  </main>
</div>
```

**القواعد:**
- الـ `<div>` الخارجي يصبح `flex flex-col` مع `h-screen` أو `min-h-0` لضمان أن الـ overflow يعمل
- `GlobalHeader` خارج الـ `<main>` — فوقه مباشرة
- `<main>` يأخذ `flex-1 overflow-y-auto` ليصبح هو المنطقة القابلة للتمرير
- **لا تغيّر** الـ `rounded-3xl bg-background` ولا الـ `max-w-[1400px]` — أبقهم كما هم

**⚠️ تنبيه مهم عن الـ rounded-3xl:**
الـ `<main>` عنده `rounded-3xl` مما يعني أن له زوايا مستديرة. الـ GlobalHeader يجب أن يكون **فوق** الـ main (ليس داخله) حتى لا يتأثر بالزوايا المستديرة. الـ GlobalHeader خلفيته ستكون نفس خلفية المنطقة خارج الـ main — اقرأ الملف وحدد ما هو `bg-` المستخدم خارج الـ main واستخدمه.

**⚠️ تنبيه عن الـ scrolling:**
حالياً الصفحة كلها تتمرر. بعد التعديل:
- GlobalHeader يبقى ثابتاً (لا يتمرر)
- المحتوى داخل `<main>` هو الذي يتمرر
- تأكد أن كل الصفحات الموجودة لا تتأثر سلبياً (لا overflow مزدوج، لا ارتفاعات مكسورة)

### 2.3 تعامل مع الـ height:

```
السلسلة يجب أن تكون:
html/body → h-screen
  └─ AppWrapper div.flex.min-h-screen → اجعلها h-screen
      ├─ AppSidebar (fixed — لا يؤثر على flow)
      └─ SidebarInset div → flex-1 flex flex-col min-h-0
          ├─ GlobalHeader → flex-shrink-0 h-[52px]
          └─ main → flex-1 overflow-y-auto min-h-0
```

اقرأ `AppWrapper.tsx` (31 سطر) — إذا كان الـ parent div يستخدم `min-h-screen`، قد تحتاج لتعديله إلى `h-screen` حتى يعمل الـ overflow بشكل صحيح.

### 2.4 تحقق:

```bash
cd apps/web && npx tsc --noEmit
```

**بعد التحقق:** افتح المتصفح وتنقّل بين صفحتين على الأقل (الرئيسية + المالية) — تأكد أن:
- GlobalHeader يظهر
- المحتوى تحته يتمرر
- GlobalHeader ثابت لا يتحرك
- لا يوجد double scrollbar

---

## المرحلة 3: تنظيف SidebarFooter

### 3.1 اقرأ SidebarFooter.tsx (31 سطر)

### 3.2 أزل كل شيء منه:

بما أنه 31 سطراً فقط ويحتوي على 4 مكونات كلها انتقلت:
- ❌ UserMenu → انتقل لـ GlobalHeader (avatar dropdown)
- ❌ SidebarClock → حُذفت نهائياً (لا نحتاجها)
- ❌ LocaleSwitch → انتقل لـ user dropdown في GlobalHeader
- ❌ ColorModeToggle → انتقل لـ GlobalHeader

### 3.3 خياران:

**الخيار أ (المفضل):** احذف محتوى SidebarFooter واجعله يعرض div فارغ بـ padding بسيط:
```tsx
export function SidebarFooter() {
  return <div className="h-2" />;
}
```

**الخيار ب:** احذف SidebarFooter بالكامل وأزل استخدامه من AppSidebar.tsx.
- اقرأ AppSidebar.tsx أولاً — إذا كان يستخدم `<SidebarFooter />` → أزل السطر
- حدّث barrel export في `index.ts` إذا لزم

**اختر الخيار أ** لأنه أقل خطورة — يمكن حذفه لاحقاً.

### 3.4 تنظيف الـ imports غير المستخدمة:

بعد الحذف، تحقق أن هذه الملفات لا يزال لها استخدامات أخرى:
- `SidebarClock.tsx` — ابحث: `grep -rn "SidebarClock" apps/web/ --include="*.tsx" --include="*.ts"` 
  - إذا لا يُستخدم في أي مكان آخر → **لا تحذف الملف** (اتركه، قد يُعاد استخدامه)
- `UserMenu.tsx` — ابحث عن استخدامات أخرى
  - إذا لم يُستخدم خارج SidebarFooter → **لا تحذفه** (GlobalHeader قد يعيد استخدام منطقه)

### 3.5 تحقق:

```bash
cd apps/web && npx tsc --noEmit
```

---

## المرحلة 4: حذف/تنظيف الرؤوس القديمة من الصفحات

### ⚠️ القاعدة الذهبية:

**احذف فقط:** التحية (مرحباً/أهلاً + اسم المستخدم) + الساعة + اسم القسم مع أيقونته (إذا أصبح مكرراً مع GlobalHeader).

**لا تحذف:** أي محتوى سياقي خاص بالصفحة (أزرار إجراءات، شريط تقدم، contract bar، stats cards، tabs تنقل).

### 4.1 صفحة الرئيسية — Dashboard.tsx

```
المسار: ابحث عن Dashboard.tsx أو page.tsx في:
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/

اقرأ السطور 71-98 (حيث الـ header الحالي).
```

**المطلوب:**
- احذف: الأيقونة + التحية ("أهلاً [الاسم]") + اسم المنظمة ("شركة مسار") + التاريخ ("الخميس 19 مارس") + الساعة
- **احذف القسم بالكامل** — الـ GlobalHeader يعرض "الرئيسية" مع أيقونة Home بالفعل
- إذا كان التاريخ مفيداً: يمكنك إبقاءه كنص صغير `text-xs text-muted-foreground` في بداية المحتوى، لكن الأفضل حذفه

### 4.2 صفحة المالية — FinanceHeader.tsx

```
ابحث عن FinanceHeader.tsx في:
apps/web/modules/saas/finance/ أو apps/web/app/.../finance/

اقرأه بالكامل.
```

**المطلوب:**
- احذف: أيقونة Wallet + "المالية" + التحية + الساعة
- GlobalHeader يعرض "المالية" بالفعل
- **احذف المكون بالكامل** إذا كل محتواه فقط تحية + ساعة + اسم القسم
- أو أبقه فارغاً إذا كان يحتوي على شيء آخر (مثلاً breadcrumb أو tabs)
- حدّث الصفحة التي تستخدمه: أزل `<FinanceHeader />`

### 4.3 WelcomeBanner.tsx (بنر المالية البديل)

```
ابحث عن WelcomeBanner.tsx
اقرأه بالكامل.
```

**المطلوب:**
- احذف: بنر gradient + التحية + التاريخ
- **احذف المكون بالكامل** وأزل استخدامه
- هذا البنر الكبير أصبح غير ضروري مع وجود GlobalHeader نظيف

### 4.4 صفحة المشاريع — ProjectsHeader.tsx

```
ابحث عن ProjectsHeader.tsx
اقرأه بالكامل.
```

**المطلوب:**
- احذف: أيقونة FolderKanban + "المشاريع" + التحية + الساعة
- **احذف المكون بالكامل** إذا كل محتواه فقط ذلك
- أزل `<ProjectsHeader />` من الصفحة

### 4.5 صفحة تفاصيل المشروع — ProjectHeader.tsx

```
ابحث عن ProjectHeader.tsx
اقرأه بالكامل بعناية شديدة — هذا أعقد header.
```

**⚠️ هنا حذر شديد!** هذا المكون يحتوي على:
- ❌ تحية + ساعة → **احذفهم**
- ✅ زر رجوع → **أبقه**
- ✅ أيقونة + اسم المشروع → **أبقه** (هذا سياقي — ليس اسم القسم)
- ✅ ViewAsSelector → **أبقه**
- ✅ زر التحديثات (updates btn) → **أبقه**
- ✅ ContractBar (قيمة العقد + احتفاظ + شريط تقدم) → **أبقه**

**النتيجة:** ProjectHeader يبقى موجوداً لكن **بدون** التحية والساعة فقط.

### 4.6 صفحة المنشأة — CompanyHeader.tsx

```
ابحث عن CompanyHeader.tsx
اقرأه بالكامل.
```

**المطلوب:**
- احذف: أيقونة Building2 + "المنشأة" + التحية + الساعة
- **احذف المكون بالكامل** إذا كل محتواه فقط ذلك
- أزل استخدامه

### 4.7 بحث شامل عن أي headers أخرى فاتتنا:

```bash
# ابحث عن استخدامات SidebarClock في الصفحات
grep -rn "SidebarClock\|Clock\|clock" apps/web/app/ apps/web/modules/ --include="*.tsx" -l

# ابحث عن التحيات
grep -rn "مرحبا\|مرحباً\|أهلاً\|greeting\|welcome" apps/web/app/ apps/web/modules/ --include="*.tsx" -l

# ابحث عن headers مشابهة
grep -rn "Header\b" apps/web/modules/saas/ --include="*.tsx" -l | grep -i "finance\|project\|company\|pricing"
```

راجع كل نتيجة — إذا وجدت header إضافي بنفس النمط (تحية + ساعة) → نظّفه.

### 4.8 صفحات التسعير (Pricing):

```
ابحث عن أي PricingHeader.tsx أو header في صفحات التسعير.
إذا وجد نفس النمط (أيقونة + اسم القسم + تحية + ساعة) → نظّفه.
```

### 4.9 تحقق:

```bash
cd apps/web && npx tsc --noEmit
```

---

## المرحلة 5: ضبط التصميم والمسافات

### 5.1 اقرأ GlobalHeader في المتصفح وتأكد من:

**التباعد:**
- المسافة بين الأيقونات على اليسار: `gap-1` (4px) — متقاربة لكن ليست ملتصقة
- المسافة بين أيقونة القسم واسمه: `gap-2.5`
- padding أفقي: `px-4` أو `px-5`

**الألوان:**
- أيقونة القسم: `text-primary/70`
- اسم القسم: `text-foreground` بـ `font-medium`
- أيقونات الأدوات (bell, sun/moon): `text-muted-foreground`
- hover على الأزرار: `hover:bg-muted`
- نقطة الإشعارات: `bg-destructive` مع `ring-2 ring-background`

**Dark mode:**
- تأكد أن كل الألوان تعمل في الوضع الداكن
- `bg-background` و `text-foreground` و `border-border` كلها تتكيف تلقائياً
- النقطة الحمراء: `ring-background` تضمن أن الحلقة تتكيف مع الخلفية

### 5.2 تأكد من عدم وجود مسافة زائدة:

بعد حذف الـ headers القديمة، قد تظهر مسافة فارغة في أعلى بعض الصفحات. راجع:
- إذا كانت الصفحة تبدأ بـ `pt-` أو `mt-` كبير (لأن الـ header القديم كان يحتاج مسافة) → قلّلها
- لكن **لا تحذف كل الـ padding** — المحتوى يحتاج مسافة من الأعلى

### 5.3 Mobile hamburger button:

```
اقرأ AppSidebar.tsx — ابحث عن hamburger/Menu button.
التشخيص ذكر: "mobile hamburger button is in AppSidebar.tsx (fixed position, z-45)"

هذا الزر يجب نقله للـ GlobalHeader:
1. اقرأ الزر الحالي في AppSidebar.tsx — كيف يظهر؟ أي breakpoint؟
2. أنشئ نسخة منه في GlobalHeader (يظهر فقط على mobile)
3. احذف الأصلي من AppSidebar.tsx
4. في GlobalHeader: الزر يظهر على أقصى يمين الشريط (start في RTL)
   - يظهر فقط عندما: isMobile === true
   - عند الضغط: setMobileOpen(true)
```

### 5.4 تحقق نهائي:

```bash
cd apps/web && npx tsc --noEmit
pnpm --filter web build
```

---

## المرحلة 6: التحقق الشامل

### قائمة التحقق:

```
□ GlobalHeader يظهر في: الرئيسية, المشاريع, تفاصيل مشروع, المالية, الفواتير, 
  إنشاء فاتورة, التسعير, دراسة كميات, الإعدادات, المنشأة
□ GlobalHeader ثابت — لا يتمرر مع المحتوى
□ GlobalHeader يتكيف مع طي/فتح Sidebar
□ GlobalHeader يتكيف مع RTL/LTR

□ اسم القسم يتغير عند التنقل بين الأقسام
□ الأيقونة تتغير حسب القسم

□ أيقونة الإشعارات تظهر مع نقطة حمراء (placeholder)
□ ColorModeToggle يعمل (light ↔ dark)
□ أفاتار المستخدم يظهر (حرف أول أو صورة)
□ dropdown المستخدم يفتح ويحتوي على: إعدادات, تبديل لغة, خروج
□ تبديل اللغة يعمل من dropdown المستخدم
□ تسجيل الخروج يعمل

□ الساعة لا تظهر في أي مكان
□ التحية لا تظهر في أي header
□ SidebarFooter نظيف (فارغ أو محذوف)

□ صفحة تفاصيل المشروع: ProjectHeader يبقى مع (اسم المشروع + ContractBar + tabs) بدون تحية/ساعة
□ لا يوجد double scrollbar في أي صفحة
□ hamburger button يعمل على الموبايل من GlobalHeader

□ لا أخطاء TypeScript (tsc --noEmit)
□ البناء ينجح (pnpm build)
□ ar.json و en.json محدّثان
□ لا imports غير مستخدمة
□ Dark mode يعمل بشكل صحيح
```

---

## ملخص الملفات المتأثرة

### ملفات جديدة:
```
apps/web/modules/saas/shared/components/global-header/GlobalHeader.tsx  ← جديد
apps/web/modules/saas/shared/components/global-header/index.ts         ← جديد
```

### ملفات معدّلة:
```
apps/web/modules/saas/shared/components/sidebar/SidebarInset.tsx  ← إضافة GlobalHeader
apps/web/modules/saas/shared/components/sidebar/SidebarFooter.tsx ← تفريغ/حذف المحتوى
apps/web/modules/saas/shared/components/sidebar/AppSidebar.tsx    ← حذف hamburger button
apps/web/modules/saas/shared/components/AppWrapper.tsx            ← ربما: min-h-screen → h-screen
packages/i18n/translations/ar.json                                ← مفاتيح globalHeader
packages/i18n/translations/en.json                                ← مفاتيح globalHeader
```

### ملفات رؤوس صفحات (تُعدّل أو تُحذف):
```
Dashboard.tsx (سطور 71-98)        ← حذف قسم الـ header
FinanceHeader.tsx                  ← حذف المكون أو تفريغه
WelcomeBanner.tsx                  ← حذف المكون
ProjectsHeader.tsx                 ← حذف المكون
ProjectHeader.tsx                  ← حذف التحية والساعة فقط (إبقاء الباقي)
CompanyHeader.tsx                  ← حذف المكون
+ أي headers أخرى تظهر في البحث الشامل
```

### ملفات لا تُلمس:
```
structural-calculations.ts
derivation-engine.ts
packages/database/prisma/schema/*
SidebarHeader.tsx (لا تغيير)
SidebarNav.tsx (لا تغيير)
sidebar-context.tsx (لا تغيير)
use-sidebar-menu.ts (لا تغيير)
```

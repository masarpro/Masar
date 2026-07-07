برومبت المرحلة 4 — UX متقدم

المرحلة الفرعية 4.1 — Welcome Screen + Enhanced Quick Actions
## المهمة
حسّن شاشة الترحيب (عندما لا توجد رسائل) لتكون غنية وجذابة، وطوّر Quick Actions لتكون أذكى.

## السياق
- المراحل 1-3 مكتملة — المساعد يعمل مع streaming + tools + Markdown
- حالياً عندما لا توجد رسائل: تظهر QuickActions فقط (grid بطاقات)
- نريد شاشة ترحيب كاملة مع:
  1. تحية شخصية
  2. وصف مختصر
  3. Quick Actions سياقية
  4. نصائح استخدام

## الملفات المطلوب تعديلها

### 1. `apps/web/modules/saas/shared/components/ai-assistant/AssistantWelcome.tsx` (جديد)
```typescript
// "use client"
//
// شاشة ترحيب تظهر فقط عند عدم وجود رسائل — بديل عن Quick Actions المجردة
//
// التصميم:
// ┌──────────────────────────────────────┐
// │                                      │
// │    ✨  (أيقونة كبيرة أو illustration) │
// │                                      │
// │    مرحباً {userName}!                │
// │    أنا مساعد مسار الذكي             │
// │    أقدر أساعدك في:                  │
// │                                      │
// │  ┌──────────┐  ┌──────────────┐     │
// │  │ 📊 ملخص   │  │ 💰 فواتير    │     │
// │  │ مشاريعي  │  │ متأخرة      │     │
// │  └──────────┘  └──────────────┘     │
// │  ┌──────────┐  ┌──────────────┐     │
// │  │ ❓ كيف    │  │ 🧭 دليل      │     │
// │  │ أنشئ..   │  │ الاستخدام   │     │
// │  └──────────┘  └──────────────┘     │
// │                                      │
// │  💡 نصيحة: اضغط Ctrl+K للفتح السريع │
// └──────────────────────────────────────┘
//
// الهيكل:
// <div className="flex flex-col items-center justify-center h-full px-4 py-6 text-center">
//
//   {/* أيقونة / Illustration */}
//   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mb-4">
//     <Sparkles className="w-8 h-8 text-blue-600" />
//   </div>
//
//   {/* التحية */}
//   <h3 className="text-lg font-bold mb-1">
//     {locale === 'ar' ? `مرحباً ${userName}! 👋` : `Hi ${userName}! 👋`}
//   </h3>
//
//   {/* الوصف */}
//   <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
//     {locale === 'ar' 
//       ? 'أنا مساعد مسار الذكي. أقدر أساعدك تتنقل في المنصة، تستعلم عن بياناتك، وتفهم أي شيء.'
//       : "I'm Masar's smart assistant. I can help you navigate, query your data, and understand anything."}
//   </p>
//
//   {/* Quick Actions */}
//   <AssistantQuickActions actions={quickActions} locale={locale} onAction={onAction} />
//
//   {/* نصيحة */}
//   <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/70">
//     <Lightbulb className="w-3 h-3" />
//     <span>{locale === 'ar' ? 'نصيحة: اضغط Ctrl+K للفتح السريع' : 'Tip: Press Ctrl+K to open quickly'}</span>
//   </div>
// </div>
//
// Props:
// - userName: string
// - locale: string
// - quickActions: QuickAction[]
// - onAction: (prompt: string) => void
```

### 2. تعديل `AssistantQuickActions.tsx`
```typescript
// حسّن التصميم ليكون أكثر جاذبية:
//
// كل بطاقة:
// - p-3 rounded-xl
// - border border-border/50
// - bg-gradient-to-br from-background to-muted/30
// - hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/50
// - dark:hover:bg-blue-950/20
// - transition-all duration-200
// - cursor-pointer
// - group (لتأثير hover على الأيقونة)
//
// الأيقونة:
// - w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2
// - group-hover:bg-blue-200 transition-colors
// - <Icon className="w-4 h-4 text-blue-600" />
//
// النص:
// - text-xs font-medium text-foreground leading-tight
// - سطر واحد أو سطرين max
//
// الشبكة: grid grid-cols-2 gap-2.5 w-full
```

### 3. تعديل `AssistantPanel.tsx`
```typescript
// في الـ body:
// بدل:
//   if (messages.length === 0) → <AssistantQuickActions />
//   else → <AssistantMessages />
// استخدم:
//   if (messages.length === 0) → <AssistantWelcome userName={...} locale={...} quickActions={...} onAction={...} />
//   else → <AssistantMessages />
//
// أضف أيضاً: Suggested Follow-up Actions بعد آخر رسالة assistant
// (تفصيل في المرحلة 4.2)
```

## التحقق
- [ ] شاشة الترحيب تظهر مع اسم المستخدم
- [ ] Quick Actions تتغير حسب الصفحة الحالية
- [ ] الضغط على Quick Action يرسل الرسالة ويختفي Welcome
- [ ] بعد "محادثة جديدة" يظهر Welcome مرة أخرى
- [ ] التصميم متناسق مع بقية المنصة (light theme, modern)

المرحلة الفرعية 4.2 — Suggested Follow-ups + Enhanced Message Display
## المهمة
أضف اقتراحات متابعة بعد ردود المساعد، وحسّن عرض الرسائل مع ميزات إضافية (copy, timestamps, tool results).

## السياق
- المساعد يرد بـ Markdown + يستدعي tools
- حالياً الرسائل تعرض بشكل أساسي — نريد تحسينها
- Suggested follow-ups: أزرار صغيرة بعد رد المساعد تقترح أسئلة متابعة

## الملفات

### 1. `apps/web/modules/saas/shared/components/ai-assistant/AssistantSuggestions.tsx` (جديد)
```typescript
// "use client"
//
// أزرار اقتراحات تظهر بعد آخر رسالة من المساعد
//
// التصميم:
// - flex flex-wrap gap-1.5 px-3 py-2
// - كل زر: text-xs px-3 py-1.5 rounded-full
//   border border-blue-200 dark:border-blue-800
//   bg-blue-50/50 dark:bg-blue-950/30
//   hover:bg-blue-100 dark:hover:bg-blue-900/50
//   text-blue-700 dark:text-blue-300
//   transition-colors cursor-pointer
//   whitespace-nowrap
//
// المنطق لتوليد الاقتراحات:
// يعتمد على القسم الحالي + آخر رد من المساعد
//
// getSuggestions(section: AssistantSection, lastAssistantMessage: string, locale: string): string[]
//
// القواعد:
// - ارجع 2-3 اقتراحات فقط
// - الاقتراحات قصيرة (3-6 كلمات)
// - سياقية حسب القسم:
//
// بعد رد عن المشاريع:
//   ['تفاصيل أكثر', 'المشاكل المفتوحة', 'الميزانية']
//   أو بالإنجليزية: ['More details', 'Open issues', 'Budget']
//
// بعد رد عن المالية:
//   ['فواتير متأخرة', 'ملخص الشهر', 'أرصدة البنوك']
//
// بعد رد عن التنفيذ:
//   ['التقارير اليومية', 'المشاكل الحرجة', 'نسبة الإنجاز']
//
// بعد رد عام (أو unknown):
//   ['ملخص مشاريعي', 'ملخص مالي', 'كيف أستخدم المنصة؟']
//
// ملاحظة ذكية: إذا آخر رد تضمن كلمة "فاتورة" اقترح متابعة مالية
// إذا تضمن "مشروع" اقترح متابعة مشاريع
// استخدم keyword matching بسيط (لا تحتاج AI لهذا)
//
// Props:
// - section: AssistantSection
// - lastMessage: string
// - locale: string
// - onSuggestion: (text: string) => void
// - show: boolean // تظهر فقط بعد آخر رد assistant وقبل أي رسالة user جديدة
```

### 2. تعديل `AssistantMessages.tsx` — تحسينات كبيرة
```typescript
// أضف هذه الميزات:
//
// --- أ. Copy Message ---
// كل رسالة assistant تظهر زر copy عند hover:
//
// <div className="group relative">
//   {/* محتوى الرسالة */}
//   <button
//     onClick={() => copyToClipboard(message.content)}
//     className="absolute top-1 end-1 opacity-0 group-hover:opacity-100 transition-opacity
//                p-1 rounded-md bg-background/80 hover:bg-muted text-muted-foreground"
//     title={locale === 'ar' ? 'نسخ' : 'Copy'}
//   >
//     {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
//   </button>
// </div>
//
// استخدم navigator.clipboard.writeText()
// مع state copied يظهر Check لمدة 2 ثانية ثم يعود لـ Copy
//
// --- ب. Tool Call Results Display ---
// حالياً (من المرحلة 3.4) نعرض "يبحث في البيانات..."
// حسّنه:
//
// أثناء البحث:
// <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 text-xs text-muted-foreground">
//   <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
//   <span>{getToolLabel(toolName, locale)}</span>
// </div>
//
// getToolLabel ترجع وصف عربي/إنجليزي حسب الأداة:
// - queryProjects → "يبحث في المشاريع..." / "Searching projects..."
// - queryFinance → "يراجع البيانات المالية..." / "Reviewing financials..."
// - queryExecution → "يتحقق من التنفيذ..." / "Checking execution..."
// - queryTimeline → "يراجع الجدول الزمني..." / "Checking timeline..."
// - navigateTo → "يجهز الرابط..." / "Preparing link..."
// - queryCompany → "يراجع بيانات المنشأة..." / "Reviewing company data..."
//
// بعد انتهاء البحث (tool result received):
// لا تعرض الـ tool result الخام — فقط الرد النهائي من Claude
// إذا useChat يعرض tool messages كـ separate messages، فلترها:
// messages.filter(m => m.role !== 'tool')
// أو تحقق من @ai-sdk/react documentation لكيفية إخفائها
//
// --- ج. Timestamp على الرسائل ---
// تحت كل مجموعة رسائل (أو كل رسالة):
// <span className="text-[10px] text-muted-foreground/50 mt-0.5">
//   {formatTime(message.createdAt)} // مثل: 2:35 م
// </span>
//
// لا تعرض التاريخ الكامل — فقط الوقت
// استخدم Intl.DateTimeFormat مع locale
//
// --- د. Error Messages ---
// إذا حصل خطأ (useChat يعيد error):
// <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
//   <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
//   <div className="text-xs">
//     <p className="font-medium text-red-700 dark:text-red-400">
//       {locale === 'ar' ? 'حدث خطأ' : 'An error occurred'}
//     </p>
//     <p className="text-red-600/70 dark:text-red-400/70 mt-0.5">
//       {locale === 'ar' ? 'حاول مرة أخرى أو ابدأ محادثة جديدة' : 'Try again or start a new chat'}
//     </p>
//   </div>
// </div>
//
// --- هـ. Auto-scroll Enhancement ---
// حالياً: useEffect يعمل scroll لآخر رسالة
// حسّنه:
// - إذا المستخدم scroll لأعلى يدوياً → لا تعمل auto-scroll (يريد يقرأ)
// - أضف زر "⬇ رسائل جديدة" يظهر عند وجود رسائل غير مرئية
// - عند الضغط → scroll smooth لأسفل
//
// المنطق:
// const [isAtBottom, setIsAtBottom] = useState(true);
// const scrollRef = useRef<HTMLDivElement>(null);
//
// // في onScroll:
// const handleScroll = () => {
//   const el = scrollRef.current;
//   if (!el) return;
//   const threshold = 100; // pixels from bottom
//   setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
// };
//
// // auto-scroll فقط إذا isAtBottom:
// useEffect(() => {
//   if (isAtBottom) scrollToBottom();
// }, [messages, isAtBottom]);
//
// // زر scroll down:
// {!isAtBottom && (
//   <button
//     onClick={scrollToBottom}
//     className="absolute bottom-2 left-1/2 -translate-x-1/2 
//                flex items-center gap-1 px-3 py-1 rounded-full
//                bg-background border shadow-sm text-xs
//                hover:bg-muted transition-colors"
//   >
//     <ArrowDown className="w-3 h-3" />
//     <span>{locale === 'ar' ? 'رسائل جديدة' : 'New messages'}</span>
//   </button>
// )}
```

### 3. تعديل `AssistantPanel.tsx`
```typescript
// أضف AssistantSuggestions بعد الرسائل:
//
// في body:
// <div className="flex-1 overflow-hidden relative">
//   {messages.length === 0 ? (
//     <AssistantWelcome ... />
//   ) : (
//     <>
//       <AssistantMessages messages={messages} isLoading={isLoading} locale={locale} />
//       {/* Suggestions بعد آخر رد */}
//       {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
//         <AssistantSuggestions
//           section={pageContext.section}
//           lastMessage={messages[messages.length - 1].content}
//           locale={locale}
//           onSuggestion={(text) => {
//             // أرسل النص كرسالة
//             append({ role: 'user', content: text });
//           }}
//           show={true}
//         />
//       )}
//     </>
//   )}
// </div>
//
// ملاحظة: append من useChat
// أو بديل: استخدم handleSubmit مع تغيير input
```

## التحقق
- [ ] شاشة ترحيب شخصية مع اسم المستخدم
- [ ] بعد كل رد: 2-3 اقتراحات متابعة تظهر
- [ ] الضغط على اقتراح يرسله مباشرة
- [ ] Copy يعمل — يظهر ✓ لمدة 2 ثانية
- [ ] أثناء tool call: يظهر وصف الأداة بالعربي
- [ ] الأخطاء تعرض بشكل واضح وليس crash
- [ ] Auto-scroll ذكي — يوقف إذا المستخدم scroll يدوياً
- [ ] زر "رسائل جديدة" يظهر عند الحاجة

المرحلة الفرعية 4.3 — Mobile Polish + Resizable Panel + Animations
## المهمة
صقل تجربة الموبايل، أضف إمكانية تكبير/تصغير النافذة على الديسكتوب، وحسّن الـ animations.

## السياق
- النافذة حالياً: fixed size 400x600px (من المرحلة 1)
- على الموبايل: w-[calc(100vw-32px)]
- نريد: تجربة أفضل على الموبايل + إمكانية توسيع على الديسكتوب

## الملفات المطلوب تعديلها

### 1. تعديل `AssistantPanel.tsx` — Expand/Collapse + Animations
```typescript
// --- أ. زر Expand/Collapse في الـ Header ---
// على الديسكتوب فقط: أضف زر يبدّل بين:
// - Normal: w-[400px] h-[min(70vh,600px)]
// - Expanded: w-[560px] h-[min(85vh,800px)]
//
// state:
// const [isExpanded, setIsExpanded] = useState(false);
//
// في Header (بين زر المحادثة الجديدة وزر الإغلاق):
// <button
//   onClick={() => setIsExpanded(!isExpanded)}
//   className="hidden sm:flex p-1.5 rounded-md hover:bg-muted transition-colors"
//   title={isExpanded ? (locale === 'ar' ? 'تصغير' : 'Collapse') : (locale === 'ar' ? 'تكبير' : 'Expand')}
// >
//   {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
// </button>
//
// النافذة:
// className={cn(
//   "fixed z-[60] flex flex-col rounded-2xl border shadow-2xl bg-background overflow-hidden",
//   "transition-all duration-300 ease-out",
//   // Mobile
//   "bottom-20 inset-x-4 h-[70vh]",
//   // Desktop - normal
//   "sm:bottom-[88px] sm:inset-x-auto sm:inset-inline-start-6",
//   isExpanded
//     ? "sm:w-[560px] sm:h-[min(85vh,800px)]"
//     : "sm:w-[400px] sm:h-[min(70vh,600px)]",
// )}
//
// --- ب. Animation للفتح/الإغلاق ---
// بدل ظهور/اختفاء مفاجئ، استخدم animation:
//
// طريقة 1: CSS transitions (أبسط)
// عند isOpen=false: لا تعرض (return null أو unmount)
// عند isOpen=true: mount مع initial classes → animate in
//
// طريقة 2: AnimatePresence + motion.div (إذا framer-motion متوفر)
// تحقق: grep -r "framer-motion" apps/web/package.json
// إذا موجود، استخدمه
// إذا لا — استخدم CSS transitions:
//
// const [isVisible, setIsVisible] = useState(false);
// const [isAnimating, setIsAnimating] = useState(false);
//
// useEffect(() => {
//   if (isOpen) {
//     setIsVisible(true);
//     requestAnimationFrame(() => setIsAnimating(true));
//   } else {
//     setIsAnimating(false);
//     const timer = setTimeout(() => setIsVisible(false), 200); // بعد انتهاء animation
//     return () => clearTimeout(timer);
//   }
// }, [isOpen]);
//
// if (!isVisible) return null;
//
// className={cn(
//   "... existing classes ...",
//   "transition-all duration-200",
//   isAnimating
//     ? "opacity-100 scale-100 translate-y-0"
//     : "opacity-0 scale-95 translate-y-2",
// )}
//
// --- ج. Backdrop على الموبايل ---
// على الموبايل فقط: أضف overlay شفاف خلف النافذة
//
// {isOpen && (
//   <div
//     className="fixed inset-0 bg-black/20 z-[59] sm:hidden"
//     onClick={() => setIsOpen(false)} // اغلق عند الضغط على الخلفية
//   />
// )}
//
// ملاحظة: z-[59] أقل من النافذة (z-[60]) وأعلى من المحتوى
```

### 2. تعديل `FloatingAssistantButton.tsx` — Animation
```typescript
// --- أ. حركة الزر ---
// عند الفتح: الزر يتحول من ✨ (Sparkles) إلى ✕ (X) مع rotation
//
// <div className={cn(
//   "transition-transform duration-300",
//   isOpen ? "rotate-180" : "rotate-0"
// )}>
//   {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
// </div>
//
// --- ب. إزالة Pulse عند الفتح ---
// pulse animation فقط عندما مغلق:
// className={cn(
//   "...",
//   !isOpen && "animate-pulse-subtle" // أنشئ animation مخصص أو استخدم ring animation
// )}
//
// --- ج. Badge للرسائل الجديدة ---
// إذا المساعد رد والنافذة مغلقة، أظهر badge:
// استخدم state: unreadCount في AssistantProvider
//
// في Provider:
// const [unreadCount, setUnreadCount] = useState(0);
// عندما تصل رسالة assistant و !isOpen: setUnreadCount(prev => prev + 1);
// عندما isOpen يتحول لـ true: setUnreadCount(0);
//
// في Button:
// {unreadCount > 0 && !isOpen && (
//   <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
//     {unreadCount > 9 ? '9+' : unreadCount}
//   </span>
// )}
```

### 3. تعديل `AssistantInput.tsx` — Textarea + Character Count
```typescript
// --- أ. Textarea بدل Input ---
// استبدل Input بـ textarea لدعم رسائل متعددة الأسطر:
//
// <textarea
//   ref={inputRef}
//   value={value}
//   onChange={(e) => onChange(e.target.value)}
//   onKeyDown={(e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       onSubmit();
//     }
//   }}
//   placeholder={placeholder}
//   disabled={isLoading}
//   dir="auto"
//   rows={1}
//   className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground/50 
//              focus:outline-none min-h-[36px] max-h-[120px] py-2"
//   style={{ height: 'auto' }}
// />
//
// Auto-resize: اجعل textarea يكبر تلقائياً مع المحتوى:
// useEffect(() => {
//   const el = inputRef.current;
//   if (!el) return;
//   el.style.height = 'auto';
//   el.style.height = Math.min(el.scrollHeight, 120) + 'px';
// }, [value]);
//
// --- ب. Character Counter ---
// عندما المستخدم يكتب أكثر من 1500 حرف، أظهر العداد:
//
// {value.length > 1500 && (
//   <span className={cn(
//     "text-[10px] absolute bottom-0.5 start-3",
//     value.length > 1900 ? "text-red-500" : "text-muted-foreground/50"
//   )}>
//     {value.length}/2000
//   </span>
// )}
//
// --- ج. إيقاف الإرسال إذا تجاوز الحد ---
// if (value.length > 2000) return; // لا ترسل
```

### 4. تعديل الترجمة (ar.json + en.json)
```typescript
// أضف مفاتيح جديدة تحت "assistant":
// {
//   "assistant": {
//     ... (المفاتيح الموجودة من المرحلة 1.4) ...
//     "welcome": {
//       "greeting": "مرحباً {name}! 👋",
//       "description": "أنا مساعد مسار الذكي. أقدر أساعدك تتنقل في المنصة وتستعلم عن بياناتك.",
//       "tip": "نصيحة: اضغط Ctrl+K للفتح السريع"
//     },
//     "tools": {
//       "queryProjects": "يبحث في المشاريع...",
//       "queryFinance": "يراجع البيانات المالية...",
//       "queryExecution": "يتحقق من التنفيذ...",
//       "queryTimeline": "يراجع الجدول الزمني...",
//       "navigateTo": "يجهز الرابط...",
//       "queryCompany": "يراجع بيانات المنشأة..."
//     },
//     "copy": "نسخ",
//     "copied": "تم النسخ",
//     "error": "حدث خطأ",
//     "errorRetry": "حاول مرة أخرى أو ابدأ محادثة جديدة",
//     "newMessages": "رسائل جديدة",
//     "expand": "تكبير",
//     "collapse": "تصغير",
//     "charLimit": "الحد الأقصى 2000 حرف"
//   }
// }
//
// وبالمثل في en.json بالإنجليزية
```

## التحقق
- [ ] الموبايل: النافذة تأخذ العرض الكامل تقريباً مع backdrop
- [ ] الموبايل: الضغط على backdrop يغلق النافذة
- [ ] الموبايل: الزر لا يتداخل مع MobileBottomNav
- [ ] الديسكتوب: زر expand/collapse يعمل مع animation سلس
- [ ] فتح/إغلاق: animation سلس (scale + opacity)
- [ ] الزر يتحول من Sparkles إلى X مع rotation
- [ ] Badge عدد الرسائل يظهر عند وصول رد والنافذة مغلقة
- [ ] textarea يكبر تلقائياً مع المحتوى
- [ ] عداد الأحرف يظهر قرب الحد الأقصى
- [ ] Shift+Enter ينزل سطر، Enter يرسل

المرحلة الفرعية 4.4 — Accessibility + Final Polish
## المهمة
أضف ميزات الوصول (a11y)، وأصلح أي مشاكل بصرية متبقية.

## التعديلات

### 1. Accessibility (كل الملفات)
```typescript
// --- أ. Focus Management ---
// عند فتح النافذة: focus ينتقل لحقل الإدخال تلقائياً
// في AssistantPanel:
// useEffect(() => {
//   if (isOpen) {
//     setTimeout(() => inputRef.current?.focus(), 300); // بعد animation
//   }
// }, [isOpen]);
//
// عند إغلاق النافذة: focus يعود للزر العائم
// في FloatingAssistantButton:
// useEffect(() => {
//   if (!isOpen) buttonRef.current?.focus();
// }, [isOpen]);
//
// --- ب. ARIA Attributes ---
// الزر العائم:
// role="button"
// aria-label={t('title')}
// aria-expanded={isOpen}
// aria-controls="assistant-panel"
// aria-haspopup="dialog"
//
// النافذة:
// id="assistant-panel"
// role="dialog"
// aria-label={t('title')}
// aria-modal="true" // على الموبايل مع backdrop
//
// حقل الإدخال:
// aria-label={t('placeholder')}
//
// رسائل:
// role="log"
// aria-live="polite" // يُعلن الرسائل الجديدة لقارئ الشاشة
// aria-label={locale === 'ar' ? 'سجل المحادثة' : 'Conversation log'}
//
// --- ج. Keyboard Navigation ---
// Tab: ينتقل بين العناصر داخل النافذة
// Escape: يغلق النافذة (موجود من المرحلة 1)
// Focus trap: عندما النافذة مفتوحة على الموبايل، لا يخرج focus منها
// (اختياري — يمكن إضافته لاحقاً)
```

### 2. Performance Optimization
```typescript
// --- أ. Lazy Loading ---
// AssistantPanel + كل مكوناته: lazy load
// في AssistantWrapper أو حيث يُعرض:
//
// const AssistantPanel = lazy(() => import('./AssistantPanel'));
//
// عند الفتح:
// <Suspense fallback={<div className="animate-pulse">...</div>}>
//   {isOpen && <AssistantPanel />}
// </Suspense>
//
// --- ب. Debounce on resize ---
// إذا textarea auto-resize يسبب flickering:
// استخدم requestAnimationFrame بدل useEffect مباشر
//
// --- ج. Message List Optimization ---
// إذا عدد الرسائل كبير (>30):
// لا تحتاج virtualization بعد — فقط تأكد ما في re-renders غير لازمة
// استخدم React.memo على MessageBubble component
```

### 3. Final Visual Polish
```typescript
// --- أ. Header Gradient Line ---
// أضف خط gradient تحت الـ header:
// <div className="h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
//
// --- ب. Scrollbar Styling ---
// في منطقة الرسائل (ScrollArea أو div):
// className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
// أو CSS مخصص:
// .assistant-messages::-webkit-scrollbar { width: 4px; }
// .assistant-messages::-webkit-scrollbar-thumb { background: hsl(var(--muted)); border-radius: 4px; }
//
// --- ج. Input Area Border ---
// بدل border-t عادي:
// className="border-t border-border/50"
// مع padding محسّن: px-3 py-2.5
//
// --- د. Empty State Pulse ---
// Quick Action cards: أضف stagger animation عند الظهور:
// كل بطاقة تظهر بتأخير بسيط (50ms × index)
// style={{ animationDelay: `${index * 50}ms` }}
// className="animate-fade-in-up"
//
// إذا ما عندك animate-fade-in-up، أضفه في tailwind.config أو globals.css:
// @keyframes fadeInUp {
//   from { opacity: 0; transform: translateY(8px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; opacity: 0; }
```

## التحقق النهائي للمرحلة 4

 pnpm build ينجح
 شاشة ترحيب شخصية جذابة
 Quick Actions سياقية تتغير حسب الصفحة
 اقتراحات متابعة بعد كل رد
 Copy message يعمل
 Tool call indicators وصفية بالعربي
 Error handling واضح
 Auto-scroll ذكي
 Mobile: backdrop + full-width + لا تداخل مع bottom nav
 Desktop: expand/collapse سلس
 Animation فتح/إغلاق سلس
 Badge رسائل جديدة على الزر
 Textarea multi-line مع auto-resize
 Character counter قرب الحد
 Focus management + ARIA attributes
 Lazy loading للنافذة
 التصميم متناسق مع بقية المنصة
 لا أخطاء في Console


---

### ملخص الملفات في المرحلة 4

| المرحلة | ملفات جديدة | ملفات معدّلة |
|---------|------------|-------------|
| 4.1 | `AssistantWelcome.tsx` | `AssistantPanel.tsx`, `AssistantQuickActions.tsx` |
| 4.2 | `AssistantSuggestions.tsx` | `AssistantMessages.tsx`, `AssistantPanel.tsx` |
| 4.3 | — | `AssistantPanel.tsx`, `FloatingAssistantButton.tsx`, `AssistantInput.tsx`, `AssistantProvider.tsx`, `ar.json`, `en.json` |
| 4.4 | — | كل ملفات المساعد (polish) |

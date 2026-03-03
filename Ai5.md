برومبت المرحلة 5 — حفظ المحادثات

المرحلة الفرعية 5.1 — تعديل Schema + Queries
## المهمة
عدّل نموذج AiChat الموجود ليدعم تمييز محادثات المساعد عن الـ Chatbot، وأضف دوال استعلام مساعدة.

## السياق
- المراحل 1-4 مكتملة — المساعد يعمل بالكامل لكن بدون حفظ
- حالياً useChat يحفظ الرسائل في state فقط — تضيع عند refresh أو navigation خارج المنظمة
- يوجد نموذج AiChat جاهز + 6 endpoints في وحدة ai
- ملف الاستعلامات: packages/database/prisma/queries/ai-chats.ts (~80 سطر، 6 دوال)

## ⚠️ اقرأ أولاً
1. `packages/database/prisma/schema.prisma` — ابحث عن model AiChat وافهم حقوله الحالية
2. `packages/database/prisma/queries/ai-chats.ts` — اقرأ كل الدوال الموجودة
3. `packages/api/modules/ai/` — ابحث عن router/handlers الموجودة للـ ai chats
4. افهم بنية messages المحفوظة (Json field) — هل هي مصفوفة {role, content}؟

## التعديلات المطلوبة

### 1. تعديل Schema (إذا لزم)
تحقق من حقول AiChat الحالية. المتوقع:

id: String @id
organizationId: String
userId: String
messages: Json
createdAt: DateTime
updatedAt: DateTime

أضف هذه الحقول إذا لم تكن موجودة:
title       String?              // عنوان المحادثة (يُستخرج من أول رسالة)
type        String  @default("CHATBOT")  // "CHATBOT" | "ASSISTANT"
metadata    Json?                // بيانات إضافية (آخر section، projectId...)
ملاحظات:

استخدم String بدل enum لـ type — أبسط ولا يحتاج migration معقد
أضف index على (organizationId, userId, type) لتسريع الفلترة
لا تكسر الـ CHATBOT الموجود — القيمة الافتراضية "CHATBOT"

بعد التعديل:
cd packages/database
pnpm run generate  // ثم نفذ fix script لـ Prisma Zod إذا لزم
pnpm run push      // أو migration حسب بيئتك

### 2. تعديل ai-chats.ts — إضافة دوال
```typescript
// أضف هذه الدوال مع الحفاظ على الموجود:

// --- أ. قائمة محادثات المساعد ---
// export async function listAssistantChats(params: {
//   organizationId: string;
//   userId: string;
//   limit?: number;    // default 20
//   offset?: number;   // default 0
// })
//
// استعلام:
// db.aiChat.findMany({
//   where: {
//     organizationId: params.organizationId,
//     userId: params.userId,
//     type: 'ASSISTANT',
//   },
//   select: {
//     id: true,
//     title: true,
//     createdAt: true,
//     updatedAt: true,
//     metadata: true,
//     // لا تجلب messages هنا — ثقيلة على القائمة
//   },
//   orderBy: { updatedAt: 'desc' },
//   take: params.limit ?? 20,
//   skip: params.offset ?? 0,
// });

// --- ب. جلب محادثة بكامل رسائلها ---
// export async function getAssistantChat(params: {
//   id: string;
//   organizationId: string;
//   userId: string;
// })
//
// db.aiChat.findFirst({
//   where: {
//     id: params.id,
//     organizationId: params.organizationId,
//     userId: params.userId,
//     type: 'ASSISTANT',
//   },
// });
// ⚠️ تحقق من organizationId + userId دائماً (أمان)

// --- ج. إنشاء محادثة جديدة ---
// export async function createAssistantChat(params: {
//   organizationId: string;
//   userId: string;
//   title?: string;
//   messages: any[];   // مصفوفة رسائل من useChat
//   metadata?: Record<string, any>;
// })
//
// db.aiChat.create({
//   data: {
//     organizationId: params.organizationId,
//     userId: params.userId,
//     type: 'ASSISTANT',
//     title: params.title || extractTitle(params.messages),
//     messages: params.messages as any,  // Prisma Json type
//     metadata: params.metadata as any,
//   },
// });
//
// Helper:
// function extractTitle(messages: any[]): string {
//   // أول رسالة user — أول 50 حرف
//   const firstUser = messages.find(m => m.role === 'user');
//   if (!firstUser?.content) return 'محادثة جديدة';
//   return firstUser.content.slice(0, 50) + (firstUser.content.length > 50 ? '...' : '');
// }

// --- د. تحديث رسائل محادثة ---
// export async function updateAssistantChat(params: {
//   id: string;
//   organizationId: string;
//   userId: string;
//   messages: any[];
//   title?: string;
//   metadata?: Record<string, any>;
// })
//
// db.aiChat.updateMany({
//   where: {
//     id: params.id,
//     organizationId: params.organizationId,
//     userId: params.userId,
//     type: 'ASSISTANT',
//   },
//   data: {
//     messages: params.messages as any,
//     ...(params.title && { title: params.title }),
//     ...(params.metadata && { metadata: params.metadata as any }),
//   },
// });
// ملاحظة: updateMany مع where يضمن أمان multi-tenancy

// --- هـ. حذف محادثة ---
// export async function deleteAssistantChat(params: {
//   id: string;
//   organizationId: string;
//   userId: string;
// })
//
// db.aiChat.deleteMany({
//   where: {
//     id: params.id,
//     organizationId: params.organizationId,
//     userId: params.userId,
//     type: 'ASSISTANT',
//   },
// });

// --- و. عدد المحادثات ---
// export async function countAssistantChats(params: {
//   organizationId: string;
//   userId: string;
// })
//
// db.aiChat.count({
//   where: {
//     organizationId: params.organizationId,
//     userId: params.userId,
//     type: 'ASSISTANT',
//   },
// });
```

## التحقق
- [ ] pnpm run generate ينجح
- [ ] pnpm run push ينجح (أو migration)
- [ ] الـ CHATBOT الموجود لا يتأثر (default value)
- [ ] pnpm build ينجح

المرحلة الفرعية 5.2 — API Endpoints للحفظ والاسترجاع
## المهمة
أنشئ API Routes (أو عدّل الموجودة) لحفظ واسترجاع وحذف محادثات المساعد.

## السياق
- المرحلة 5.1 مكتملة — الدوال الجديدة في ai-chats.ts جاهزة
- يوجد وحدة ai في: packages/api/modules/ai/
- يوجد router موجود للـ aiChats — يمكن التوسيع عليه أو إنشاء routes منفصلة

## ⚠️ اقرأ أولاً
1. `packages/api/modules/ai/` — كل الملفات: router, handlers, schema
2. افهم كيف الـ endpoints الحالية تعمل (procedures, validation, response)
3. قرر: هل توسّع الـ router الموجود أم تنشئ API routes جديدة في apps/web/app/api/ai/assistant/

## الخيار المفضل: API Routes في Next.js
الأبسط والأقل تعقيداً — بجانب route.ts الموجود

### ملفات جديدة

### 1. `apps/web/app/api/ai/assistant/chats/route.ts`
```typescript
// GET /api/ai/assistant/chats — قائمة المحادثات
// POST /api/ai/assistant/chats — إنشاء محادثة جديدة
//
// GET handler:
// 1. تحقق من session (نفس نمط route.ts الرئيسي)
// 2. استخرج organizationSlug من query params أو headers
// 3. تحقق من membership وجلب organizationId (نفس نمط المرحلة 3.2)
// 4. استدعي listAssistantChats
// 5. ارجع { chats: [...] }
//
// مثال:
// export async function GET(request: Request) {
//   const session = await getSession(request);  // نفس طريقة route.ts
//   if (!session) return new Response('Unauthorized', { status: 401 });
//
//   const { searchParams } = new URL(request.url);
//   const organizationSlug = searchParams.get('organizationSlug');
//   if (!organizationSlug) return new Response('Missing organizationSlug', { status: 400 });
//
//   // تحقق membership + جلب organizationId
//   const member = await db.member.findFirst({
//     where: { userId: session.user.id, organization: { slug: organizationSlug } },
//     include: { organization: { select: { id: true } } },
//   });
//   if (!member) return new Response('Forbidden', { status: 403 });
//
//   const chats = await listAssistantChats({
//     organizationId: member.organization.id,
//     userId: session.user.id,
//     limit: 30,
//   });
//
//   return Response.json({ chats });
// }
//
// POST handler:
// 1. تحقق من session + membership
// 2. استقبل body: { messages, title?, metadata?, organizationSlug }
// 3. استدعي createAssistantChat
// 4. ارجع { chat: { id, title, createdAt } }
//
// export async function POST(request: Request) {
//   const session = await getSession(request);
//   if (!session) return new Response('Unauthorized', { status: 401 });
//
//   const body = await request.json();
//   const { messages, title, metadata, organizationSlug } = body;
//
//   // validation
//   if (!organizationSlug || !messages?.length) {
//     return new Response('Invalid request', { status: 400 });
//   }
//
//   // membership check
//   const member = await db.member.findFirst({...});
//   if (!member) return new Response('Forbidden', { status: 403 });
//
//   const chat = await createAssistantChat({
//     organizationId: member.organization.id,
//     userId: session.user.id,
//     messages,
//     title,
//     metadata,
//   });
//
//   return Response.json({ chat: { id: chat.id, title: chat.title, createdAt: chat.createdAt } });
// }
```

### 2. `apps/web/app/api/ai/assistant/chats/[chatId]/route.ts`
```typescript
// GET /api/ai/assistant/chats/[chatId] — جلب محادثة كاملة
// PUT /api/ai/assistant/chats/[chatId] — تحديث رسائل محادثة
// DELETE /api/ai/assistant/chats/[chatId] — حذف محادثة
//
// GET handler:
// 1. session + membership check
// 2. const chatId = params.chatId  (من dynamic route)
// 3. const chat = await getAssistantChat({ id: chatId, organizationId, userId })
// 4. if (!chat) return 404
// 5. return { chat }
//
// PUT handler:
// 1. session + membership check
// 2. body: { messages, title?, metadata? }
// 3. await updateAssistantChat({ id: chatId, organizationId, userId, messages, title, metadata })
// 4. return { success: true }
//
// DELETE handler:
// 1. session + membership check
// 2. await deleteAssistantChat({ id: chatId, organizationId, userId })
// 3. return { success: true }
//
// ⚠️ ملاحظة عن params في Next.js App Router:
// export async function GET(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
//   const { chatId } = await params;
//   ...
// }
// (تحقق من إصدار Next.js — في 16+ قد يكون params Promise)
```

### 3. Helper مشترك لتجنب التكرار (اختياري)
```typescript
// apps/web/app/api/ai/assistant/lib/auth.ts
//
// export async function verifyAssistantAccess(request: Request) {
//   // 1. session check
//   // 2. extract organizationSlug from body or query
//   // 3. membership check
//   // 4. return { userId, organizationId, organizationSlug } or throw
// }
//
// هذا يوحّد logic المصادقة بين كل الـ routes
// إذا كان التكرار قليل (3 routes)، يمكن تخطي هذا وتكرار الكود
```

## التحقق
- [ ] GET /api/ai/assistant/chats يرجع قائمة فارغة (لا محادثات بعد)
- [ ] POST /api/ai/assistant/chats ينشئ محادثة ويرجع id
- [ ] GET /api/ai/assistant/chats/[id] يرجع المحادثة مع messages
- [ ] PUT /api/ai/assistant/chats/[id] يحدّث الرسائل
- [ ] DELETE /api/ai/assistant/chats/[id] يحذف
- [ ] كل endpoint يرفض بدون session (401)
- [ ] كل endpoint يرفض بدون membership (403)
- [ ] لا يمكن الوصول لمحادثة مستخدم آخر (userId check)

المرحلة الفرعية 5.3 — ربط الحفظ مع AssistantPanel (Auto-save)
## المهمة
عدّل AssistantProvider و AssistantPanel ليحفظا المحادثة تلقائياً ويستعيداها.

## السياق
- المرحلة 5.2 مكتملة — API endpoints جاهزة
- حالياً useChat يحفظ في memory فقط
- نريد: auto-save بعد كل رد من المساعد + استعادة عند العودة

## المنطق المطلوب

### Auto-save Flow:
1. المستخدم يرسل أول رسالة → لا يوجد chatId بعد
2. المساعد يرد → بعد انتهاء الرد: POST /chats (إنشاء) → نحصل على chatId
3. المستخدم يرسل رسالة أخرى → المساعد يرد → PUT /chats/[chatId] (تحديث)
4. "محادثة جديدة" → chatId = null → تكرر من 1
5. عند فتح محادثة سابقة → GET /chats/[chatId] → تحميل messages في useChat

## الملفات المطلوب تعديلها

### 1. تعديل `AssistantProvider.tsx`
```typescript
// أضف إلى AssistantContextType:
//   activeChatId: string | null;
//   setActiveChatId: (id: string | null) => void;
//   savedChats: SavedChat[];        // قائمة المحادثات المحفوظة
//   refreshChats: () => void;       // إعادة جلب القائمة
//   isLoadingChats: boolean;
//   deleteChat: (id: string) => Promise<void>;
//
// interface SavedChat {
//   id: string;
//   title: string;
//   createdAt: string;
//   updatedAt: string;
// }
//
// State جديد:
// const [activeChatId, setActiveChatId] = useState<string | null>(null);
// const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
// const [isLoadingChats, setIsLoadingChats] = useState(false);
//
// جلب قائمة المحادثات عند أول mount:
// useEffect(() => {
//   refreshChats();
// }, [organizationSlug]);
//
// const refreshChats = async () => {
//   setIsLoadingChats(true);
//   try {
//     const res = await fetch(`/api/ai/assistant/chats?organizationSlug=${organizationSlug}`);
//     if (res.ok) {
//       const data = await res.json();
//       setSavedChats(data.chats);
//     }
//   } catch (e) {
//     console.error('Failed to load chats', e);
//   } finally {
//     setIsLoadingChats(false);
//   }
// };
//
// const deleteChat = async (id: string) => {
//   try {
//     await fetch(`/api/ai/assistant/chats/${id}`, {
//       method: 'DELETE',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ organizationSlug }),
//     });
//     setSavedChats(prev => prev.filter(c => c.id !== id));
//     if (activeChatId === id) {
//       setActiveChatId(null);
//       // أيضاً: امسح messages في useChat
//     }
//   } catch (e) {
//     console.error('Failed to delete chat', e);
//   }
// };
```

### 2. تعديل `AssistantPanel.tsx` — Auto-save Logic
```typescript
// أضف منطق الحفظ التلقائي:
//
// const { activeChatId, setActiveChatId, refreshChats } = useAssistantContext();
// const savingRef = useRef(false);  // prevent concurrent saves
//
// --- الحفظ بعد كل رد من المساعد ---
// useChat يوفر onFinish callback (تحقق من @ai-sdk/react docs)
// أو استخدم useEffect على messages:
//
// const prevMessagesLength = useRef(0);
//
// useEffect(() => {
//   // فقط احفظ إذا:
//   // 1. فيه رسائل
//   // 2. آخر رسالة من assistant (الرد اكتمل)
//   // 3. ما نحفظ حالياً
//   // 4. ما هو loading (الرد اكتمل)
//   if (
//     messages.length > 0 &&
//     messages.length !== prevMessagesLength.current &&
//     messages[messages.length - 1].role === 'assistant' &&
//     !isLoading &&
//     !savingRef.current
//   ) {
//     prevMessagesLength.current = messages.length;
//     saveChat();
//   }
// }, [messages, isLoading]);
//
// const saveChat = async () => {
//   savingRef.current = true;
//   try {
//     // فلتر الرسائل: احفظ فقط user + assistant (بدون tool messages)
//     const messagesToSave = messages
//       .filter(m => m.role === 'user' || m.role === 'assistant')
//       .map(m => ({
//         role: m.role,
//         content: m.content,
//         createdAt: m.createdAt,
//       }));
//
//     if (!activeChatId) {
//       // إنشاء جديد
//       const res = await fetch('/api/ai/assistant/chats', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           organizationSlug,
//           messages: messagesToSave,
//           metadata: {
//             section: pageContext.section,
//             projectId: pageContext.projectId,
//           },
//         }),
//       });
//       if (res.ok) {
//         const data = await res.json();
//         setActiveChatId(data.chat.id);
//         refreshChats();  // حدّث القائمة
//       }
//     } else {
//       // تحديث
//       await fetch(`/api/ai/assistant/chats/${activeChatId}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           organizationSlug,
//           messages: messagesToSave,
//         }),
//       });
//     }
//   } catch (e) {
//     console.error('Failed to save chat', e);
//     // لا تعرض خطأ للمستخدم — الحفظ في الخلفية
//   } finally {
//     savingRef.current = false;
//   }
// };
//
// --- "محادثة جديدة" ---
// بدل مجرد setMessages([]):
// const handleNewChat = () => {
//   setMessages([]);
//   setActiveChatId(null);
//   prevMessagesLength.current = 0;
// };
//
// --- تحميل محادثة سابقة ---
// const loadChat = async (chatId: string) => {
//   try {
//     const res = await fetch(`/api/ai/assistant/chats/${chatId}?organizationSlug=${organizationSlug}`);
//     if (res.ok) {
//       const data = await res.json();
//       // تحميل الرسائل في useChat
//       // useChat يوفر setMessages:
//       setMessages(data.chat.messages);
//       setActiveChatId(chatId);
//       prevMessagesLength.current = data.chat.messages.length;
//     }
//   } catch (e) {
//     console.error('Failed to load chat', e);
//   }
// };

// ⚠️ ملاحظة مهمة عن useChat + setMessages:
// تحقق أن useChat يقبل setMessages لتحميل رسائل سابقة
// في ai-sdk/react، useChat يوفر setMessages
// لكن الرسائل المحملة يجب أن تكون بنفس الشكل:
// { id: string, role: 'user'|'assistant', content: string, createdAt?: Date }
// أضف id إذا لم يكن موجوداً: id: crypto.randomUUID() أو `saved-${index}`
```

### 3. ملاحظة عن Debounce
```typescript
// الحفظ يحصل بعد كل رد — وليس بعد كل كلمة (streaming)
// هذا كافي لأن:
// - useEffect يراقب !isLoading (يعني الرد اكتمل)
// - لا نحفظ أثناء الـ streaming
// - لا نحتاج debounce إضافي
//
// لكن إذا المستخدم يرسل رسائل سريعة متتابعة:
// savingRef.current يمنع concurrent saves
// الرسالة التالية ستحفظ الكل (لأن messages تحتوي كل الرسائل)
```

## التحقق
- [ ] أرسل رسالة → المساعد يرد → المحادثة تُحفظ تلقائياً (تحقق من DB أو network tab)
- [ ] أرسل رسالة ثانية → المحادثة تُحدّث (PUT وليس POST جديد)
- [ ] "محادثة جديدة" → الرسالة التالية تُنشئ محادثة جديدة (POST)
- [ ] أغلق المتصفح → افتح → المحادثة السابقة موجودة في القائمة
- [ ] لا أخطاء عند فشل الحفظ (الحفظ في الخلفية، لا يعيق الاستخدام)

المرحلة الفرعية 5.4 — Chat History Sidebar
## المهمة
أضف قائمة المحادثات السابقة داخل AssistantPanel ليتمكن المستخدم من العودة لأي محادثة.

## السياق
- المرحلة 5.3 مكتملة — الحفظ والاسترجاع يعمل
- نحتاج عرض قائمة المحادثات في مكان مناسب

## التصميم المقترح: Sliding History Panel
بدل sidebar دائم (يأخذ مساحة)، نعرض قائمة تنزلق من الجانب عند الضغط على أيقونة.

### 1. `apps/web/modules/saas/shared/components/ai-assistant/AssistantHistory.tsx` (جديد)
```typescript
// "use client"
//
// قائمة المحادثات السابقة — تنزلق من جانب النافذة
//
// التصميم:
// ┌──────────────────────────────────────┐
// │  📋 المحادثات السابقة        ✕ إغلاق │
// │──────────────────────────────────────│
// │                                      │
// │  ┌──────────────────────────────────┐│
// │  │ كيف أنشئ فاتورة؟               ││
// │  │ منذ 3 ساعات                 🗑  ││
// │  └──────────────────────────────────┘│
// │                                      │
// │  ┌──────────────────────────────────┐│
// │  │ ملخص مشاريعي                    ││
// │  │ أمس                         🗑  ││
// │  └──────────────────────────────────┘│
// │                                      │
// │  ┌──────────────────────────────────┐│
// │  │ مشاكل مشروع فيلا الرياض        ││
// │  │ 3 مارس                      🗑  ││
// │  └──────────────────────────────────┘│
// │                                      │
// │         لا توجد محادثات أخرى        │
// └──────────────────────────────────────┘
//
// Props:
// - chats: SavedChat[]
// - isLoading: boolean
// - activeChatId: string | null
// - onSelectChat: (chatId: string) => void
// - onDeleteChat: (chatId: string) => void
// - onClose: () => void
// - locale: string
//
// الهيكل:
// <div className={cn(
//   "absolute inset-0 z-10 bg-background flex flex-col",
//   "transition-transform duration-200",
//   isOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
// )}>
//
//   {/* Header */}
//   <div className="flex items-center justify-between px-4 py-3 border-b">
//     <div className="flex items-center gap-2">
//       <History className="w-4 h-4" />
//       <span className="text-sm font-medium">
//         {locale === 'ar' ? 'المحادثات السابقة' : 'Chat History'}
//       </span>
//     </div>
//     <button onClick={onClose} className="p-1 rounded-md hover:bg-muted">
//       <X className="w-4 h-4" />
//     </button>
//   </div>
//
//   {/* Chat List */}
//   <div className="flex-1 overflow-y-auto">
//     {isLoading ? (
//       // skeleton loader: 3 items
//       <div className="p-3 space-y-2">
//         {[1,2,3].map(i => (
//           <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />
//         ))}
//       </div>
//     ) : chats.length === 0 ? (
//       <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-8">
//         <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
//         <span>{locale === 'ar' ? 'لا توجد محادثات سابقة' : 'No previous chats'}</span>
//       </div>
//     ) : (
//       <div className="p-2 space-y-1">
//         {chats.map(chat => (
//           <ChatListItem
//             key={chat.id}
//             chat={chat}
//             isActive={chat.id === activeChatId}
//             onSelect={() => onSelectChat(chat.id)}
//             onDelete={() => onDeleteChat(chat.id)}
//             locale={locale}
//           />
//         ))}
//       </div>
//     )}
//   </div>
// </div>
//
// --- ChatListItem component (داخل نفس الملف أو inline) ---
// <button
//   onClick={onSelect}
//   className={cn(
//     "w-full flex items-center gap-3 p-3 rounded-lg text-start transition-colors group",
//     isActive
//       ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
//       : "hover:bg-muted/50"
//   )}
// >
//   <div className="flex-1 min-w-0">
//     <p className="text-sm font-medium truncate">{chat.title || 'محادثة'}</p>
//     <p className="text-[11px] text-muted-foreground mt-0.5">
//       {formatRelativeTime(chat.updatedAt, locale)}
//     </p>
//   </div>
//   <button
//     onClick={(e) => { e.stopPropagation(); onDelete(); }}
//     className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
//     title={locale === 'ar' ? 'حذف' : 'Delete'}
//   >
//     <Trash2 className="w-3.5 h-3.5" />
//   </button>
// </button>
//
// --- formatRelativeTime helper ---
// function formatRelativeTime(dateStr: string, locale: string): string {
//   const date = new Date(dateStr);
//   const now = new Date();
//   const diffMs = now.getTime() - date.getTime();
//   const diffMins = Math.floor(diffMs / 60000);
//   const diffHours = Math.floor(diffMs / 3600000);
//   const diffDays = Math.floor(diffMs / 86400000);
//
//   if (locale === 'ar') {
//     if (diffMins < 1) return 'الآن';
//     if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
//     if (diffHours < 24) return `منذ ${diffHours} ساعة`;
//     if (diffDays === 1) return 'أمس';
//     if (diffDays < 7) return `منذ ${diffDays} أيام`;
//     return date.toLocaleDateString('ar-SA');
//   }
//   // English...
//   if (diffMins < 1) return 'Just now';
//   if (diffMins < 60) return `${diffMins}m ago`;
//   if (diffHours < 24) return `${diffHours}h ago`;
//   if (diffDays === 1) return 'Yesterday';
//   if (diffDays < 7) return `${diffDays}d ago`;
//   return date.toLocaleDateString('en-US');
// }
```

### 2. تعديل `AssistantPanel.tsx` — إضافة زر History + عرض القائمة
```typescript
// أضف state:
// const [showHistory, setShowHistory] = useState(false);
//
// في Header — أضف زر History:
// بين أيقونة "محادثة جديدة" و "تكبير/تصغير":
//
// <button
//   onClick={() => { setShowHistory(true); refreshChats(); }}
//   className="p-1.5 rounded-md hover:bg-muted transition-colors relative"
//   title={locale === 'ar' ? 'المحادثات السابقة' : 'Chat History'}
// >
//   <History className="w-4 h-4" />
//   {savedChats.length > 0 && (
//     <span className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-blue-500" />
//   )}
// </button>
//
// في Body — أضف AssistantHistory:
// <div className="flex-1 overflow-hidden relative">
//   {/* History Panel (slides over content) */}
//   <AssistantHistory
//     chats={savedChats}
//     isLoading={isLoadingChats}
//     activeChatId={activeChatId}
//     onSelectChat={(chatId) => {
//       loadChat(chatId);
//       setShowHistory(false);
//     }}
//     onDeleteChat={async (chatId) => {
//       await deleteChat(chatId);
//     }}
//     onClose={() => setShowHistory(false)}
//     locale={locale}
//     isOpen={showHistory}
//   />
//
//   {/* Normal content */}
//   {messages.length === 0 ? <AssistantWelcome .../> : <AssistantMessages ... />}
//   {/* Suggestions ... */}
// </div>
//
// ملاحظة: AssistantHistory هو absolute overlay داخل الـ body
// يغطي المحتوى بالكامل عند الفتح (ولا يأخذ مساحة عند الإغلاق)
```

### 3. Confirmation قبل الحذف
```typescript
// عند حذف محادثة، أظهر confirm بسيط:
// 
// في ChatListItem أو AssistantHistory:
// const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
//
// عند الضغط على delete:
// if (confirmDelete === chat.id) {
//   // الضغطة الثانية → احذف فعلاً
//   onDeleteChat(chat.id);
//   setConfirmDelete(null);
// } else {
//   // الضغطة الأولى → أظهر تأكيد
//   setConfirmDelete(chat.id);
//   // reset بعد 3 ثوان
//   setTimeout(() => setConfirmDelete(null), 3000);
// }
//
// الأيقونة تتغير:
// confirmDelete === chat.id ? (
//   <span className="text-[10px] text-red-500 font-medium">{locale === 'ar' ? 'تأكيد؟' : 'Sure?'}</span>
// ) : (
//   <Trash2 className="w-3.5 h-3.5" />
// )
```

## التحقق
- [ ] زر History يظهر في header
- [ ] الضغط عليه يعرض قائمة المحادثات
- [ ] القائمة تعرض العنوان والوقت النسبي
- [ ] الضغط على محادثة يحملها مع كل رسائلها
- [ ] المحادثة النشطة معلّمة (active state)
- [ ] الحذف يحتاج ضغطتين (confirm)
- [ ] بعد الحذف تختفي من القائمة فوراً
- [ ] إذا حذف المحادثة النشطة → تُمسح ويعود Welcome
- [ ] القائمة فارغة تعرض رسالة مناسبة
- [ ] Skeleton loading أثناء الجلب
- [ ] الـ slide animation سلس

المرحلة الفرعية 5.5 — ترجمة + Keyboard Shortcuts + Final Polish
## المهمة
أضف مفاتيح الترجمة الجديدة، حسّن keyboard shortcuts، واختبر كل شيء.

## الملفات

### 1. ترجمة (ar.json + en.json)
```json
// أضف تحت "assistant":
{
  "assistant": {
    // ... المفاتيح الموجودة من المراحل 1 + 4 ...
    
    "history": {
      "title": "المحادثات السابقة",
      "empty": "لا توجد محادثات سابقة",
      "delete": "حذف",
      "confirmDelete": "تأكيد؟",
      "loadError": "فشل تحميل المحادثة",
      "saving": "يحفظ...",
      "saved": "تم الحفظ"
    }
  }
}
```

### 2. مؤشر الحفظ (اختياري)
```typescript
// في footer الـ AssistantPanel — بجانب حقل الإدخال:
// مؤشر صغير يظهر "يحفظ..." أثناء الحفظ و "✓ محفوظ" بعده
//
// const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
//
// في saveChat():
// setSaveStatus('saving');
// ... save logic ...
// setSaveStatus('saved');
// setTimeout(() => setSaveStatus('idle'), 2000);
//
// عرض:
// {saveStatus === 'saving' && (
//   <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
//     <Loader2 className="w-2.5 h-2.5 animate-spin" />
//     {t('history.saving')}
//   </span>
// )}
// {saveStatus === 'saved' && (
//   <span className="text-[10px] text-green-600/50 flex items-center gap-1">
//     <Check className="w-2.5 h-2.5" />
//     {t('history.saved')}
//   </span>
// )}
//
// المؤشر يظهر في أسفل النافذة (footer) بشكل لا يشتت
```

### 3. Keyboard Shortcuts النهائية
```typescript
// تأكد من هذه الـ shortcuts في AssistantProvider:
//
// Ctrl+K (أو Cmd+K): toggle المساعد (موجود من المرحلة 1)
// Escape: إغلاق المساعد (موجود من المرحلة 1)
//
// أضف:
// Ctrl+Shift+H: فتح/إغلاق History (اختياري)
//
// في AssistantProvider useEffect:
// const handleKeyDown = (e: KeyboardEvent) => {
//   // تجاهل إذا في input/textarea (ما عدا Escape)
//   const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
//     (e.target as HTMLElement)?.tagName
//   );
//
//   // Ctrl+K / Cmd+K: toggle
//   if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
//     e.preventDefault();
//     setIsOpen(prev => !prev);
//     return;
//   }
//
//   // Escape: إغلاق
//   if (e.key === 'Escape' && isOpen) {
//     // إذا History مفتوح، أغلق History أولاً
//     // وإلا أغلق المساعد
//     e.preventDefault();
//     setIsOpen(false);
//     return;
//   }
// };
```

### 4. حد المحادثات المحفوظة
```typescript
// في listAssistantChats: الحد الأقصى 50 محادثة
// إذا تجاوز 50: أقدم محادثة تُحذف تلقائياً عند إنشاء جديدة
// أو: اعرض رسالة "أقدم المحادثات تُحذف تلقائياً بعد 50 محادثة"
//
// في createAssistantChat (في ai-chats.ts):
// const count = await countAssistantChats({ organizationId, userId });
// if (count >= 50) {
//   // احذف الأقدم
//   const oldest = await db.aiChat.findFirst({
//     where: { organizationId, userId, type: 'ASSISTANT' },
//     orderBy: { updatedAt: 'asc' },
//     select: { id: true },
//   });
//   if (oldest) {
//     await db.aiChat.delete({ where: { id: oldest.id } });
//   }
// }
```

## التحقق النهائي للمرحلة 5

 pnpm build ينجح
 إنشاء محادثة: أرسل رسالة → تُحفظ تلقائياً بعد رد المساعد
 العنوان يُستخرج من أول رسالة (أول 50 حرف)
 التحديث: أرسل رسائل إضافية → تُحدّث نفس المحادثة
 محادثة جديدة: "محادثة جديدة" → الرسالة التالية تُنشئ محادثة منفصلة
 History: زر يفتح قائمة المحادثات
 تحميل: الضغط على محادثة سابقة يحملها مع كل رسائلها
 الرسائل المحملة تعمل مع useChat (يمكن الاستمرار بالمحادثة)
 الحذف: ضغطتين (confirm) → تُحذف من DB والقائمة
 مؤشر الحفظ: "يحفظ..." → "✓ محفوظ"
 Keyboard shortcuts: Ctrl+K, Escape
 القائمة تعرض وقت نسبي ("منذ 3 ساعات", "أمس")
 لا يمكن الوصول لمحادثات مستخدم آخر (403)
 حد 50 محادثة — الأقدم تُحذف تلقائياً
 الـ Chatbot الموجود لا يتأثر (type filter)
 أداء: جلب القائمة لا يتجاوز 200ms
 Refresh الصفحة → آخر محادثة لا تضيع


---

### ملخص الملفات في المرحلة 5

| المرحلة | ملفات جديدة | ملفات معدّلة |
|---------|------------|-------------|
| 5.1 | — | `schema.prisma`، `ai-chats.ts` |
| 5.2 | `api/ai/assistant/chats/route.ts`، `chats/[chatId]/route.ts` | — |
| 5.3 | — | `AssistantProvider.tsx`، `AssistantPanel.tsx` |
| 5.4 | `AssistantHistory.tsx` | `AssistantPanel.tsx` |
| 5.5 | — | `ar.json`، `en.json`، `AssistantProvider.tsx` |

---

بكذا المراحل الخمس كاملة. ملخص المسار الكامل:

| المرحلة | الوصف | الملفات الجديدة | المدة |
|---------|-------|----------------|-------|
| **1** | الزر العائم + النافذة + Provider | 9 | 2-3 أيام |
| **2** | System Prompt + قاعدة المعرفة | 11 | 2-3 أيام |
| **3** | AI Tools + Function Calling | 1 + تعديلات | 3-4 أيام |
| **4** | UX متقدم | 2 + تعديلات | 2-3 أيام |
| **5** | حفظ المحادثات | 3 + تعديلات | 1-2 يوم |
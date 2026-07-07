# ملخص إعادة تصميم واجهات التسعير

## التاريخ: 2026-03-11

## الشاشات المعاد تصميمها
| الشاشة | الملف | التغييرات |
|--------|-------|-----------|
| شريط المراحل | StudyPipelineStepper.tsx | مراحل مقفلة غير قابلة للنقر + Lock icon، نقطة نابضة لـ DRAFT، أسهم ChevronLeft بدل خطوط، شريط أيقونات أفقي للموبايل |
| نظرة عامة | CostStudyOverview.tsx | إزالة QuantitiesSubTabs المدمج، إضافة StudyPipelineStepper، بطاقات إحصائية سريعة، زر انتقال للمرحلة النشطة |
| الكميات | QuantitiesSubTabs.tsx | شريط سفلي ثابت (sticky) مع إجمالي البنود + تاريخ التحديث + زر الاعتماد |
| بطاقات الإحصاء | SummaryStatsCards.tsx | شبكة ثابتة 4 أعمدة، عرض "—" للقيم الصفرية |
| أكورديون الإنشائي | StructuralAccordion.tsx | أول قسم مفتوح تلقائياً، ملخص خرسانة/حديد في عنوان كل قسم، Badge لعدد البنود |
| تسعير التكلفة | StructuralCostingTab.tsx | بطاقات قابلة للتوسيع بدل جدول مسطح، أيقونة + اسم + كمية + إجمالي مطوي، شبكة 3 أعمدة عند التوسيع |
| ملخص التكلفة | CostingSummaryTab.tsx | جدول shadcn Table، صف إجمالي بارز bg-primary/10، تكلفة/م² أسفل الجدول |
| التسعير | PricingPageContentV2.tsx | بطاقة hero بـ bg-blue-50، محدد طريقة بمؤشرات radio، بطاقة مصاريف إضافية مستقلة |
| ملخص التسعير | ProfitAnalysisCard.tsx | جدول shadcn Table، صف إجمالي نهائي bg-primary text-xl bold، سعر المتر + نسبة الربح أسفل الجدول |
| إنشاء دراسة | CreateStudyPage.tsx | بطاقات كبيرة hover:shadow-lg، أيقونات h-14 w-14، gap-6، زر إنشاء كبير بسهم |
| لوحة التشطيبات | QuantitiesDashboard.tsx | زر "حسب الطابق" معطّل مع tooltip "سيتوفر قريباً" |

## Sidebar
| التغيير | التفاصيل |
|---------|----------|
| selling-price → pricing | تحديث ID والرابط من /selling-price إلى /pricing |
| التسعير السريع | إضافة رابط /pricing/quick بأيقونة Zap |
| العملاء المحتملون | إضافة رابط /pricing/leads بأيقونة UserPlus |

## Routes الجديدة
| المسار | الوصف |
|--------|-------|
| /pricing/quick | التسعير السريع المستقل (QuickPricingStandalone) |

## الملفات الجديدة
| الملف | الوصف |
|-------|-------|
| QuickPricingStandalone.tsx | غلاف للتسعير السريع بدون studyId، يبحث عن دراسة CUSTOM_ITEMS أو يعرض CTA |
| pricing/quick/page.tsx | صفحة route للتسعير السريع المستقل |

## ملاحظات
- لم يتم تغيير أي data layer أو API calls
- جميع التغييرات JSX + Tailwind فقط
- صفر أخطاء TypeScript في ملفات التسعير (باستثناء TS2307 الموجودة مسبقاً)
- Build ناجح بالكامل
- 10 ملفات معدلة، 624 إضافة، 481 حذف

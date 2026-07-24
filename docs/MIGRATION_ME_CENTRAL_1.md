# Runbook: نقل مسار من مومباي إلى الخليج (AWS me-central-1)

> **الهدف:** Vercel dxb1 (دبي) + RDS Postgres + S3 في AWS الإمارات (me-central-1).
> **النتيجة المتوقعة:** زمن الطلب من السعودية يهبط من ~400-470ms إلى ~80-150ms.
> **قرار مؤكد (2026-07-25):** Supabase لا يوفر أي منطقة خليجية (تم فحص القائمة كاملة) — لذا AWS هو المسار.
> **الكود جاهز مسبقاً (خامل):** دعم `DATABASE_SSL_CA` في client.ts + وضع الصيانة `MAINTENANCE_MODE=1` في proxy.ts + صفحة /maintenance.

---

## المرحلة 1 — تجهيز AWS (يوم واحد، صفر أثر على الإنتاج)

### 1.1 المنطقة
Account settings ← Regions ← فعّل **Middle East (UAE) me-central-1**.

### 1.2 RDS PostgreSQL
- Engine: PostgreSQL — **نفس الإصدار الرئيسي الحالي أو أحدث** (افحص الحالي في Supabase: `SELECT version();`)
- Instance: `db.t4g.medium` للبيتا (ترقية لاحقاً بضغطة)
- Storage: gp3 / 50GB / autoscaling ON
- **Public access: Yes** (دوال Vercel خارج الـ VPC)
- Security group: افتح 5432 من `0.0.0.0/0` (الحماية = TLS إجباري + كلمة مرور قوية؛ عناوين Vercel غير ثابتة)
- Parameter group مخصص: `rds.force_ssl = 1`
- Backups: automated 7 أيام + deletion protection ON
- بعد الإنشاء: سجّل ENDPOINT + كلمة المرور

### 1.3 الـ extensions
افحص الحالية في Supabase: `SELECT extname FROM pg_extension;` ثم على RDS نفّذ `CREATE EXTENSION IF NOT EXISTS <name>;` لكل واحدة (تجاهل `plpgsql` موجود افتراضياً، وتجاهل extensions خاصة بـ Supabase مثل `pg_graphql`/`supabase_vault` — غير مستخدمة من مسار).

### 1.4 شهادة TLS
حمّل حزمة الشهادات العالمية لـ RDS:
```
curl -o rds-global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```
محتوى هذا الملف (PEM نصي) هو قيمة متغير `DATABASE_SSL_CA` في Vercel.

### 1.5 S3 للتخزين
- Bucket في me-central-1 (نفس أسماء/تقسيم الحالي)
- IAM user بصلاحيات محصورة بالـ bucket + Access keys
- نسخ الملفات من Supabase Storage (S3-متوافق):
```
# ~/.config/rclone/rclone.conf
[supa]
type = s3
provider = Other
access_key_id = <من Supabase: Storage → S3 access keys>
secret_access_key = <...>
endpoint = https://<project-ref>.storage.supabase.co/storage/v1/s3
region = ap-south-1

[awsme]
type = s3
provider = AWS
access_key_id = <IAM key>
secret_access_key = <...>
region = me-central-1

# التنفيذ:
rclone sync supa:<bucket> awsme:<bucket> --progress --transfers 16
```

### 1.6 Redis
يبقى كما هو الآن (رحلة واحدة/عملية بعد إصلاح 2026-07-24). بعد استقرار النقل: ElastiCache أو Redis على EC2 صغير في me-central-1، وبدّل `REDIS_URL`.

---

## المرحلة 2 — بروفة على Preview (نصف يوم، الإنتاج لا يتأثر)

1. نسخة بيانات تجريبية:
```
pg_dump "<DIRECT_URL من Supabase>" -Fc -f masar.dump
pg_restore -d "postgresql://postgres:<PASS>@<RDS-ENDPOINT>:5432/postgres?sslmode=require" \
  --no-owner --no-privileges masar.dump
```
2. في Vercel ← Env ← **Preview فقط**:
   - `DATABASE_URL` = `postgresql://postgres:<PASS>@<RDS-ENDPOINT>:5432/postgres` (**بدون** `?pgbouncer=true` — خاص بـ Supabase)
   - `DIRECT_URL` = نفس القيمة
   - `DATABASE_SSL_CA` = محتوى `rds-global-bundle.pem` كاملاً
   - متغيرات S3 (endpoint/bucket/keys/region) = قيم AWS الجديدة
3. افتح رابط Preview ونفّذ قائمة الفحص: دخول ← فاتورة جديدة (رقم تسلسلي صحيح) ← قيد تلقائي ← رفع صورة وعرضها (image-proxy) ← فتح دراسة ← تقرير محاسبي ← بوابة المالك.

**لا قطع قبل أن تكون البروفة خضراء بالكامل.**

---

## المرحلة 3 — ليلة القطع (نافذة 2-4 فجراً، ~45-60 دقيقة)

> ملاحظة توقيت: كل تغيير env في Vercel يتطلب redeploy (~10 دقائق بناء). النافذة تحتسب ذلك.

| # | الخطوة | المدة |
|---|--------|------|
| 0 | (قبلها بيوم) إعلان داخل التطبيق لمستخدمي البيتا | — |
| 1 | Vercel ← Production env ← `MAINTENANCE_MODE=1` ← Redeploy | ~10د |
| 2 | **التجميد الصلب**: غيّر كلمة مرور قاعدة Supabase (لوحة Supabase ← Database ← Reset password) — أي كتابة من تبويب مفتوح تفشل فوراً | 1د |
| 3 | dump نهائي طازج + restore إلى RDS (نفس أوامر المرحلة 2 — القاعدة الصغيرة = دقائق). **مهم:** أفرغ قاعدة RDS التجريبية أولاً: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` | ~10د |
| 4 | `rclone sync` أخيرة للملفات الجديدة منذ البروفة | ~2د |
| 5 | Vercel ← Production env: بدّل `DATABASE_URL` + `DIRECT_URL` + `DATABASE_SSL_CA` + متغيرات S3، واحذف `MAINTENANCE_MODE` | 3د |
| 6 | ادفع commit تغيير المنطقة: `vercel.json` ← `"regions": ["dxb1"]` (جاهز لدى Claude) — الدفع يشغّل النشر النهائي | ~10د |
| 7 | قائمة تحقق ما بعد القطع (أدناه) | ~10د |

### قائمة التحقق بعد القطع
- [ ] تسجيل دخول
- [ ] إنشاء فاتورة → الرقم التسلسلي التالي الصحيح
- [ ] القيد التلقائي للفاتورة ظهر في القيود اليومية
- [ ] رفع صورة في تقرير يومي وعرضها
- [ ] فتح دراسة كميات وحفظ بند
- [ ] بوابة المالك برابط موجود مسبقاً
- [ ] `curl -s -o /dev/null -w "ttfb:%{time_starttransfer}\n" https://app-masar.com/api/health` → المتوقع < 0.2s
- [ ] Sentry بدون أخطاء اتصال جديدة

## المرحلة 4 — ما بعد النقل
- **أوقف مشروع Supabase مؤقتاً (Pause) — لا تحذفه لأسبوعين** (خط الرجعة = إعادة كلمة المرور القديمة + عكس متغيرات env + إعادة bom1)
- راقب Sentry 48 ساعة (أخطاء TLS/اتصال تحديداً)
- بعد أسبوعين: احذف مشروع Supabase، انقل Redis للمنطقة نفسها، حدّث CLAUDE.md (المنطقة + إزالة ملاحظات pgbouncer)

## التراجع (Rollback) في أي لحظة قبل حذف Supabase
1. أعد كلمة مرور Supabase (أو استخدم الجديدة في URL)
2. أعد متغيرات env القديمة في Vercel (مع `?pgbouncer=true`) واحذف `DATABASE_SSL_CA`
3. أعد `vercel.json` إلى `bom1` وادفع
4. أي بيانات كُتبت في RDS بعد القطع تحتاج دمجاً يدوياً — لذا قرار التراجع يُتخذ خلال الساعات الأولى أو لا يُتخذ

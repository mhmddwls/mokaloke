# Mokaloke / Luxor Connect

المرحلة 1.3: إضافة وحدة اجتماعية متصلة بـ Supabase إلى المشروع الأصلي دون حذف وظائفه الحالية.

- احتفظنا بواجهة المنشورات والأماكن والفعاليات والحساب المحلي.
- أضفنا صفحة تواصل، تسجيل حساب، بحث اسم المستخدم، محادثات فردية ومجموعات، وحالات نصية.
- الاتصال الحقيقي يتطلب إعداد مشروع Supabase وتشغيل `supabase_schema.sql` ثم إدخال URL وPublishable/anon key في التطبيق.
- تعليمات عربية كاملة في `SUPABASE_SETUP_AR.md`.

Build: `npm install` ثم `npx cap sync android` ثم بناء APK عبر GitHub Actions.

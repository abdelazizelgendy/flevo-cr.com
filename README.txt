FLEVO Interactive Website v2

تشغيل محلي:
1) فك الضغط.
2) لأن الموقع يقرأ JSON، شغّله عبر Local Server وليس بالنقر المباشر فقط.
3) أسهل طريقة في VS Code: تثبيت Live Server ثم Open with Live Server.
4) أو من المجلد شغّل: python -m http.server 8000
ثم افتح: http://localhost:8000

الصفحات:
- index.html الرئيسية
- projects.html المشروعات والبحث والفلترة
- project.html?id=renault-duster تفاصيل المشروع
- gallery.html معرض الصور التفاعلي

تعديل البيانات:
- data/projects.json
يمكن تغيير النصوص والصور وإضافة مشروعات جديدة دون تعديل صفحات HTML.

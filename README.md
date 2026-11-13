# MathAI — المستشار الرياضي

تطبيق مساعد رياضيات عربي بواجهة React وVite، مع خادم Node.js وسيط لاتصال Gemini.

## التشغيل محلياً

1. ثبّت Node.js 18 أو أحدث.
2. انسخ `.env.example` إلى `.env` وضع مفتاح Gemini في `API_KEY`.
3. من مجلد المشروع شغّل:

```powershell
npm install
npm run start
```

افتح `http://localhost:8787`. للتطوير السريع شغّل `node server/server.cjs` في نافذة، ثم `npm run dev` من `client` في نافذة ثانية.

لا ترفع ملف `.env` أو مفاتيح API إلى Git.

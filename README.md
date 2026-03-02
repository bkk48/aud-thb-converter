# AUD → THB Converter

แอปแปลงค่าเงิน AUD เป็น THB แบบ real-time พร้อมคำนวณ fee

## Quick Start

```bash
npm install
npm run dev
```

เปิดที่ http://localhost:3000

## โครงสร้างไฟล์

```
aud-thb-converter/
├── app/
│   ├── layout.tsx          # Root layout + Google Fonts
│   ├── globals.css         # Global styles + CSS variables
│   ├── page.tsx            # Main UI page (client component)
│   └── api/
│       └── rate/
│           └── route.ts    # Server-side rate fetching API
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## การดึงอัตราแลกเปลี่ยน

### กลยุทธ์ (ตามลำดับ)
1. **Google Finance** (`/finance/quote/AUD-THB`) — server-side fetch + HTML parsing
2. **exchangerate-api.com** (free, no key) — fallback
3. **Manual input** — ถ้าทั้งสองทางพัง ผู้ใช้กรอกเองได้

### ทำไมต้อง fetch จาก Server เท่านั้น?
- Browser ไม่สามารถ fetch Google Finance โดยตรงได้เพราะ **CORS policy**
  (Google ไม่อนุญาต cross-origin requests จาก browser)
- Next.js API Route (`app/api/rate/route.ts`) รันบน Node.js ฝั่ง server
  ซึ่งไม่มี CORS restriction — จึงสามารถ fetch HTML แล้วส่งกลับเป็น JSON ได้

### หมายเหตุ Scraping
- Google Finance ไม่มี public API อย่างเป็นทางการ
- Class names ใน HTML อาจเปลี่ยนได้เมื่อ Google อัปเดต
- มี fallback API (exchangerate-api.com) รองรับกรณีนี้

## ตัวอย่างการคำนวณ

```
AUD     = 1,000
fee     = 1.5%
netAUD  = 1,000 × (1 - 0.015) = 985.00
rate    = xx.xxxx THB/AUD
THB     = 985.00 × rate
```

## Build สำหรับ Production

```bash
npm run build
npm start
```

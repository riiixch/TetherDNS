<div align="center">
  <h1>🌐 TetherDNS</h1>
  <p><strong>Cloudflare DDNS Manager</strong> ระบบจัดการ Dynamic DNS บน Cloudflare ที่ใช้งานง่ายและทรงพลัง</p>

[![Nuxt](https://img.shields.io/badge/Nuxt-00C58E?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)](https://vuejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

<br>

## 📖 บทนำ (Introduction)

**TetherDNS** (เดิมชื่อ Cloudflare DDNS Manager) เป็น Web Application ที่ถูกพัฒนาขึ้นเพื่อช่วยผสานการทำงานกับ Cloudflare API สำหรับจัดการ IP Address โดยอัตโนมัติ (Dynamic DNS) ผ่านหน้า Web UI ที่สวยงามและใช้งานง่าย เหมาะสำหรับผู้ที่รันเซิร์ฟเวอร์ที่บ้าน (Home Server), กล้องวงจรปิด, หรือบริการต่างๆ ที่ IP ของผู้ให้บริการอินเทอร์เน็ต (ISP) มีการเปลี่ยนแปลงตลอดเวลา

## ✨ คุณสมบัติหลัก (Features)

- 🔒 **จัดการ Cloudflare Accounts:** รองรับการเพิ่มหลายบัญชีผ่าน API Token
- 🌍 **จัดการ Zones และ DNS Records:** ดูและแก้ไขข้อมูล DNS Record ของโดเมนใน Cloudflare ได้โดยตรง
- 🔄 **อัปเดต IP อัตโนมัติ (DDNS):** สร้าง URL เฉพาะ (Update Token) สำหรับนำไปใช้กับ Cronjob, Router หรือ Script เพื่อเชื่อมโยง IP ใหม่เข้ากับโดเมนอัตโนมัติ
- 📜 **ประวัติการอัปเดต (Update Logs):** บันทึกประวัติการเปลี่ยนแปลง IP อย่างละเอียด
- 🔔 **รองรับการแจ้งเตือน (Notifications):** แจ้งเตือนเมื่อมีการเปลี่ยน IP ผ่าน Discord, LINE Notify และ Email
- 👀 **Audit Logs:** ติดตามการกระทำต่างๆ ในระบบ
- 🌐 **รองรับสองภาษา (i18n):** รองรับภาษาไทยและภาษาอังกฤษ
- 🎨 **UI สวยงาม:** ออกแบบด้วย Nuxt UI ใช้งานง่ายทั้งในคอมพิวเตอร์และมือถือ

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** Nuxt 4, Vue 3, Nuxt UI, TailwindCSS, @nuxtjs/i18n
- **Backend:** Nuxt Nitro
- **Database:** LibSQL (SQLite) + Prisma ORM
- **Deployment:** Docker & Docker Compose

## 🚀 การติดตั้งและการใช้งาน (Installation & Setup)

### วิธีที่ 1: ติดตั้งผ่าน Docker (แนะนำ)

1. Clone โปรเจคลงมายังเครื่องของคุณ

```bash
git clone https://github.com/yourusername/tetherdns.git
cd tetherdns
```

2. สร้างและตั้งค่าไฟล์ `.env`

```bash
cp .env.example .env
```

เปิดไฟล์ `.env` และแก้ไข `SESSION_PASSWORD` (ใส่รหัสผ่านแบบสุ่มที่มีความยาวและความปลอดภัย)

3. รัน Docker Compose

```bash
docker-compose up -d
```

TetherDNS จะพร้อมใช้งานที่พอร์ต `http://localhost:3000`

---

### วิธีที่ 2: ติดตั้งแบบ Manual (Node.js)

**สิ่งที่ต้องมี:**

- Node.js (เวอร์ชัน 18 ขึ้นไป) หรือ Bun

1. Clone โปรเจค

```bash
git clone https://github.com/yourusername/tetherdns.git
cd tetherdns
```

2. ติดตั้ง Dependencies

```bash
npm install
# หรือ bun install
```

3. คัดลอกและตั้งค่า `.env`

```bash
cp .env.example .env
```

4. สร้าง Database (Prisma)

```bash
npm run prisma:push
npm run prisma:gen
```

5. รัน Development Server

```bash
npm run dev
```

แอปพลิเคชันจะรันอยู่ที่ `http://localhost:3000`

สำหรับการรันบน Production:

```bash
npm run build
npm start
```

## ⚙️ ตัวแปรสภาพแวดล้อม (Environment Variables)

ไฟล์ `.env` มีค่าที่จำเป็นต้องตั้งค่าดังนี้:

| ตัวแปร             | รายละเอียด                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`     | เส้นทางไฟล์ฐานข้อมูล เช่น `file:./tetherdns.db` หรือเส้นทางอื่น                          |
| `SESSION_PASSWORD` | รหัสผ่านสำหรับการเข้ารหัส Session (ต้องเป็นข้อความสุ่มที่มีความยาวอย่างน้อย 32 ตัวอักษร) |

## 📜 สัญญาอนุญาต (License)

โปรเจคนี้อยู่ภายใต้สัญญาอนุญาต [MIT License](LICENSE) (เพิ่มไฟล์ LICENSE หากมี)

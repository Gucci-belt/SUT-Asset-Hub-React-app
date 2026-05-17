# 📦 SUT Engineering Asset Hub

ระบบยืม-คืนอุปกรณ์ห้องปฏิบัติการสำหรับสาขาวิชาวิศวกรรมคอมพิวเตอร์ มหาวิทยาลัยเทคโนโลยีสุรนารี
An Engineering Laboratory Equipment Borrowing & Returning System for Computer Engineering, Suranaree University of Technology.

---

[![React Native](https://img.shields.io/badge/React%20Native-v0.74-61DAFB?logo=react&logoColor=black)](#)
[![Expo SDK 51](https://img.shields.io/badge/Expo%20SDK-51-000020?logo=expo&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](#)
[![Prisma ORM](https://img.shields.io/badge/Prisma%20ORM-5+-2D3748?logo=prisma&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](#)

---


## 📝 About The Project (เกี่ยวกับโครงการ)

### ภาษาไทย
โครงการนี้พัฒนาขึ้นเพื่อแก้ปัญหาการจัดการครุภัณฑ์และอุปกรณ์ห้องปฏิบัติการภายในสาขาวิชาวิศวกรรมคอมพิวเตอร์ มหาวิทยาลัยเทคโนโลยีสุรนารี โดยระบบจะช่วยให้นักศึกษาสามารถทำการค้นหา ตรวจสอบสถานะ และยื่นคำขอยืมอุปกรณ์ผ่านแอปพลิเคชันบนมือถือได้อย่างสะดวกรวดเร็ว ในขณะเดียวกันเจ้าหน้าที่หรืออาจารย์ผู้ดูแล (Admin) ก็สามารถอนุมัติคำขอ ตรวจสอบประวัติการใช้งาน และจัดการข้อมูลอุปกรณ์ทั้งหมดได้ผ่านระบบหลังบ้านอย่างเป็นระบบและปลอดภัย ป้องกันการสูญหายและช่วยให้การบริหารจัดการมีประสิทธิภาพสูงสุด

### English
This project is designed to resolve asset management challenges in Computer Engineering laboratories at SUT. The system enables students to search for items, check real-time availability, and submit borrow requests via a mobile application. Authorized staff and administrators can manage approvals, audit histories, and handle equipment CRUD operations securely, preventing loss and optimizing resource allocation.

### 🌟 Key Features (คุณสมบัติเด่นของระบบ)
- 🔐 **JWT Authentication & PIN Reset**: สมัครสมาชิกเข้าสู่ระบบด้วยรหัสนักศึกษาอย่างปลอดภัย พร้อมระบบตั้งค่าและกู้คืนรหัส PIN
- 📱 **2-Step Verification QR Code Scanner**: ระบบสแกนยืนยันตัวตน 2 ขั้นตอน (สแกนคิวอาร์โค้ดอุปกรณ์ และ สแกนคิวอาร์โค้ดบนบัตรนักศึกษา) ก่อนเริ่มการยืม
- 📸 **Equipment Image Upload**: ระบบบันทึกและอัปโหลดรูปภาพอุปกรณ์ประกอบการทำรายการและลงทะเบียนอุปกรณ์ใหม่
- 🔔 **Real-Time Notification Badges**: แสดงตัวเลขแจ้งเตือนการยื่นคำขอยืมและคำขอคืนอุปกรณ์สำหรับผู้ดูแลระบบแบบเรียลไทม์ (Polling)
- 👨‍💼 **Admin Dashboard & Approval Workflow**: หน้าควบคุมของแอดมินสำหรับ อนุมัติ/ปฏิเสธ คำขอยืม และตรวจสอบคำขอส่งคืนที่ต้องผ่านการยืนยันจากแอดมินก่อนเท่านั้น (Admin-verified Returns)
- 📊 **Full CRUD Management**: ระบบจัดการข้อมูลอุปกรณ์ (Assets) ข้อมูลธุรกรรม (Transactions) และข้อมูลผู้ใช้ (Users) ครบวงจร

---

## 🛠️ Tech Stack (เทคโนโลยีที่ใช้)

| Layer (ส่วนการทำงาน) | Technology (เทคโนโลยี) |
| :--- | :--- |
| **Mobile Framework** | React Native + Expo SDK 51 |
| **Routing** | Expo Router (File-based routing) |
| **Styling** | NativeWind (Tailwind CSS for React Native) |
| **Camera & Sensors** | `expo-camera` |
| **Secure Storage** | `expo-secure-store` |
| **Backend API** | Node.js + Express |
| **ORM** | Prisma ORM |
| **Database** | PostgreSQL (Managed via Docker) |
| **Authentication** | JSON Web Tokens (JWT) + `bcryptjs` |
| **File Upload** | Multer |
| **Containerization** | Docker + Docker Compose |

---

## 📋 Prerequisites (สิ่งที่ต้องเตรียมก่อนติดตั้ง)

> [!IMPORTANT]
> กรุณาตรวจสอบให้แน่ใจว่าเครื่องคอมพิวเตอร์ของคุณมีซอฟต์แวร์เวอร์ชันต่อไปนี้ติดตั้งและพร้อมใช้งานแล้ว:

*   **Node.js**: เวอร์ชัน 18 ขึ้นไป
*   **Docker Desktop**: ติดตั้งและเปิดทำงานอยู่ (เพื่อใช้เป็นฐานข้อมูล PostgreSQL)
*   **Expo Go App**: ดาวน์โหลดติดตั้งลงในโทรศัพท์มือถือของคุณ (iOS App Store หรือ Google Play Store)
*   **Package Manager**: `npm` หรือ `yarn`
*   **Git**: สำหรับโคลนโปรเจกต์

---

## 🚀 Getting Started (ขั้นตอนการติดตั้งและเริ่มใช้งาน)

ทำตามขั้นตอนด้านล่างทีละขั้นตอนเพื่อดาวน์โหลดและรันระบบจากศูนย์:

### Step 1: Clone the repository (ดาวน์โหลดซอร์สโค้ด)
เปิด Terminal หรือ Command Prompt แล้วพิมพ์คำสั่งดังนี้:
```bash
git clone <repo-url>
cd SUT-Asset-Hub
```

### Step 2: Setup Environment Variables (ตั้งค่าตัวแปรสภาพแวดล้อม)
เข้าไปในโฟลเดอร์ `server` และคัดลอกไฟล์ตั้งค่าสภาพแวดล้อม:
```bash
cd server
cp .env.example .env
```
ตรวจสอบให้แน่ใจว่าไฟล์ `.env` ที่สร้างขึ้นใหม่มีค่าดังต่อไปนี้ (สามารถปรับเปลี่ยนรหัสผ่านตามต้องการ):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/it_asset_db"
JWT_SECRET="your-secret-key-change-this"
PORT=3000
```

### Step 3: Start Database via Docker (เปิดใช้งานฐานข้อมูล)
ตรวจสอบว่า **Docker Desktop** กำลังทำงานอยู่ จากนั้นพิมพ์คำสั่งเพื่อดาวน์โหลดและรันอิมเมจฐานข้อมูล:
```bash
cd server
docker-compose up -d
```
*หมายเหตุ: กรุณารอประมาณ 10 วินาทีเพื่อให้ PostgreSQL เริ่มระบบจนพร้อมเชื่อมต่อ*

### Step 4: Setup Backend (ติดตั้งและรันระบบเซิร์ฟเวอร์)
เปิดและรันคำสั่งติดตั้ง Dependencies รวมทั้งอัปเดต Schema ของฐานข้อมูล:
```bash
cd server
npm install
npx prisma db push
npx prisma generate
npm run dev
```
เมื่อเซิร์ฟเวอร์พร้อมใช้งาน จะขึ้นข้อความคอนโซลว่า:
```text
Server running on port 3000
```

### Step 5: Setup Mobile App (ติดตั้งและรันแอปพลิเคชันมือถือ)
เปิดหน้าต่าง Terminal หรือ Command Prompt ใหม่ แล้วทำตามขั้นตอนดังนี้:
```bash
cd mobile
npm install
npx expo start
```
ระบบจะเปิดหน้าแดชบอร์ด Expo Developer Tools และแสดง **QR Code** ขึ้นมาบนหน้าจอ Terminal ให้ใช้กล้องโทรศัพท์ (สำหรับ iOS) หรือแอป Expo Go (สำหรับ Android) สแกนเพื่อเปิดแอปพลิเคชัน

> [!WARNING]
> เครื่องคอมพิวเตอร์ที่ใช้รันแอปพลิเคชัน และโทรศัพท์มือถือที่เปิดใช้งานแอป Expo Go **ต้องเชื่อมต่อบนเครือข่าย WiFi เดียวกันเท่านั้น**

---

## 💻 Daily Development (การเปิดใช้งานในการพัฒนาทั่วไป)

ในการเปิดใช้งานระบบในชีวิตประจำวัน แนะนำให้เปิดใช้งาน **3 หน้าต่าง Terminal** แยกจากกันดังนี้:

*   **Terminal 1 (Database)**: ฐานข้อมูล Docker
    ```bash
    cd server && docker-compose up -d
    ```
*   **Terminal 2 (Backend)**: เซิร์ฟเวอร์ API หลังบ้าน
    ```bash
    cd server && npm run dev
    ```
*   **Terminal 3 (Mobile App)**: แอปพลิเคชันมือถือและ Metro Bundler
    ```bash
    cd mobile && npx expo start
    ```

---

## 📂 Project Structure (โครงสร้างของโฟลเดอร์)

โครงสร้างโฟลเดอร์หลักและไฟล์ที่สำคัญที่จัดเตรียมไว้มีดังนี้:

```text
SUT-Asset-Hub/
├── mobile/
│   ├── app/                    # โค้ดหน้าจอหลักทั้งหมด (ตามมาตรฐาน Expo Router)
│   │   ├── index.tsx           # หน้าจอ Login
│   │   ├── register.tsx        # หน้าจอลงทะเบียนสมัครสมาชิก
│   │   ├── home.tsx            # หน้าจอแรกสำหรับนักศึกษา (ดูลิสต์อุปกรณ์)
│   │   ├── detail.tsx          # หน้ารายละเอียดอุปกรณ์และเลือกวันส่งคืน
│   │   ├── history.tsx         # หน้าประวัติการยืม-คืนของนักศึกษา
│   │   ├── profile.tsx         # หน้าข้อมูลส่วนตัว (แก้ไข ชื่อ, เบอร์, ไลน์ไอดี, รูปโปรไฟล์)
│   │   ├── student-verify.tsx  # หน้าตรวจสอบและยืนยันตัวตน 2 ขั้นตอน (สแกนคิวอาร์โค้ด)
│   │   ├── borrow-detail.tsx   # หน้าแสดงรายละเอียดของประวัติการยื่นคำขอธุรกรรมยืมย่อย
│   │   ├── category.tsx        # หน้าแสดงรายการอุปกรณ์แบ่งตามหมวดหมู่
│   │   ├── reset.tsx           # หน้าจอตั้งค่าเปลี่ยนรหัส PIN
│   │   └── admin/              # หน้าจอสำหรับผู้ดูแลระบบ (Admin Only)
│   │       ├── dashboard.tsx   # หน้าควบคุมหลัก, สถิติรวมและรายการแจ้งเตือนด่วน
│   │       ├── requests.tsx    # รายการรออนุมัติคำขอยืมและคำขอคืนอุปกรณ์
│   │       ├── inventory.tsx   # รายการจัดการอุปกรณ์ทั้งหมด (เพิ่ม/แก้ไข/ลบ)
│   │       ├── add-asset.tsx   # หน้าสำหรับแอดมินเพิ่มอุปกรณ์ใหม่เข้าระบบ
│   │       ├── users.tsx       # หน้ารายการรายชื่อนักศึกษาและข้อมูลสิทธิระบบ
│   │       └── logs.tsx        # หน้าบันทึกประวัติการตรวจสอบย้อนหลัง (Audit Log)
│   └── components/             # คอมโพเนนต์ UI ส่วนที่นำกลับมาใช้ซ้ำ (เช่น BottomTabBar)
│
└── server/
    ├── src/
    │   ├── controllers/        # ส่วนประมวลผลตรรกะทางธุรกิจหลัก (Business Logic)
    │   ├── routes/             # ส่วนกำหนดและจับคู่เส้นทาง API endpoints
    │   └── middleware/         # ส่วนคัดกรองสิทธิ์และเข้าสิทธิ์โทเค็น (Auth middleware)
    ├── prisma/
    │   └── schema.prisma       # ไฟล์โครงสร้าง Database Schema และความสัมพันธ์ของตาราง
    ├── uploads/                # โฟลเดอร์สำหรับเก็บภาพอุปกรณ์ที่อัปโหลดเข้ามา (Gitignored)
    ├── docker-compose.yml      # ไฟล์กำหนดค่ารันคอนเทนเนอร์ฐานข้อมูล PostgreSQL
    └── .env                    # ไฟล์เก็บรักษารหัสผ่านและโทเค็นความลับ (Gitignored)
```

---

## 🔌 API Endpoints Summary (สรุปรายการ API ทั้งหมด)

### 🔑 Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/auth/register` | ลงทะเบียนสมัครสมาชิกผู้ใช้งานใหม่ |
| **POST** | `/api/auth/login` | เข้าสู่ระบบ และรับ JWT Token สำหรับใช้งานต่อ |
| **GET** | `/api/auth/me` | ดึงข้อมูลโปรไฟล์ผู้ใช้งานปัจจุบัน |
| **PUT** | `/api/auth/me` | อัปเดตข้อมูลโปรไฟล์ส่วนตัว (ชื่อ, เบอร์โทร, LINE ID, รูปภาพ) |
| **POST** | `/api/auth/forgot-password/check` | ค้นหารหัสประจำตัวนักศึกษา (Step 1: Forgot Pin/Password) |
| **POST** | `/api/auth/forgot-password/verify-pin`| ยืนยันความถูกต้องของรหัส PIN (Step 2) |
| **POST** | `/api/auth/forgot-password/reset` | ตั้งรหัสผ่านชุดใหม่หลังจากผ่านการยืนยันแล้ว (Step 3) |

### 📦 Assets (ครุภัณฑ์อุปกรณ์)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/assets` | ดึงรายการครุภัณฑ์อุปกรณ์ทั้งหมดในระบบ |
| **GET** | `/api/assets/:id` | ดึงรายละเอียดครุภัณฑ์เฉพาะรายการตาม ID |
| **POST** | `/api/assets` | ลงทะเบียนอุปกรณ์ชิ้นใหม่เข้าระบบ (สิทธิ์ Admin เท่านั้น) |
| **PUT** | `/api/assets/:id` | แก้ไขข้อมูลอุปกรณ์ตาม ID (สิทธิ์ Admin เท่านั้น) |
| **DELETE** | `/api/assets/:id` | ลบอุปกรณ์ออกจากระบบอย่างถาวร (สิทธิ์ Admin เท่านั้น) |

### 📝 Transactions (การยืม-คืน)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/transactions/borrow` | ยื่นคำร้องของนักศึกษาขอยืมอุปกรณ์ |
| **GET** | `/api/transactions/my-history` | ดึงประวัติรายการยืม-คืนเฉพาะของตัวผู้ใช้เอง |
| **PATCH** | `/api/transactions/:id/extend` | ทำเรื่องขอขยายเวลาการยืมอุปกรณ์เพิ่มเติม |
| **DELETE** | `/api/transactions/:id` | ยกเลิกรายการขอยืมอุปกรณ์กรณีคำขอยังเป็น Pending |
| **POST** | `/api/transactions/:id/request-return`| ยื่นเรื่องขอนำอุปกรณ์มาคืนแก่ห้องปฏิบัติการ |
| **PATCH** | `/api/transactions/:id/approve` | อนุมัติคำขอยืมอุปกรณ์จากนักศึกษา (สิทธิ์ Admin เท่านั้น) |
| **PATCH** | `/api/transactions/:id/reject` | ปฏิเสธคำขอยืมอุปกรณ์ของนักศึกษา (สิทธิ์ Admin เท่านั้น) |
| **POST** | `/api/transactions/:id/confirm-return`| แอดมินตรวจสอบอุปกรณ์และยืนยันการรับคืนสำเร็จ (สิทธิ์ Admin เท่านั้น) |

---

## 👥 Default Accounts (บัญชีทดลองสำหรับประเมินระบบ)

> [!TIP]
> อาจารย์หรือคณะกรรมการผู้ตรวจโครงงาน สามารถใช้ชื่อบัญชีผู้ใช้งานทดลองด้านล่างนี้เพื่อใช้ตรวจสอบได้ทันที:

| Role (บทบาท) | Student ID / Username (รหัสนักศึกษา) | Password (รหัสผ่าน) | PIN (รหัสพิน) |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin001` | `admin1234` | `0000` |
| **Student (นักศึกษา)** | `B6512345` | `student1234` | `1234` |

*หมายเหตุ: สามารถสร้างหรือเปลี่ยนแปลงบัญชีจำลองเพิ่มเติมผ่านระบบการลงทะเบียนในแอป หรือเข้าใช้เครื่องมืออำนวยความสะดวก `npx prisma studio` เพื่อเข้าไปดูและแก้ไขจากฐานข้อมูลได้โดยตรง*

---

## ❓ Troubleshooting (การแก้ไขปัญหาเบื้องต้น)

| Problem (อาการ) | Solution (วิธีแก้ไข) |
| :--- | :--- |
| **Docker not running** | ตรวจสอบว่าแอปพลิเคชัน Docker Desktop เปิดอยู่ และเปลี่ยนสถานะเป็นสีเขียว "Running" แล้วหรือไม่ |
| **Database connection error** | ตรวจสอบว่าได้รันฐานข้อมูลใน Docker หรือยัง โดยให้รันคำสั่ง `docker-compose up -d` ในโฟลเดอร์ `server` |
| **Prisma error after schema change** | หากมีการเปลี่ยนแปลงโครงสร้าง DB ให้สั่ง `npx prisma db push` ตามด้วย `npx prisma generate` เสมอ |
| **EPERM error on prisma generate** | บางครั้งเกิดจากไฟล์หรือโฟลเดอร์ถูกใช้โดยกระบวนการเซิร์ฟเวอร์ ให้ปิดเซิร์ฟเวอร์ node ก่อน แล้วค่อยรันคำสั่งอีกครั้ง |
| **Expo app not connecting** | โทรศัพท์ต้องต่อ WiFi เดียวกันกับคอมพิวเตอร์ และควรตรวจสอบการตั้งค่า Firewall ของเครื่องคอมพิวเตอร์ให้ไม่บล็อกพอร์ต 8081 หรือ 19000 |
| **API not responding** | เช็คหน้าต่าง Terminal ของเซิร์ฟเวอร์ว่ามี Error หรือไม่ และเช็คว่า IP ในแอปตรงกับ IP ปัจจุบันของคอมพิวเตอร์ของคุณ |
| **Port 3000 in use** | เปลี่ยนแปลงตัวเลข `PORT` ในไฟล์ `.env` หรือเช็คโปรเซสเก่าแล้วทำการ Kill process ที่ใช้งานพอร์ต 3000 อยู่ออกก่อน |
| **Images not loading** | เช็คค่า `SERVER_URL` หรือ IP Address ที่คอนฟิกไว้ในแอปฝั่งมือถือว่าตรงกับ IP ของเครื่องเซิร์ฟเวอร์ API หรือไม่ |

---

## 🛑 Stopping the Project (การหยุดการทำงานของระบบ)

```bash
# หยุดการรันแอปพลิเคชันฝั่งมือถือ: กด Ctrl+C ในหน้า Metro Bundler
# หยุดการทำงานของ Backend API: กด Ctrl+C ในหน้า Terminal ของ Server

# สั่งหยุดฐานข้อมูลในคอนเทนเนอร์ Docker (ข้อมูลทั้งหมดจะถูกบันทึกไว้อย่างปลอดภัย):
docker-compose stop

# ⚠️ คำเตือน — คำสั่งด้านล่างนี้จะทำการลบข้อมูลทั้งหมดในฐานข้อมูลออกจากระบบถาวร:
docker-compose down -v   # ห้ามรันยกเว้นกรณีต้องการล้างและติดตั้ง DB ใหม่เท่านั้น
```

---

## 🏫 Team & Course Info (ข้อมูลผู้พัฒนาและรายวิชา)

| Field | Info |
| :--- | :--- |
| **Course (รหัสวิชา)** | 1101103 โครงงานการพัฒนาโปรแกรมประยุกต์ด้วยภาษาสคริปต์ |
| **Semester (ภาคเรียน)** | ภาคการศึกษาที่ 3 ปีการศึกษา 2568 |
| **Instructors (อาจารย์ผู้สอน)** | รศ.ดร.จิติมนต์ อั่งสกุล, อ.ดร.อรรคพล วงศ์กอบลาภ |
| **University (สถาบัน)** | Suranaree University of Technology (มหาวิทยาลัยเทคโนโลยีสุรนารี) |

---
<div align="center">
  <sub>พัฒนาด้วยความใส่ใจ สำหรับการบริหารจัดการครุภัณฑ์อย่างยั่งยืน 💻</sub>
</div>

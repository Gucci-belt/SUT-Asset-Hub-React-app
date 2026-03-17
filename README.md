# 📱 SUT Engineering Asset Hub (Mobile Application)

แอปพลิเคชันบนสมาร์ทโฟนสำหรับ **ระบบจัดการและติดตามสถานะอุปกรณ์ห้องปฏิบัติการ (Computer Engineering Lab Asset Management System)** แอปพลิเคชันนี้ถูกพัฒนาต่อยอดมาจากเวอร์ชัน Web Application เพื่อเพิ่มความคล่องตัวให้กับนักศึกษาในการทำรายการยืม-คืนอุปกรณ์ โดยชูจุดเด่นฟีเจอร์การใช้กล้องสมาร์ทโฟนสแกน QR Code จากอุปกรณ์จริง เพื่อทำรายการได้อย่างสะดวกรวดเร็ว ทุกที่ทุกเวลา

## ✨ Features
- **Mobile-First Experience:** UI/UX ที่ออกแบบมาสำหรับหน้าจอมือถือโดยเฉพาะ ทำงานได้ลื่นไหลเหมือนแอปพลิเคชัน Native
- **User Authentication:** ระบบล็อกอินและสมัครสมาชิกที่เชื่อมต่อกับ Backend หลัก ปลอดภัยด้วย JWT Token
- **Quick Asset Browsing:** ค้นหา ดูหมวดหมู่ และตรวจสอบสถานะอุปกรณ์แบบ Real-time
- **QR Code Scanner:** อินเทอร์เฟซอัจฉริยะที่ใช้กล้องของมือถือสแกนบาร์โค้ด หรือ QR Code ที่ติดอยู่บนตัวอุปกรณ์เพื่อทำรายการยืมทันที
- **Transaction History:** ตรวจสอบประวัติการขอยืม-คืน อุปกรณ์ส่วนตัว บนหน้า Profile 

## 🛠 Tech Stack
- **Framework:** [React Native](https://reactnative.dev/) (พัฒนา Cross-platform รองรับทั้ง iOS & Android)
- **Toolkit:** [Expo SDK](https://expo.dev/) (จัดการ Environment และ Build)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (ระบบ File-based Routing รุ่นใหม่ของ React Native)
- **Styling:** [NativeWind](https://www.nativewind.dev/) (การเขียน Tailwind CSS ลงบน React Native โดยตรง)
- **Sensors:** `expo-camera` สำหรับใช้งานกล้องมือถือสแกน QR Code
- **Networking:** `axios` / `fetch` API สำหรับต่อสายคุยกับ Backend Server

---

## 📋 Prerequisites
ก่อนเริ่มต้นติดตั้ง กรุณาตรวจสอบให้แน่ใจว่าเครื่องของคุณมีการติดตั้งเครื่องมือต่อไปนี้:
- **Node.js**: เวอร์ชัน 18.0 ขึ้นไป
- **npm** (มาพร้อมกับ Node.js)
- **Expo CLI**: (ปกติใช้คำสั่ง `npx expo` ได้เลย)
- **Smart Phone**: โหลดแอปพลิเคชัน **Expo Go** (ใช้งานได้ทั้ง iOS/Android) ไว้สำหรับสแกนทดสอบ
- **Android Studio / Xcode**: (ตัวเลือกเสริมหากต้องการจำลอง Emulator ขึ้นมาบนจอคอมพิวเตอร์)

---

## 🚀 Installation & Setup

เนื่องจากโปรเจคนี้เป็นส่วนหนึ่งของระบบใหญ่ ให้นำโค้ดมาเฉพาะในโฟลเดอร์ `mobile` และติดตั้งตามขั้นตอนด้านล่าง:

### 1. เข้าสู่โฟลเดอร์ Mobile
```bash
# สมมติว่า Clone โปรเจคหลักมาแล้ว
cd "1101103 Project Scripting/mobile"
```

### 2. ติดตั้ง Dependencies
```bash
npm install
# หรือ yarn install ถ้าใช้ Yarn
```

### 3. ตั้งค่าการเชื่อมต่อ API (Environment Variables)
แอปบนมือถือจำเป็นต้องรู้ว่า Backend Server ของคุณรันอยู่ที่ IP Address ไหน (ไม่สามารถใช้ localhost ได้เนื่องจากมือถือมองไม่เห็นคอมพิวเตอร์)

ให้สร้างโฟลเดอร์ หรือค้นหาตำแหน่งตั้งค่า API URL ในโค้ด (เช่น หากเราสร้างลิงก์ไว้ที่ไฟล์ config):
```javascript
// ตัวอย่าง: e.g. src/config.js หรือกำหนดในไฟล์ 
export const API_URL = "http://<IP_ADDRESS_เครื่องคอมพิวเตอร์ของคุณ>:3000/api"; 
// สำคัญ: ห้ามใช้ localhost เมื่อรันจอมือถือจริง
```

---

## 💻 Running the Application

คำสั่งนี้จะเริ่มต้นการทำงานของ Metro Bundler ซึ่งเป็นตัวจ่ายโค้ดเข้ามือถือ:

```bash
npx expo start
```
หรือหากมีปัญหาเรื่อง Network (Fetch error) ให้รันด้วย:
```bash
npx expo start -c --offline
```

**วิธีดูผลลัพธ์ (Testing):**
1. **ดูผ่านมือถือจริง (แนะนำ):** เปิดแอป **Expo Go** บนโทรศัพท์ (ต้องต่อ Wi-Fi วงเดียวกับคอมพิวเตอร์) แล้วสแกน QR Code ที่โชว์อยู่บนหน้าจอ Terminal
2. **ดูผ่าน Android Emulator:** เมื่อขึ้น QR Code ให้กดตัวอักษร `a` บนแป้นพิมพ์คีย์บอร์ด 
3. **ดูผ่าน iOS Simulator (ต้องเป็น Mac):** กดตัวอักษร `i` บนแป้นพิมพ์

---

## 📂 Project Structure (Mobile)

โครงสร้างโฟลเดอร์ในส่วนของแอปพลิเคชัน React Native ถูกออกแบบให้สัมพันธ์กับ Expo Router:

```text
mobile/
├── app/                    # 📌 หน้าจอ (Screens) และระบบ Router
│   ├── _layout.tsx         # Layout หลัก (Global Navigation setup)
│   ├── index.tsx           # หน้าจอ Login (Entry Point)
│   ├── register.tsx        # หน้าสร้างบัญชี
│   ├── home.tsx            # หน้า Dashboard หลัก แสดงรายการอุปกรณ์
│   ├── detail.tsx          # หน้าแสดงรายละเอียดของอุปกรณ์แบบเจาะลึก
│   ├── scanner.tsx         # หน้ากล้องจับ QR Code
│   └── profile.tsx         # หน้าแสดงประวัติและส่วนตัว
├── components/             # 🧩 ชิ้นส่วน UI ที่สร้างไว้เรียกใช้งานซ้ำ
│   ├── AssetCard.tsx       # กล่องแสดงข้อมูลอุปกรณ์แต่ละชิ้น
│   ├── CategoryBadge.tsx   # ป้ายหมวดหมู่อุปกรณ์
│   ├── CustomButton.tsx    # ปุ่มกดพื้นฐานที่มี Animation
│   └── LoadingSpinner.tsx  # หน้าจอกำลังโหลด
├── assets/                 # 🖼️ ไฟล์รูปภาพ, ฟอนต์, ไอคอนของแอป
├── tailwind.config.js      # ⚙️ ตั้งค่าระบบ NativeWind (Tailwind สำหรับ RN)
├── babel.config.js         # ⚙️ ตั้งค่าตัวแปลงโค้ด JS
├── tsconfig.json           # ⚙️ ตั้งค่า TypeScript
└── package.json            # 📦 ข้อมูล Library และ Scripts
```

---

## 💡 Developer Guidelines
- **Styling:** โปรเจคนี้ใช้ `NativeWind` ดังนั้นสามารถเขียน Class ของ Tailwind ลงใน attribute `className="..."` ได้ทันทีเหมือนพัฒนาเว็บ 
- **Navigation:** เราใช้ `expo-router` ไม่ต้องห่วงเรื่อง Stack Navigator ซับซ้อน แค่ใช้คำสั่ง `router.push('/home')` ก็เปลี่ยนหน้าได้เลย

*พัฒนาภายใต้รายวิชา 1101103 @ SUT*

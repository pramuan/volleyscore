# VolleyScore

ระบบจัดการสกอร์บอร์ดวอลเลย์บอลแบบเรียลไทม์ (Real-time Volleyball Scoreboard System)

VolleyScore คือเว็บแอปพลิเคชันสำหรับบริหารจัดการการแข่งขันวอลเลย์บอล แสดงผลสกอร์บอร์ด และควบคุมคะแนนผ่านระบบเครือข่าย รองรับการใช้งานร่วมกับโปรแกรมถ่ายทอดสด (OBS/vMix) ผ่าน Browser Source

## คุณสมบัติเด่น (Key Features)

- **Real-time Sync**: คะแนนอัปเดตทันทีทุกหน้าจอผ่าน Socket.IO
- **Management Dashboard**: หน้าจัดการแมตช์การแข่งขัน สร้าง แก้ไข ลบ และตั้งค่ากติกา
- **Controller**: หน้าควบคุมคะแนนสำหรับกรรมการ หรือเจ้าหน้าที่สนาม รองรับการใช้งานผ่านมือถือ
- **Display**: หน้าแสดงผลสกอร์บอร์ดขนาดใหญ่สำหรับขึ้นจอในสนาม
- **OBS Integration**: รองรับการดึงค่าแยกส่วน (ชื่อทีม, คะแนน, เซต) เพื่อนำไปทำกราฟิกถ่ายทอดสดแบบโปร่งใส

## โครงสร้างระบบ (Architecture)

- **Frontend**: React, Vite, Tailwind CSS (อยู่ในโฟลเดอร์ `client`)
- **Backend**: Node.js, Express, Socket.IO (อยู่ในโฟลเดอร์ `server`)
- **Database**: PocketBase (ไฟล์ `pocketbase.exe`)

## การติดตั้งและการใช้งาน (Installation & Usage)

### สิ่งที่ต้องมี (Prerequisites)
- [Node.js](https://nodejs.org/) (Version 16+)
- PocketBase (มีไฟล์ .exe ในโปรเจกต์แล้ว)

### 1. เปิด Database (PocketBase)
เข้าไปที่โฟลเดอร์ที่มีไฟล์ `pocketbase.exe` แล้วรันคำสั่ง:
```bash
./pocketbase serve
```
*เข้าหน้า Admin ได้ที่: `http://127.0.0.1:8090/_/`*

### 2. รัน Server (Backend)
เปิด Terminal ใหม่ ไปที่โฟลเดอร์ `server`:
```bash
cd server
npm install  # ทำครั้งแรกเพื่อลง library
npm run dev
```
*Server จะทำงานที่ Port: 3000*

### 3. รัน Client (Frontend)
เปิด Terminal ใหม่ ไปที่โฟลเดอร์ `client`:
```bash
cd client
npm install  # ทำครั้งแรกเพื่อลง library
npm run dev
```
*เว็บจะเปิดได้ที่: `http://localhost:5173`*

## คู่มือการใช้งาน (User Guide)

### 1. การสร้างและจัดการแมตช์
เข้าที่หน้า **Management** (`/management`)
- กดปุ่ม "Create New Match"
- ใส่ชื่อแมตช์, ชื่อทีมเหย้า, ทีมเยือน
- ตั้งค่าจำนวนเซต (Best of 3/5) และคะแนนต่อเซต (21/25)

### 2. การควบคุมคะแนน
ในหน้า Management ที่การ์ดของแต่ละแมตช์:
- กดปุ่ม **"Controller" > "Open"**
- จะได้หน้าจอควบคุมสำหรับกดเพิ่ม/ลดคะแนน, เปลี่ยนฝ่ายเสิร์ฟ, และจบเซต
- สามารถส่งลิงก์หน้านี้ให้ทีมงานเปิดผ่านมือถือได้

### 3. การนำไปใช้ถ่ายทอดสด (OBS/vMix)
ในหน้า Management ที่การ์ดของแต่ละแมตช์:
- กดปุ่ม **"Broadcast Links (OBS/vMix)"** เพื่อขยายเมนู
- **Full Display**: ใช้ลิงก์จากปุ่ม "Display" สำหรับขึ้นจอเต็ม
- **Partial Overlay**: เลือกลิงก์ย่อย เช่น "Score", "Team Name"
    - กดปุ่ม Copy ลิงก์ที่ต้องการ
    - ใน OBS สร้าง Source แบบ **Browser**
    - วาง URL ลงไป (พื้นหลังจะโปร่งใสอัตโนมัติ)

---
*Developed by Gemini Assistant*

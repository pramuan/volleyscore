# VolleyScore

ระบบจัดการสกอร์บอร์ดวอลเลย์บอลแบบเรียลไทม์ (Real-time Volleyball Scoreboard System)

VolleyScore คือเว็บแอปพลิเคชันสำหรับบริหารจัดการการแข่งขันวอลเลย์บอล แสดงผลสกอร์บอร์ด และควบคุมคะแนนผ่านระบบเครือข่าย รองรับการใช้งานร่วมกับโปรแกรมถ่ายทอดสด (OBS/vMix) ผ่าน Browser Source

![VolleyScore Thumbnail](https://github.com/pramuan/volleyscore/blob/main/thumbnail.png?raw=true)

## คุณสมบัติเด่น (Key Features)

- **Real-time Sync**: คะแนนอัปเดตทันทีทุกหน้าจอผ่าน Socket.IO
- **Multi-Court Support**: รองรับการจัดการแข่งขันพร้อมกันหลายสนาม (Court/Arena) โดยแยกกลุ่มแมตช์ตามสนามอย่างชัดเจน
- **Auto-Live System**: ระบบ "Set as Live" แยกอิสระตามสนาม ทำให้สามารถมีแมตช์ที่ Live พร้อมกันได้ในแต่ละสนาม
- **Auto-Live Channel**: ลิงก์พิเศษ (`/display/court/:id`) สำหรับแต่ละสนาม ที่จะแสดงผลแมตช์ที่ Live อยู่โดยอัตโนมัติ เหมาะสำหรับ OBS/vMix ที่ไม่ต้องคอยเปลี่ยน URL
- **Network Accessibility**: รองรับการใช้งานผ่านวง LAN ได้ทันที ลิงก์ต่างๆ จะใช้ IP Address ของเครื่องแม่ข่ายโดยอัตโนมัติ
- **Management Dashboard**: หน้าจัดการแมตช์การแข่งขัน สร้าง แก้ไข ลบ และตั้งค่ากติกา พร้อมจัดกลุ่มตามสนาม
- **Controller**: หน้าควบคุมคะแนนสำหรับกรรมการ รองรับการแสดงชื่อสนาม (Court ID) และสัญลักษณ์ Standby ที่ชัดเจน
- **User Authentication**: ระบบล็อกอินด้วย Email/Password สำหรับเข้าถึง Management Dashboard
- **PIN Protection**: ระบบรักษาความปลอดภัยด้วย PIN 4 หลักสำหรับควบคุม Controller แต่ละแมตช์
- **Team Customization**: รองรับการปรับแต่งสีประจำทีม (Team Colors) และอัปโหลดโลโก้
- **Custom Backgrounds**: ปรับเปลี่ยนภาพพื้นหลัง Scoreboard ได้อิสระ
- **Automatic Rules**: ระบบนับคะแนนอัตโนมัติ รองรับ Deuce และ Tie-break
- **Side Switching**: ระบบสลับฝั่งทีม (Switch Sides) ได้ง่ายเพียงปุ่มเดียว
- **Error Handling**: แสดงหน้า "Match Not Found" อย่างเหมาะสม

## โครงสร้างระบบ (Architecture)

- **Frontend**: React, Vite, Tailwind CSS (อยู่ในโฟลเดอร์ `client`)
- **Backend**: Node.js, Express, Socket.IO (อยู่ในโฟลเดอร์ `server`)
- **Database**: PocketBase (ไฟล์ `pocketbase.exe`)

## การติดตั้งและการใช้งาน (Installation & Usage)

### สิ่งที่ต้องมี (Prerequisites)
- [Node.js](https://nodejs.org/) (Version 16+)
- PocketBase (มีไฟล์ .exe ในโปรเจกต์แล้ว)

### วิธีเริ่มใช้งาน (Quick Start)
1. ดับเบิ้ลคลิกไฟล์ `start_volleyscore.bat`
2. หน้าต่าง Terminal จะเปิดขึ้นมา (ห้ามปิดหน้าต่างนี้)
3. ระบบจะเปิดหน้าเว็บ **Management Dashboard** ให้อัตโนมัติ

**Tip:** หากต้องการใช้งานจากเครื่องอื่นในวง LAN ให้ดูที่ Terminal จะมีบอก URL เช่น `http://192.168.1.xxx:5173/management`

## คู่มือการใช้งาน (User Guide)

### 1. การสร้างและจัดการแมตช์
เข้าที่หน้า **Management** (`/management`)
- กดปุ่ม **"+ New Match"**
- ใส่ชื่อแมตช์, ชื่อทีม, เลือกสี, อัปโหลดโลโก้/พื้นหลัง
- **Court / Arena**: เลือกสนามที่ทำการแข่งขัน (เช่น Court 1, Main Stadium)
- แมตช์จะถูกจัดกลุ่มตามสนามที่เลือกไว้ในหน้า Dashboard

### 2. การควบคุมคะแนน (Controller)
ที่การ์ดของแมตช์ กดปุ่ม **"Controller" > "Open"**
- ใส่ PIN 4 หลัก (ดูได้จากหน้า Management)
- **Header**: ด้านบนจะแสดงชื่อสนาม (Court ID) ให้ผู้คุมทราบ
- ควบคุมคะแนน เปลี่ยนเสิร์ฟ หรือสลับฝั่งได้ตามปกติ

### 3. ระบบ Auto-Live และการถ่ายทอดสด
- **Set as Live**: กดปุ่มนี้เพื่อให้แมตช์ "ออนไลน์" ในสนามนั้นๆ (ระบบจะปิด Live ของแมตช์อื่นในสนามเดียวกันให้อัตโนมัติ)
- **Auto-Live Channel**: ที่หัวข้อของแต่ละสนาม (Header) จะมีปุ่ม **"Auto-Live Channel"**
    - นำลิงก์นี้ไปใส่ใน OBS/vMix เพียงครั้งเดียว
    - เมื่อแอดมินกดเปลี่ยนคู่ Live ในสนามนั้น หน้าจอ OBS/vMix จะเปลี่ยนตามทันทีโดยไม่ต้องแก้ Link

### 4. การแชร์ลิงก์
- ปุ่ม "Open" และ "Copy Link" ทั้งหมดจะถูกแปลงเป็น **IP Address** ของเครื่อง Server โดยอัตโนมัติ
- สามารถ Copy Link ส่งไลน์ให้กรรมการหรือทีมงานเปิดผ่านมือถือ/แท็บเล็ตได้ทันที

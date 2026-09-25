<p align="center">
  🇹🇭 <strong>ภาษาไทย</strong> &nbsp;|&nbsp; 🇬🇧 <a href="./README.en.md"><strong>English</strong></a>
</p>

<p align="center">
  <img src=".github/assets/logo-main.png" alt="Zublo" width="90%" />
</p>

<p align="center">
  <strong>ระบบติดตาม subscription แบบ self-hosted พร้อม AI ที่ใช้งานได้จริง</strong>
</p>

<p align="center">
  โอเพนซอร์ส · ใช้ Docker เป็นหลัก · สร้างมาสำหรับคนที่โฮสต์เอง, homelab และคนที่อยากคุมรายจ่ายประจำด้วยตัวเอง
</p>

<p align="center">
  <a href="#ติดตั้งในไม่กี่นาที"><strong>ติดตั้งในไม่กี่นาที</strong></a>
  ·
  <a href="#ตัวอย่างหน้าจอ"><strong>ดูตัวอย่างหน้าจอ</strong></a>
  ·
  <a href="./ARCHITECTURE.md"><strong>อ่านสถาปัตยกรรม</strong></a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-1f6feb?style=flat-square" alt="Apache 2.0 License" /></a>
  <a href="https://github.com/danielalves96/zublo/stargazers"><img src="https://img.shields.io/github/stars/danielalves96/zublo?style=flat-square" alt="GitHub stars" /></a>
  <a href="https://github.com/danielalves96/zublo/issues"><img src="https://img.shields.io/github/issues/danielalves96/zublo?style=flat-square" alt="GitHub issues" /></a>
  <a href="#ติดตั้งในไม่กี่นาที"><img src="https://img.shields.io/badge/deploy-Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker deployment" /></a>
  <a href="https://pocketbase.io/"><img src="https://img.shields.io/badge/backend-PocketBase-111111?style=flat-square" alt="PocketBase" /></a>
  <a href="#ai-ในตัว"><img src="https://img.shields.io/badge/AI-built--in-0f766e?style=flat-square" alt="AI built in" /></a>
</p>

Zublo คือแอปติดตาม subscription แบบโอเพนซอร์ส สำหรับคนที่อยากเห็นรายจ่ายประจำทุกอย่างในที่เดียว และอยากเก็บข้อมูลไว้กับตัวเองทั้งหมด ติดตั้งเสร็จได้ในไม่กี่นาที ไม่ต้องเสียทั้งวันหยุด

ในแอปมี:

- หน้าเว็บที่ใช้งานง่าย เห็นรายจ่ายที่เกิดซ้ำทั้งหมด
- การแจ้งเตือน และมุมมองปฏิทินกับสถิติ
- การเข้าถึงผ่าน API
- การติดตั้งด้วย Docker สำหรับคนที่โฮสต์เอง

จุดที่ต่างจากแอปอื่นคือมี AI ในตัว ใช้วิเคราะห์การใช้จ่าย และคุยผ่านแชทได้ เชื่อมต่อผู้ให้บริการ LLM ได้หลายเจ้า ไม่ผูกติดกับเจ้าใดเจ้าหนึ่ง

> **fork นี้** เพิ่มฟีเจอร์สำหรับคนที่แชร์หรือขายต่อแพ็กเกจ Family:
> - สมาชิกและวันหมดอายุพร้อมแจ้งเตือน
> - โลโก้แบรนด์ และแท็บแยกตาม Service
> - Payment account และหน้าสรุป
> - Export/Import รวมสมาชิก
> - อัตราแลกเปลี่ยนฟรีจาก Frankfurter
>
> ดูรายละเอียดที่ [ฟีเจอร์ที่เพิ่มใน fork นี้](#ฟีเจอร์ที่เพิ่มใน-fork-นี้) และติดตั้งจาก `ghcr.io/exodaz/zublo`

## ทำไม Zublo น่าสนใจ

- แก้ปัญหาจริง ขอบเขตแคบและใช้งานได้จริง
- โฮสต์เอง ข้อมูลอยู่ในมือคุณ
- ติดตั้งง่าย และเข้าใจโค้ดได้ง่าย
- ใช้ stack ที่กะทัดรัด ไม่ต้องมีโครงสร้างพื้นฐานมากมาย
- ใช้ประโยชน์ได้ตั้งแต่วันแรก แม้จะไม่เคยแตะโค้ดเลย

## ภาพรวม

| สิ่งที่สำคัญ | ทำไมถึงตอบโจทย์ |
|---|---|
| ทำหน้าที่เดียวให้ดี | ติดตามรายจ่ายประจำ โดยไม่กลายเป็นโปรแกรมบัญชีเต็มรูปแบบ |
| ติดตั้งเร็ว | ใช้ Docker ตั้งค่าไม่กี่บรรทัดก็รันได้ |
| เป็นเจ้าของข้อมูลจริง | ข้อมูลอยู่บนเซิร์ฟเวอร์ของคุณเอง |
| AI ที่มีประโยชน์จริง | แชท คำแนะนำ และเลือกผู้ให้บริการ AI ได้เอง |
| สถาปัตยกรรมกะทัดรัด | หน้าเว็บ React + PocketBase ไม่มีส่วนเกิน |
| fork ไปต่อยอดได้ | โค้ดเล็กพอจะเข้าใจ และพร้อมให้ขยายต่อ |

## เหมาะกับใคร

| กลุ่มผู้ใช้ | ทำไม Zublo ถึงเหมาะ |
|---|---|
| คนที่โฮสต์เอง | container เดียว เก็บข้อมูลด้วย SQLite ไม่ต้องใช้ระบบหนัก ๆ |
| ผู้ใช้ homelab | ใช้ทรัพยากรน้อย สำรองข้อมูลง่าย ต่อกับ reverse proxy ง่าย |
| คนที่ห่วงความเป็นส่วนตัว | ข้อมูล subscription อยู่บนเครื่องของคุณเอง |
| นักพัฒนาอิสระ | โค้ด full-stack กะทัดรัด fork ไปต่อยอดได้จริง |
| ทีมที่แชร์ค่าใช้จ่าย | เห็นค่าใช้จ่ายประจำชัดเจน โดยไม่ต้องใช้โปรแกรมการเงินเต็มรูปแบบ |
| คนที่แชร์/ขายต่อแพ็กเกจ Family | จดสมาชิก ยอดที่แต่ละคนจ่าย และวันหมดอายุ พร้อมแจ้งเตือนก่อนหมด |

## ตัวอย่างหน้าจอ

<p align="center">
  <img src="./.github/assets/dashboard.png" alt="แดชบอร์ด Zublo" width="100%" />
</p>

<p align="center">
  <img src="./.github/assets/subscriptions.png" alt="หน้ารายการ subscription" width="100%" />
</p>

<p align="center">
  <img src="./.github/assets/calendar.png" alt="หน้าปฏิทิน" width="100%" />
</p>

<p align="center">
  <img src="./.github/assets/statistics.png" alt="หน้าสถิติ" width="100%" />
</p>

<p align="center">
  <img src="./.github/assets/chat.png" alt="หน้าแชท" width="100%" />
</p>

## ฟีเจอร์ทั้งหมด

| ส่วน | สิ่งที่ได้ |
|---|---|
| Subscription | รอบการเรียกเก็บเงิน, วันครบกำหนด, ข้อมูลการชำระเงิน, ประวัติการเปลี่ยนแปลงพร้อมยอดใช้จ่ายรวม |
| หน้าสรุป Subscription | คลิก subscription ใดก็ได้เพื่อดูสรุปในหน้าเดียว: ค่าใช้จ่ายต่อรอบ/เดือน/ปี, รอบบิล, บัญชีที่ชำระ, สมาชิก, โน้ต |
| สมาชิกในครอบครัว (Family Sharing) | คนที่แชร์ subscription แต่ละตัว: ชื่อ, อีเมล, ยอดที่จ่าย, วันหมดอายุ |
| แจ้งเตือนวันหมดอายุ | แจ้งเตือนก่อนสมาชิกหมดอายุ ผ่านช่องทางเดียวกับแจ้งเตือนค่าบริการ |
| Service และโลโก้แบรนด์ | 48 บริการยอดนิยม (Netflix, YouTube, Spotify, Prime Video, HBO Max, Microsoft 365 …) และค้นหาแบรนด์อื่นผ่าน Brandfetch พร้อมโลโก้ |
| แท็บ Service และการจัดกลุ่ม | แท็บแยกตาม Service (MS365, Netflix, Spotify …) สร้างอัตโนมัติจาก Service หรือ URL ของแต่ละรายการ และโหมดจัดกลุ่มที่แสดงจำนวน ค่าใช้จ่ายต่อปี และจำนวนสมาชิกของแต่ละ Service |
| Payment account | บันทึกว่า subscription เรียกเก็บเงินจากบัญชีไหน เช่น Apple ID |
| Export / Import | สำรองและกู้คืนข้อมูลครบถ้วนเป็น JSON หรือ Excel รวมสมาชิก และนำเข้าไฟล์จาก Wallos ได้ |
| ปฏิทิน | แสดงวันชำระเงินและวันหมดอายุของสมาชิก |
| แดชบอร์ด | ภาพรวมค่าใช้จ่ายและตัวเลขสรุป |
| สถิติ | แยกค่าใช้จ่ายตามหมวดและดูแนวโน้ม |
| สกุลเงิน | รองรับหลายสกุลเงิน อัปเดตอัตราแลกเปลี่ยนจาก [Frankfurter](https://frankfurter.dev) (ฟรี ไม่ต้องใช้ API key รองรับกว่า 200 สกุล), Fixer.io หรือ APILayer |
| API | ใช้งาน REST ผ่าน API key ที่กำหนดขอบเขตได้ |
| AI | แชท คำแนะนำ และเลือกผู้ให้บริการได้ |
| การยืนยันตัวตน | 2FA แบบ TOTP |
| การติดตั้ง | แอปเดียวแบบ self-hosted ด้วย Docker |

## ฟีเจอร์ที่เพิ่มใน fork นี้

fork นี้ต่อยอด Zublo ให้เหมาะกับคนที่**แชร์หรือขายต่อแพ็กเกจแบบ Family** เช่น Microsoft 365 Family, Spotify Family หรือ YouTube Premium Family ที่หารกันหลายคน ต้องจดว่าใครจ่ายเท่าไหร่ และใครใกล้หมดอายุ

| # | ฟีเจอร์ | อยู่ตรงไหน | เวอร์ชัน |
|---|---|---|---|
| 1 | [สมาชิกในครอบครัว](#1-สมาชิกในครอบครัว-family-sharing) | ปุ่ม Members บนการ์ด | 0.7.0-family.1 |
| 2 | [แจ้งเตือนสมาชิกใกล้หมดอายุ](#2-แจ้งเตือนสมาชิกใกล้หมดอายุ) | ทำงานอัตโนมัติ | 0.7.0-family.1 |
| 3 | [วันหมดอายุในปฏิทิน](#3-วันหมดอายุของสมาชิกในปฏิทิน) | หน้า Calendar | 0.7.0-family.1 |
| 4 | [Service และโลโก้แบรนด์](#4-service-และโลโก้แบรนด์) | ฟอร์ม subscription | 0.7.0-family.1 |
| 5 | [Payment account](#5-payment-account) | ฟอร์ม subscription | 0.7.0-family.1 |
| 6 | [หน้าสรุป Subscription](#6-หน้าสรุป-subscription) | คลิกที่การ์ด | 0.7.0-family.1 |
| 7 | [Export และ Import](#7-export-และ-import) | ปุ่มบนหน้า Subscriptions | 0.7.0-family.2 |
| 8 | [อัตราแลกเปลี่ยนจาก Frankfurter](#8-อัตราแลกเปลี่ยนจาก-frankfurter) | Settings → Exchange Rate API | 0.7.0-family.3 |
| 9 | [แท็บ Service และการจัดกลุ่ม](#9-แท็บ-service-และการจัดกลุ่ม) | ด้านบนหน้า Subscriptions | 0.7.0-family.4 |

### 1. สมาชิกในครอบครัว (Family Sharing)

บันทึกว่า subscription แต่ละตัวแชร์กับใครบ้าง

- กดปุ่ม **Members** (ไอคอนรูปคน) บนการ์ด หรือปุ่ม "จัดการสมาชิก" ในหน้าสรุป
- เพิ่ม แก้ไข หรือลบสมาชิกได้ แต่ละคนมีข้อมูล:

| ข้อมูล | จำเป็นไหม | หมายเหตุ |
|---|---|---|
| ชื่อ | จำเป็น | ใส่อีเมลเป็นชื่อก็ได้ |
| อีเมล | ไม่บังคับ | ในหน้าสมาชิกกดเพื่อส่งอีเมลได้ |
| ยอดที่จ่าย | ไม่บังคับ | ใช้สกุลเงินเดียวกับ subscription ใช้แสดงยอดรวมที่เก็บได้เท่านั้น ไม่นับรวมในสถิติค่าใช้จ่าย |
| วันหมดอายุ | ไม่บังคับ | ถ้าเว้นว่าง ถือว่าไม่มีวันหมด |
| โน้ต | ไม่บังคับ | เช่น ช่องทางที่โอนเงินมา |

- สมาชิกแต่ละคนมีป้ายสถานะ:
  - 🟢 **Active**: ยังไม่หมดอายุ
  - 🟡 **เหลือ N วัน / หมดวันนี้**: หมดภายใน 7 วัน
  - 🔴 **Expired**: หมดอายุแล้ว
- บนการ์ดมีตัวเลขจำนวนสมาชิก สีตามสมาชิกที่สถานะน่าห่วงที่สุดในกลุ่ม
- ลบ subscription แล้ว สมาชิกของ subscription นั้นถูกลบตามไปด้วย

### 2. แจ้งเตือนสมาชิกใกล้หมดอายุ

- ระบบตรวจทุกชั่วโมง และส่งแจ้งเตือนเมื่อสมาชิกใกล้หมดอายุ
- ใช้**จำนวนวันล่วงหน้าและเวลา**เดียวกับที่ตั้งไว้ใน Settings → Notifications
- ส่งผ่านช่องทางเดิมทั้งหมด (อีเมล, Telegram, Discord, Gotify, ntfy, webhook ฯลฯ)
- ข้อความบอกชื่อ อีเมล subscription และวันหมดอายุของแต่ละคน
- แจ้งเตือนเดิมไม่ส่งซ้ำในวันเดียวกัน
- ไม่ส่งแจ้งเตือนของ subscription ที่เป็น Inactive

### 3. วันหมดอายุของสมาชิกในปฏิทิน

- หน้า **Calendar** แสดงวันหมดอายุของสมาชิกเป็นป้ายสีฟ้าเส้นประ คู่กับวันชำระเงิน
- วันหมดอายุ**ไม่นับรวม**ในยอดชำระของวันหรือของเดือน
- กดที่วันเพื่อดูรายชื่อสมาชิกที่หมดวันนั้นในส่วน "Member expiries"
- กดที่ชื่อสมาชิกเพื่อเปิดหน้าจัดการสมาชิก (เช่น ต่ออายุ) ได้ทันที

### 4. Service และโลโก้แบรนด์

- ช่อง **Service** อยู่บนสุดของฟอร์ม subscription เลือกได้ 3 แบบ:
  1. **บริการสำเร็จรูป 48 ตัว** เช่น Netflix, YouTube Premium, Spotify, Prime Video, HBO Max, Disney+, Microsoft 365, Google One, iCloud+, ChatGPT, Claude, Canva, Viu, WeTV, TrueID, JOOX
  2. **ค้นหาจาก Brandfetch** พิมพ์ชื่อแบรนด์ใดก็ได้ ผลค้นหาแสดงต่อจากรายการสำเร็จรูป
  3. **พิมพ์โดเมนเอง** เช่น `canva.com` แล้วเลือก "Use canva.com"
- เลือกแล้วระบบกรอก**ชื่อและ URL** ให้ถ้ายังว่าง และตั้งโลโก้ให้อัตโนมัติ
- ส่วน Logo ในฟอร์มแสดงตัวอย่างโลโก้จาก Brandfetch ถ้าต้องการรูปอื่น ค้นหาหรืออัปโหลดเองได้
- ลำดับที่ใช้เลือกโลโก้:
  1. โลโก้ที่อัปโหลดเอง
  2. Service ที่เลือก
  3. โดเมนใน URL ของ subscription (รายการเก่าจึงได้โลโก้อัตโนมัติ)
  4. ตัวอักษรแรกของชื่อ
- โลโก้แสดงบนการ์ด (ทั้ง Grid และ List), หน้าสรุป, ปฏิทิน และแดชบอร์ด
- **เงื่อนไขของ Brandfetch:**
  - ต้องโหลดรูปจาก CDN ของ Brandfetch โดยตรง (hotlink) Zublo จึงเก็บแค่โดเมน ไม่ดาวน์โหลดรูปมาเก็บ
  - ต้องตั้งค่า `BRANDFETCH_CLIENT_ID` (ดู [การตั้งค่า](#การตั้งค่า)) ถ้าไม่ตั้ง จะแสดงเป็นตัวอักษรแทน และค้นหาจาก Brandfetch ไม่ได้

### 5. Payment account

- ช่อง **Payment account** ในฟอร์ม ใช้บันทึกว่า subscription เรียกเก็บเงินจากบัญชีไหน เช่น Apple ID หรือบัญชี Google ที่ใช้สมัคร
- เป็นข้อความอิสระ แยกจาก Payment method (Visa, PayPal …) ที่บอกว่าจ่ายด้วยอะไร
- แสดงบนการ์ดข้างไอคอนวิธีชำระเงิน อีเมลที่ยาวจะถูกย่อ ชี้เมาส์เพื่อดูเต็ม

### 6. หน้าสรุป Subscription

คลิกที่ใดก็ได้บนการ์ด subscription (หรือกด Enter เมื่อเลือกการ์ดด้วยคีย์บอร์ด) เพื่อเปิดหน้าสรุป ซึ่งมี:

| ส่วน | รายละเอียด |
|---|---|
| หัวข้อ | โลโก้, ชื่อ, หมวดหมู่, สถานะ Active/Inactive |
| ค่าใช้จ่าย | ราคาต่อรอบ, ต่อเดือน, ต่อปี และยอดที่จ่ายไปแล้วทั้งหมด |
| รอบบิล | วันชำระถัดไป (อีกกี่วัน), วันเริ่ม, ต่ออายุอัตโนมัติ, จำนวนงวด/วันสิ้นสุด, วันยกเลิก, การแจ้งเตือน |
| การชำระเงิน | สกุลเงิน, วิธีชำระเงิน, Payment account, ผู้จ่าย |
| สมาชิก | จำนวนสมาชิก, ยอดรวมที่เก็บได้, รายชื่อพร้อมสถานะวันหมดอายุ |
| โน้ต | URL (กดเปิดได้) และโน้ตทั้งหมด |

ด้านล่างมีปุ่ม **ประวัติ**, **จัดการสมาชิก** และ **แก้ไข** ปุ่มต่าง ๆ บนการ์ดยังทำงานตามปกติ ไม่เปิดหน้าสรุป

### 7. Export และ Import

ปุ่ม **Export** และ **Import** อยู่ในหน้า Subscriptions ใช้สำรองข้อมูล หรือย้ายข้อมูลระหว่างบัญชี/เครื่อง ข้อมูลที่ export ออกมามี:

- ทุกฟิลด์: ราคา, รอบบิล, วันที่ต่าง ๆ, จำนวนงวด, การแจ้งเตือน, auto mark paid, โน้ต, URL
- Service (โดเมนแบรนด์) และ Payment account
- หมวดหมู่, วิธีชำระเงิน และผู้จ่าย (อ้างอิงด้วยชื่อ)
- สมาชิกในครอบครัวทั้งหมด

| รูปแบบ | ได้อะไร | Import กลับได้ |
|---|---|---|
| JSON | ไฟล์เดียว `{ "format": "zublo", "version": 2, "subscriptions": [...] }` สมาชิกซ้อนอยู่ในแต่ละ subscription | ✓ |
| Excel (.xlsx) | 2 ชีต: **Subscriptions** และ **Members** ผูกกันด้วยคอลัมน์ `subscription_id` | ✓ แก้ใน Excel แล้ว import กลับได้ |
| Wallos JSON | ไฟล์ export จาก [Wallos](https://github.com/ellite/Wallos) | ✓ |

การ import ทำงานแบบนี้:

- **เพิ่มข้อมูลใหม่เสมอ ไม่เขียนทับของเดิม** ถ้า import ไฟล์เดิมซ้ำจะได้ข้อมูลซ้ำ
- หมวดหมู่, วิธีชำระเงิน และผู้จ่าย จับคู่ด้วยชื่อ ถ้ายังไม่มีระบบสร้างให้
- สกุลเงินจับคู่ด้วยรหัส (เช่น THB) ถ้าไม่พบจะใช้สกุลเงินหลักของคุณ
- หลัง import มีข้อความบอกจำนวน subscription และสมาชิกที่นำเข้า
- ไฟล์ export จาก Zublo เวอร์ชันเก่า ก็ยัง import ได้

### 8. อัตราแลกเปลี่ยนจาก Frankfurter

- ไปที่ **Settings → Exchange Rate API** แล้วเลือก **Frankfurter (free, no API key)** จากนั้นกด **Save** ก็ใช้งานได้ทันที
  - เป็นค่าเริ่มต้นสำหรับผู้ใช้ใหม่
  - ใช้ได้ฟรี ไม่ต้องสมัคร ไม่ต้องใช้ API key
  - ใช้อัตราอ้างอิงรายวันจากธนาคารกลาง รองรับกว่า 200 สกุลเงิน รวมถึง THB
- อัปเดตอัตโนมัติวันละ 2 ครั้ง (เที่ยงคืนและเที่ยงวัน) หรือกด **Update exchange** เพื่ออัปเดตทันที
- เปลี่ยนสกุลเงินหลักแล้ว อัตราจะอัปเดตใหม่อัตโนมัติ
- ยังเลือกใช้ Fixer.io หรือ APILayer (ต้องมี API key) ได้เหมือนเดิม และ API key ที่เคยบันทึกไว้ไม่หายเมื่อสลับไปมา

### 9. แท็บ Service และการจัดกลุ่ม

- ด้านบนหน้า Subscriptions มี**แท็บแยกตาม Service** เช่น `[All 50] [Microsoft 365 49] [Google Gemini 1]` พร้อมโลโก้และจำนวน
  - แท็บสร้างอัตโนมัติจาก Service ที่เลือกไว้ หรือโดเมนใน URL
  - รายการที่ไม่มีทั้งสองอย่างอยู่ในแท็บ **Other**
- กดแท็บเพื่อดูเฉพาะ Service นั้น ใช้ร่วมกับช่องค้นหาและตัวกรองเดิมได้
- ปุ่ม **Group by service** จัดการ์ดเป็นกลุ่มตาม Service หัวข้อของแต่ละกลุ่มแสดง:
  - โลโก้และชื่อ Service
  - จำนวนรายการ
  - **ค่าใช้จ่ายต่อปี** (แปลงเป็นสกุลเงินหลัก นับเฉพาะรายจ่ายที่ Active)
  - จำนวนสมาชิกรวม
- ระบบจำการเลือกโหมดจัดกลุ่มไว้ในเบราว์เซอร์

### ตัวอย่าง: จัดการ Microsoft 365 Family ที่แชร์ 5 คน

1. **Add subscription:** ช่อง Service เลือก **Microsoft 365** ระบบใส่ชื่อ URL และโลโก้ให้
   - ใส่ราคาต่อปี รอบบิล **Yearly** และวันชำระถัดไป
   - ช่อง **Payment account** ใส่ Apple ID ที่ใช้จ่าย
2. กดปุ่ม **Members** บนการ์ด แล้วเพิ่มลูกค้าทั้ง 5 คน พร้อมอีเมล ยอดที่จ่าย (เช่น 400) และวันหมดอายุ
3. ตั้งเวลาแจ้งเตือนใน **Settings → Notifications** เช่น 7 วันก่อน เวลา 9 โมง ระบบจะเตือนทั้งวันชำระเงินและวันที่ลูกค้าแต่ละคนหมดอายุ
4. ใช้แท็บ **Microsoft 365** และ **Group by service** เพื่อดูทุกบัญชีพร้อมยอดรวมต่อปี
5. **Export** เป็น Excel เพื่อสำรองข้อมูล หรือแก้ไขจำนวนมากแล้ว **Import** กลับ

### ประวัติเวอร์ชัน

| เวอร์ชัน (image tag) | สิ่งที่เพิ่ม | Migration |
|---|---|---|
| `0.7.0-family.1` | สมาชิกในครอบครัว, แจ้งเตือนหมดอายุ, วันหมดอายุในปฏิทิน, Service และโลโก้แบรนด์, Payment account, หน้าสรุป | มี (ตารางสมาชิก, `brand_domain`, `payment_account`) |
| `0.7.0-family.2` | Export/Import เต็มรูปแบบ (รวมสมาชิก, Excel) และแก้ปัญหา import ทำวันเริ่มต้นหาย | ไม่มี |
| `0.7.0-family.3` | อัตราแลกเปลี่ยนจาก Frankfurter | มี (เพิ่มตัวเลือก `frankfurter`) |
| `0.7.0-family.4` | แท็บ Service และการจัดกลุ่มตาม Service | ไม่มี |

migration ทำงานอัตโนมัติตอนเปิดแอป และข้อมูลเดิมไม่หาย

## AI ในตัว

AI ในนี้ไม่ได้ใส่มาแค่ให้มี

Zublo มีระบบ AI ที่ทำงานกับข้อมูล subscription ของคุณได้จริง:

- คำแนะนำจาก AI ตามข้อมูลการใช้จ่าย
- หน้าแชทที่เชื่อมกับความสามารถของแอป
- เลือกใช้ผู้ให้บริการได้หลายเจ้า ไม่ผูกกับเจ้าเดียว
- ใช้กับโมเดลที่รันในเครื่องหรือโฮสต์เองได้

ผู้ให้บริการที่รองรับ:

- Google Gemini
- OpenAI
- Ollama
- endpoint ที่เข้ากันได้กับ OpenAI เช่น OpenRouter, Groq, Mistral เป็นต้น

## ทำไมโฮสต์เองแล้วสบาย

| คุณสมบัติ | ในทางปฏิบัติหมายถึง |
|---|---|
| รันแอปเดียว | หน้าเว็บและ backend มาด้วยกัน |
| เก็บข้อมูลด้วย SQLite | สำรองข้อมูลง่าย ดูแลน้อย |
| ใช้ PocketBase เป็นแกน | มีระบบ auth, ข้อมูล และหน้า admin โดยไม่ต้องมี backend ใหญ่ |
| แพ็กมากับ Docker | รันได้บน VPS, NAS, mini-PC หรือ homelab |
| ขอบเขตแคบ | ดูแลง่ายกว่าแพลตฟอร์มการเงินทั่วไป |

## Zublo ไม่ใช่

- ไม่ใช่โปรแกรมบัญชีเต็มรูปแบบ
- ไม่ใช่ระบบทำบัญชี (bookkeeping)
- ไม่ใช่ระบบเชื่อมบัญชีธนาคาร
- ไม่ใช่ SaaS ที่ต้องใช้บน cloud เท่านั้น

ขอบเขตที่แคบคือความตั้งใจ

## Stack

| ส่วน | เทคโนโลยี |
|---|---|
| หน้าเว็บ | React 18, Vite, TypeScript, TanStack Router, React Query, Tailwind CSS |
| Backend runtime | PocketBase |
| ส่วนขยาย backend | PocketBase JS hooks และ migrations |
| ฐานข้อมูล | SQLite ผ่าน PocketBase |
| การแพ็ก | Docker, Docker Compose, GHCR |

## ติดตั้งในไม่กี่นาที

Image อยู่บน GitHub Container Registry รองรับทั้ง `linux/amd64` และ `linux/arm64` (เช่น Raspberry Pi, Mac M-series, NAS ที่ใช้ ARM):

| Tag | ใช้เมื่อ |
|---|---|
| `ghcr.io/exodaz/zublo:latest` | ต้องการเวอร์ชันล่าสุดของ fork นี้ |
| `ghcr.io/exodaz/zublo:0.7.0-family.1` | ต้องการล็อกเวอร์ชัน (แนะนำสำหรับเซิร์ฟเวอร์) |

fork นี้เพิ่มฟีเจอร์สมาชิกครอบครัว, Service พร้อมโลโก้แบรนด์, Payment account และหน้าสรุป subscription ส่วน image ต้นฉบับที่ไม่มีฟีเจอร์เหล่านี้คือ `ghcr.io/danielalves96/zublo`

**1. สร้างโฟลเดอร์และไฟล์ `.env`**

```bash
mkdir zublo && cd zublo
cat > .env <<'ENV'
PB_ENCRYPTION_KEY=ใส่ข้อความสุ่มยาวๆ
BRANDFETCH_CLIENT_ID=
ENV
```

สร้างคีย์สุ่มได้ด้วย `openssl rand -hex 32` ส่วน `BRANDFETCH_CLIENT_ID` ไม่บังคับ (ดู [การตั้งค่า](#การตั้งค่า))

**2. สร้างไฟล์ `docker-compose.yml`**

```yaml
services:
  zublo:
    image: ghcr.io/exodaz/zublo:latest
    container_name: zublo
    restart: unless-stopped
    ports:
      - "9597:9597"
    environment:
      PB_ENCRYPTION_KEY: ${PB_ENCRYPTION_KEY}
      BRANDFETCH_CLIENT_ID: ${BRANDFETCH_CLIENT_ID:-}
    volumes:
      - ./zublo-data:/pb/pb_data
```

**3. เริ่มรัน**

```bash
docker compose up -d
```

หรือใช้ Docker อย่างเดียว:

```bash
docker run -d --name zublo --restart unless-stopped \
  -p 9597:9597 \
  -e PB_ENCRYPTION_KEY=ใส่ข้อความสุ่มยาวๆ \
  -e BRANDFETCH_CLIENT_ID= \
  -v "$(pwd)/zublo-data:/pb/pb_data" \
  ghcr.io/exodaz/zublo:latest
```

**อัปเดตเวอร์ชัน**

```bash
docker compose pull && docker compose up -d
```

ฐานข้อมูลจะ migrate อัตโนมัติตอนเริ่มรัน ควรสำรองโฟลเดอร์ `zublo-data` ก่อนอัปเดตข้ามเวอร์ชัน

**ย้ายมาจาก image ต้นฉบับ**

เปลี่ยน `image:` เป็น `ghcr.io/exodaz/zublo:latest` แล้วใช้ volume `pb_data` เดิมได้เลย migration ใหม่แค่เพิ่มคอลัมน์และตาราง ข้อมูลเดิมไม่หาย

จากนั้นเปิด:

- `http://localhost:9597` หน้าแอป
- `http://localhost:9597/_/` หน้า admin ของ PocketBase
- `http://localhost:9597/api/` REST API

ข้อควรรู้:

- ต้องเก็บ `/pb/pb_data` ไว้ถาวร (volume หรือ bind mount)
- ตั้ง `PB_ENCRYPTION_KEY` เสมอเมื่อใช้งานจริง
- ผู้ใช้คนแรกที่สมัคร จะเป็น admin คนแรก
- ตั้ง `BRANDFETCH_CLIENT_ID` ถ้าต้องการโลโก้แบรนด์ (ไม่บังคับ ดูด้านล่าง)

### การตั้งค่า

| ตัวแปร | จำเป็นไหม | ใช้ทำอะไร |
|---|---|---|
| `PB_ENCRYPTION_KEY` | แนะนำ | เข้ารหัสการตั้งค่าของ PocketBase ที่เก็บไว้ ใช้ค่าสุ่มยาว ๆ ในการใช้งานจริง |
| `BRANDFETCH_CLIENT_ID` | ไม่บังคับ | เปิดใช้โลโก้แบรนด์และการค้นหาแบรนด์ใน Service สมัครฟรีที่ https://developers.brandfetch.com/register (ดูในส่วน Logo API) |

เกี่ยวกับ `BRANDFETCH_CLIENT_ID`:

- **ต้องใช้ Client ID ไม่ใช่ API key** Client ID สั้น ขึ้นต้นด้วย `1id…` และออกแบบมาให้อยู่ใน URL รูปภาพสาธารณะได้
- API key เป็นความลับ และใช้กับ CDN โลโก้ไม่ได้
- แพ็กเกจฟรีใช้ได้ถึง 1 ล้านครั้งต่อเดือน
- ถ้าใช้ Docker Compose ใส่ค่าในไฟล์ `.env` ข้าง `docker-compose.yml` ได้:

```dotenv
PB_ENCRYPTION_KEY=change-me-in-production
BRANDFETCH_CLIENT_ID=1idXXXXXXXXXXXXXXX
```

### ใช้หลัง Reverse Proxy

Zublo เป็น PocketBase process เดียว proxy ใดก็ได้ที่ส่ง HTTP ธรรมดาไปที่พอร์ต `9597` โดยไม่ buffer หรือแก้ไข request body ก็ใช้ได้ ตัวอย่าง Caddy:

```
zublo.example.com {
    reverse_proxy localhost:9597
}
```

ถ้าเปิด MFA หรือแก้โปรไฟล์แล้วเจอ error `400` แบบไม่คาดคิด สาเหตุที่พบบ่อยคือ proxy ไป buffer, บีบอัด หรือแก้ request body ให้ตั้ง proxy แบบส่งผ่านตรง ๆ ให้มากที่สุด

## พัฒนาในเครื่อง

ถ้าต้องการแก้โค้ด:

```bash
bun install
bun run dev
```

คำสั่งนี้จะเปิด:

- Vite ที่ `http://localhost:5173`
- PocketBase ที่ `http://127.0.0.1:8080`

ต้องมีไฟล์ PocketBase ที่ `apps/backend/pocketbase` ไฟล์นี้ไม่ได้อยู่ใน git ให้ดาวน์โหลดเวอร์ชันเดียวกับที่ระบุใน `Dockerfile` (`PB_VERSION`) สำหรับเครื่องของคุณได้จาก [PocketBase releases](https://github.com/pocketbase/pocketbase/releases)

ถ้าต้องการลองโลโก้แบรนด์ในเครื่อง ให้ใส่ Client ID ตอนรัน:

```bash
BRANDFETCH_CLIENT_ID=1idXXXXXXXXXXXXXXX bun run dev
```

รันเทสต์:

```bash
bun run test            # หน้าเว็บ + backend
bun run test:coverage   # เหมือนกัน แต่บังคับ coverage 100% แบบเดียวกับ CI
bun run lint
```

## สถาปัตยกรรมโดยย่อ

Zublo ตั้งใจออกแบบให้กะทัดรัด

- `apps/web` คือแอป React
- `apps/backend` คือ PocketBase hooks, migrations และส่วนที่ทำงานฝั่ง backend
- หน้าเว็บจะถูก build ไปไว้ที่ `apps/backend/pb_public` สำหรับใช้งานจริง
- ตอนใช้งานจริง PocketBase เสิร์ฟทั้ง API และหน้าเว็บ
- ข้อมูลที่เปลี่ยนแปลงระหว่างใช้งานอยู่ที่ `/pb/pb_data`

ตอนพัฒนาในเครื่อง:

- Vite เสิร์ฟหน้าเว็บ
- PocketBase เสิร์ฟ API
- Vite ส่งต่อ `/api` ไปที่ PocketBase

ตอนใช้งานจริง:

- container เดียวเสิร์ฟทั้งหน้าเว็บและ backend

รายละเอียดสถาปัตยกรรมทั้ง repo ดูที่ [ARCHITECTURE.md](./ARCHITECTURE.md)
โครงสร้างฝั่งหน้าเว็บดูที่ [apps/web/ARCHITECTURE.md](./apps/web/ARCHITECTURE.md)

## โครงสร้าง Repository

```text
.
├── apps/
│   ├── backend/   # PocketBase hooks, migrations, runtime assets
│   └── web/       # แอป React
├── scripts/       # เครื่องมือสำหรับผู้ดูแล
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── README.md      # ภาษาไทย (หลัก)
└── README.en.md   # ภาษาอังกฤษ
```

## Repository นี้เหมาะกับใคร

- คนที่โฮสต์เอง
- ผู้ใช้ homelab
- ผู้ร่วมพัฒนาที่อยากได้แอป full-stack เล็ก ๆ ที่เข้าใจง่าย
- นักพัฒนาที่สนใจผลิตภัณฑ์ที่สร้างบน PocketBase

## ทำไมโค้ดยังเข้าใจง่าย

- หน้าเว็บ React และ backend PocketBase อยู่ใน repo เดียวกัน
- logic ฝั่ง backend จัดกลุ่มตามหน้าที่ในไฟล์ hook
- runtime ตอนใช้งานจริงกะทัดรัด เข้าใจง่าย
- วิธีติดตั้งง่ายพอสำหรับคนดูแลคนเดียว
- ขอบเขตผลิตภัณฑ์ถูกจำกัดไว้โดยตั้งใจ

## ร่วมพัฒนา

Zublo ยังอยู่ระหว่างปรับส่วนที่เปิดเป็นโอเพนซอร์ส การมีส่วนร่วมที่ดีตอนนี้คือสิ่งที่ช่วยให้โค้ดชัดเจนขึ้น เริ่มต้นใช้ง่ายขึ้น ดูแลง่ายขึ้น และเปลี่ยนพฤติกรรมในขอบเขตแคบ ๆ

เริ่มที่:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SUPPORT.md](./SUPPORT.md)
- [SECURITY.md](./SECURITY.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## ผู้ดูแล

Zublo ดูแลโดย Daniel Luiz Alves

GitHub: `@danielalves96`

## License

Zublo ใช้สัญญาอนุญาต Apache License 2.0

Copyright Daniel Luiz Alves

ดู [LICENSE](./LICENSE) และ [NOTICE](./NOTICE)

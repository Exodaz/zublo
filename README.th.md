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

<p align="center"><a href="./README.md">English</a> · <strong>ภาษาไทย</strong></p>

Zublo คือแอปติดตาม subscription แบบโอเพนซอร์ส สำหรับคนที่อยากเห็นรายจ่ายประจำทุกอย่างในที่เดียว และอยากเก็บข้อมูลไว้กับตัวเองทั้งหมด ติดตั้งเสร็จได้ในไม่กี่นาที ไม่ต้องเสียทั้งวันหยุด

ในแอปมี:

- หน้าเว็บที่ใช้งานง่าย เห็นรายจ่ายที่เกิดซ้ำทั้งหมด
- การแจ้งเตือน และมุมมองปฏิทินกับสถิติ
- การเข้าถึงผ่าน API
- การติดตั้งด้วย Docker สำหรับคนที่โฮสต์เอง

จุดที่ต่างจากแอปอื่นคือมี AI ในตัว ใช้วิเคราะห์การใช้จ่าย และคุยผ่านแชทได้ เชื่อมต่อผู้ให้บริการ LLM ได้หลายเจ้า ไม่ผูกติดกับเจ้าใดเจ้าหนึ่ง

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

## สมาชิกครอบครัว, Service และโลโก้แบรนด์

เหมาะกับแพ็กเกจที่แชร์หรือขายต่อ เช่น Microsoft 365 Family หรือ Spotify Family ที่หารกันหลายคน

**สมาชิกในครอบครัว (Family Sharing)**

- กดปุ่ม **Members** (ไอคอนรูปคน) บนการ์ด subscription เพื่อเพิ่ม แก้ไข หรือลบสมาชิก แต่ละคนมีชื่อ, อีเมล, ยอดที่จ่าย และวันหมดอายุ (ไม่บังคับ)
- สมาชิกแต่ละคนมีป้ายสถานะ:
  - เขียว: ใช้งานอยู่
  - เหลือง: ใกล้หมด (ภายใน 7 วัน)
  - แดง: หมดอายุแล้ว
- บนการ์ดมีตัวเลขจำนวนสมาชิก สีตามสมาชิกที่สถานะน่าห่วงที่สุด
- วันหมดอายุของสมาชิกแสดงในปฏิทินคู่กับวันชำระเงิน แต่ไม่นับรวมในยอดชำระ คลิกแล้วเปิดหน้าจัดการสมาชิกได้
- ระบบตรวจทุกชั่วโมงและส่งแจ้งเตือนก่อนสมาชิกหมดอายุ
  - ใช้จำนวนวันล่วงหน้าและเวลาเดียวกับที่ตั้งไว้ในหน้า Notifications และส่งผ่านช่องทางเดิม (อีเมล, Telegram, Discord, webhook ฯลฯ)
  - แจ้งเตือนเดิมไม่ส่งซ้ำในวันเดียวกัน
- ลบ subscription แล้ว สมาชิกของ subscription นั้นถูกลบตามไปด้วย

**Service และโลโก้แบรนด์**

- ช่อง **Service** ในฟอร์ม subscription มีบริการยอดนิยม 48 ตัว และค้นหาแบรนด์อื่นจากฐานข้อมูลของ [Brandfetch](https://brandfetch.com/developers/logo-api) ได้ หรือพิมพ์โดเมนเองก็ได้ เช่น `canva.com`
- เลือก Service แล้ว ระบบกรอกชื่อและ URL ให้ถ้ายังว่างอยู่ และตั้งโลโก้ให้อัตโนมัติ ในฐานข้อมูลเก็บแค่โดเมน
- โลโก้โหลดจาก CDN ของ Brandfetch โดยตรง
  - Brandfetch กำหนดให้ hotlink เท่านั้น Zublo จึงไม่ดาวน์โหลดหรือเก็บรูปไว้เลย
  - `/api/brand-logo` แค่ redirect เบราว์เซอร์ไปที่ CDN
- subscription ที่ไม่มีโลโก้อัปโหลดและไม่ได้เลือก Service จะใช้โลโก้ตามโดเมนใน URL ของมันแทน ถ้าอัปโหลดโลโก้เอง ระบบใช้โลโก้นั้นก่อนเสมอ
- ต้องตั้งค่า `BRANDFETCH_CLIENT_ID` ก่อน (ดู [การตั้งค่า](#การตั้งค่า)) ถ้าไม่ตั้ง จะแสดงเป็นตัวอักษรแทน

**Payment account และหน้าสรุป**

- **Payment account** ใช้บันทึกว่า subscription เรียกเก็บเงินจากบัญชีไหน เช่น Apple ID ที่ใช้สมัครผ่านแอป แสดงบนการ์ดและในหน้าสรุป
- คลิกที่การ์ด subscription เพื่อเปิดหน้าสรุป ซึ่งมี:
  - ค่าใช้จ่ายต่อรอบ ต่อเดือน ต่อปี และยอดที่จ่ายไปแล้ว
  - รอบบิลและการแจ้งเตือน
  - ข้อมูลการชำระเงิน
  - รายชื่อสมาชิกพร้อมสถานะวันหมดอายุ
  - URL และโน้ต
  - ปุ่มไปหน้าแก้ไข / สมาชิก / ประวัติ

## Export และ Import

ปุ่ม **Export** และ **Import** ในหน้า Subscriptions ใช้ย้ายข้อมูล subscription ทั้งหมดระหว่างบัญชีหรือระหว่างเครื่องได้ ข้อมูลที่ export ออกมามี:

- ทุกฟิลด์: ราคา, รอบบิล, วันที่ต่าง ๆ, จำนวนงวด, การแจ้งเตือน, auto mark paid, โน้ต, URL
- Service (โดเมนแบรนด์) และ Payment account
- หมวดหมู่, วิธีชำระเงิน และผู้จ่าย (อ้างอิงด้วยชื่อ)
- สมาชิกในครอบครัว

| รูปแบบ | ได้อะไร | Import กลับได้ |
|---|---|---|
| JSON | ไฟล์เดียว `{ "format": "zublo", "version": 2, "subscriptions": [...] }` สมาชิกซ้อนอยู่ในแต่ละ subscription | ✓ |
| Excel (.xlsx) | 2 ชีต: **Subscriptions** และ **Members** ผูกกันด้วยคอลัมน์ `subscription_id` | ✓ (แก้ใน Excel แล้ว import กลับได้) |
| Wallos JSON | ไฟล์ export จาก [Wallos](https://github.com/ellite/Wallos) | ✓ |

การ import ทำงานแบบนี้:

- เพิ่มข้อมูลใหม่เสมอ ไม่เขียนทับของเดิม ถ้า import ไฟล์เดิมซ้ำจะได้ข้อมูลซ้ำ
- หมวดหมู่, วิธีชำระเงิน และผู้จ่าย จับคู่ด้วยชื่อ ถ้ายังไม่มีระบบสร้างให้
- สกุลเงินจับคู่ด้วยรหัส (เช่น THB) ถ้าไม่พบจะใช้สกุลเงินหลักของคุณ
- ไฟล์ export จาก Zublo เวอร์ชันเก่าที่ยังไม่มีฟิลด์ใหม่ ก็ยัง import ได้

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
├── README.md      # ภาษาอังกฤษ
└── README.th.md   # ภาษาไทย
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

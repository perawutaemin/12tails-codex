# 12 Tails Codex

เว็บคลังข้อมูลแฟนเมดของเกม 12 Tails Online เซิร์ฟ TailsTopia
เว็บจริง: https://12tails-codex.pages.dev

> เว็บแฟนเมด ไม่ใช่ของ Official ชื่อเกม รูป ไอคอน และข้อมูลในเกมเป็นของเจ้าของเกม
> ข้อมูลบางส่วนมาจากวิกิ 12 Tails Online ภาษาไทย (fandom) และ tailstopia.online

## มีอะไรบ้าง
- 12 หาง พร้อมจำลองสายสกิล
- NPC: ร้านค้า สูตรคราฟ การแลกของ ภารกิจของ Mimi อัปเกรดสัตว์เลี้ยงของ Mosoly
- ด่าน & ของดรอป พร้อม Tips ด่านเก็บเวล
- ตารางบอส & อารีน่า
- ย่อยไอเทม ไอเทมทั้งหมด (ค้นหาได้ว่ามาจากไหน) และกระดานซื้อ-ขาย

## โครงสร้าง
| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | ตัวเว็บทั้งหมด (HTML/CSS/JS ไฟล์เดียว) |
| `data.json` | ข้อมูลไอเทม สูตร ร้าน ด่าน NPC |
| `img-*.json` | รูปไอคอน/ภาพประกอบ (base64 webp) |
| `wd/`, `wardrobe.json` | ภาพชุดสำหรับห้องแต่งตัว (ซ่อนเมนูอยู่) |
| `functions/api/visits.js` | ตัวนับยอดเข้าชม (Cloudflare Pages Function + KV) |
| `wrangler.toml` | ตั้งค่า Cloudflare Pages |
| `deploy.ps1` | สคริปต์อัปโหลดขึ้น Cloudflare Pages |

## Deploy
```powershell
npx wrangler login      # ครั้งแรกครั้งเดียว
./deploy.ps1
```

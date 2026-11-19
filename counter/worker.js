// 12 Tails Codex API (Cloudflare Worker + KV TTC_VISITS)
//   GET/POST /            visit counter
//   GET      /builds      list board builds
//   POST     /builds      post a build (rate limited per IP)
//   POST     /builds/:id/like   like once per IP
//   DELETE   /builds/:id  admin only (header X-Admin = env.ADMIN_KEY)
const ORIGINS = ["https://perawutaemin.github.io", "https://claude.ai"];
const day = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // Bangkok date
const TAILS = ["Wolf", "Bison", "Panda", "Whale", "Cat", "Chameleon", "Rabbit", "Mole", "Monkey", "Penguin", "Sheep", "Bat"];
const TAGS = ["PVE", "PVP", "ฟาร์ม", "ตีบอส", "มือใหม่"];
const STATS = ["Atk", "Def", "Agi", "Vit", "Int", "Cha", "Tal", "Lck"];
const POST_LIMIT = 3; // per IP per hour
function cors(req) {
  const o = req.headers.get("Origin") || "";
  const ok = ORIGINS.includes(o) || o.endsWith(".claudeusercontent.com") || o.startsWith("http://localhost");
  return { "Access-Control-Allow-Origin": ok ? o : ORIGINS[0], "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "content-type, x-admin", "Vary": "Origin" };
}
async function sha(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 12).map((x) => x.toString(16).padStart(2, "0")).join(""); }
const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
const clean2 = 0;
const nums = (a, n, max) => Array.isArray(a) ? a.slice(0, n).map((x) => Math.max(0, Math.min(max, x | 0))) : 0;
async function readBuilds(kv) { try { return JSON.parse((await kv.get("builds")) || "[]"); } catch { return []; } }
export default {
  async fetch(req, env) {
    const h = { ...cors(req), "content-type": "application/json", "cache-control": "no-store" };
    const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: h });
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    const kv = env.TTC_VISITS, url = new URL(req.url), path = url.pathname.replace(/\/+$/, "") || "/";
    const ip = await sha((req.headers.get("CF-Connecting-IP") || "0") + "|ttc");

    if (path === "/") {
      const [total, today] = await Promise.all([kv.get("total"), kv.get("d:" + day())]);
      const c = { total: +total || 0, today: +today || 0 };
      if (req.method === "POST") {
        c.total++; c.today++;
        await Promise.all([kv.put("total", String(c.total)), kv.put("d:" + day(), String(c.today), { expirationTtl: 3 * 86400 })]);
      }
      return J(c);
    }

    if (path === "/builds" && req.method === "GET") {
      const list = await readBuilds(kv);
      return J(list.map(({ ip: _, ...b }) => b));
    }

    if (path === "/builds" && req.method === "POST") {
      const rk = "rl:" + ip, used = +(await kv.get(rk)) || 0;
      if (used >= POST_LIMIT) return J({ error: "โพสต์ได้ชั่วโมงละ " + POST_LIMIT + " Build ลองใหม่ภายหลังนะ" }, 429);
      let body; try { body = await req.json(); } catch { return J({ error: "ข้อมูลไม่ถูกต้อง" }, 400); }
      const p = body.build || {};
      if (!TAILS.includes(p.t)) return J({ error: "ไม่รู้จักหางนี้" }, 400);
      const b = {
        id: crypto.randomUUID().slice(0, 8), at: Date.now(), likes: 0,
        build: {
          t: p.t, l: Math.max(1, Math.min(110, p.l | 0)), s: nums(p.s, 8, 400) || [0, 0, 0, 0, 0, 0, 0, 0], b: nums(p.b, 8, 2000),
          e: (p.e || []).slice(0, 8).map((x) => clean(x, 60)), k: (p.k || []).slice(0, 200).map((x) => x | 0), n: clean(p.n, 40),
          q: Array.isArray(p.q) ? p.q.slice(0, 3).map((s) => ({ n: clean(s && s.n, 24), i: (s && Array.isArray(s.i) ? s.i : []).slice(0, 6).map((x) => clean(x, 60)) })) : [],
          p: Array.isArray(p.p) ? p.p.slice(0, 8).map((x) => [clean(x && x[0], 4), clean(x && x[1], 12)]) : [],
          ks: Array.isArray(p.ks) ? p.ks.slice(0, 10).map((x) => [x && x[0] | 0, clean(x && x[1], 120)]) : [],
          w: { play: clean(p.w && p.w.play, 800), pro: clean(p.w && p.w.pro, 400), con: clean(p.w && p.w.con, 400) },
          ic: Number.isInteger(p.ic) && p.ic > 0 && p.ic < 100000 ? p.ic : undefined,
          g: p.g ? {
            d: clean(p.g.d, 1500),
            st: Object.fromEntries(Object.entries(p.g.st || {}).filter(([k, v]) => STATS.includes(k) && v && ["max", "follow", "num"].includes(v.m)).map(([k, v]) => [k, { m: v.m, v: clean(v.v, 8) }])),
            sk: Array.isArray(p.g.sk) ? p.g.sk.slice(0, 3).map((s) => (Array.isArray(s) ? s : []).slice(0, 3).map((x) => (STATS.includes(x) ? x : ""))) : [],
          } : undefined,
        },
        author: clean(body.author, 24) || "ไม่ระบุชื่อ", desc: clean(body.desc, 200), tags: (body.tags || []).filter((x) => TAGS.includes(x)).slice(0, 3), views: 0, ip,
      };
      if (!b.build.n) b.build.n = b.build.t + " Build";
      const list = await readBuilds(kv); list.unshift(b);
      await kv.put("builds", JSON.stringify(list.slice(0, 2000)));
      await kv.put(rk, String(used + 1), { expirationTtl: 3600 });
      const { ip: _, ...out } = b; return J(out, 201);
    }

    let m = path.match(/^\/builds\/([\w-]{4,12})\/like$/);
    if (m && req.method === "POST") {
      const lk = "lk:" + m[1] + ":" + ip;
      const list = await readBuilds(kv), b = list.find((x) => x.id === m[1]);
      if (!b) return J({ error: "ไม่พบ Build" }, 404);
      if (await kv.get(lk)) return J({ likes: b.likes, already: true });
      b.likes++; await kv.put("builds", JSON.stringify(list)); await kv.put(lk, "1", { expirationTtl: 400 * 86400 });
      return J({ likes: b.likes });
    }

    m = path.match(/^\/builds\/([\w-]{4,12})\/view$/);
    if (m && req.method === "POST") {
      const vk = "vw:" + m[1] + ":" + ip;
      const list = await readBuilds(kv), b = list.find((x) => x.id === m[1]);
      if (!b) return J({ error: "ไม่พบ Build" }, 404);
      if (!(await kv.get(vk))) { b.views = (b.views || 0) + 1; await kv.put("builds", JSON.stringify(list)); await kv.put(vk, "1", { expirationTtl: 86400 }); }
      return J({ views: b.views || 0 });
    }

    m = path.match(/^\/builds\/([\w-]{4,12})$/);
    if (m && req.method === "DELETE") {
      if (!env.ADMIN_KEY || (req.headers.get("X-Admin") || "").trim() !== String(env.ADMIN_KEY).trim()) return J({ error: "ไม่มีสิทธิ์" }, 403);
      const list = await readBuilds(kv), n = list.length, left = list.filter((x) => x.id !== m[1]);
      await kv.put("builds", JSON.stringify(left)); return J({ deleted: n - left.length });
    }
    return J({ error: "not found" }, 404);
  },
};

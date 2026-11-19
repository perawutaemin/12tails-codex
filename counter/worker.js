// Visit counter for perawutaemin.github.io/12tails-codex — GET reads, POST counts one visit. Stored in KV (TTC_VISITS).
const ORIGINS = ["https://perawutaemin.github.io", "https://claude.ai", "https://claudeusercontent.com"];
const day = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // Bangkok date
function cors(req) {
  const o = req.headers.get("Origin") || "";
  const ok = ORIGINS.some((a) => o === a || o.endsWith(".claudeusercontent.com")) || o.startsWith("http://localhost");
  return { "Access-Control-Allow-Origin": ok ? o : ORIGINS[0], "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Vary": "Origin" };
}
async function read(kv) {
  const [total, today] = await Promise.all([kv.get("total"), kv.get("d:" + day())]);
  return { total: +total || 0, today: +today || 0 };
}
export default {
  async fetch(req, env) {
    const h = { ...cors(req), "content-type": "application/json", "cache-control": "no-store" };
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    const kv = env.TTC_VISITS, c = await read(kv);
    if (req.method === "POST") {
      c.total++; c.today++;
      await Promise.all([kv.put("total", String(c.total)), kv.put("d:" + day(), String(c.today), { expirationTtl: 3 * 86400 })]);
    }
    return new Response(JSON.stringify(c), { headers: h });
  },
};

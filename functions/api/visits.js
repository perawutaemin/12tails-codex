// Site visit counter: GET reads, POST counts one visit. Stored in KV (TTC_VISITS).
const day = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // Bangkok date

async function read(kv) {
  const [total, today] = await Promise.all([kv.get("total"), kv.get("d:" + day())]);
  return { total: +total || 0, today: +today || 0 };
}

const json = (o) => new Response(JSON.stringify(o), {
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});

export async function onRequestGet({ env }) {
  return json(await read(env.TTC_VISITS));
}

export async function onRequestPost({ env }) {
  const kv = env.TTC_VISITS, c = await read(kv);
  c.total++; c.today++;
  await Promise.all([
    kv.put("total", String(c.total)),
    kv.put("d:" + day(), String(c.today), { expirationTtl: 3 * 86400 }),
  ]);
  return json(c);
}

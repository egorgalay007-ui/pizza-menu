const crypto = require("crypto");
const { Api } = require("grammy");
const { buildOrder, sendReceipts } = require("../lib/shared");

const api = new Api(process.env.BOT_TOKEN);

// Проверяем, что данные действительно пришли от Telegram
function verifyInitData(initData, token) {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");
  if (!hash) return null;

  const dataCheck = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const calc = crypto.createHmac("sha256", secret).update(dataCheck).digest("hex");

  const a = Buffer.from(calc), b = Buffer.from(hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Date.now() / 1000 - Number(params.get("auth_date")) > 86400) return null; // старше суток

  try { return JSON.parse(params.get("user")); } catch { return null; }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const { initData, items, discount } = req.body || {};
  const user = verifyInitData(initData, process.env.BOT_TOKEN);
  if (!user) return res.status(401).json({ ok: false, error: "bad auth" });

  const order = buildOrder({ items, discount });
  if (!order) return res.status(400).json({ ok: false, error: "empty order" });

  try {
    await sendReceipts(api, user, order);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false });
  }
};
const MENU = {
  pizza:      { name: "Пепперони Премиум",   price: 450 },
  margarita:  { name: "Маргарита",           price: 390 },
  fourcheese: { name: "Четыре сыра",         price: 520 },
  burger:     { name: "Тройной Чизбургер",   price: 320 },
  classic:    { name: "Классический бургер", price: 250 },
  chicken:    { name: "Чикен бургер",        price: 280 },
  cola:       { name: "Кола 0.5 л",          price: 90 },
  juice:      { name: "Сок яблочный",        price: 100 },
  water:      { name: "Вода 0.5 л",          price: 60 },
  icetea:     { name: "Холодный чай",        price: 110 }
};
const MAX_DISCOUNT = 20;

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Пересчитывает заказ на сервере. Клиентским ценам не верим.
function buildOrder(data) {
  if (!data || !Array.isArray(data.items)) return null;
  const discount = Math.min(Math.max(Number(data.discount) || 0, 0), MAX_DISCOUNT);
  let lines = "", sum = 0;

  for (const item of data.items) {
    const dish = MENU[item.id];
    const qty = Number(item.count);
    if (!dish || !Number.isInteger(qty) || qty < 1 || qty > 50) continue;
    const cost = dish.price * qty;
    sum += cost;
    lines += `• ${dish.name} — ${qty} шт. (${cost} ₽)\n`;
  }
  if (sum === 0) return null;

  const total = Math.round(sum * (1 - discount / 100));
  return { lines, sum, total, discount };
}

// Чек клиенту и уведомление владельцу
async function sendReceipts(api, user, order) {
  const { lines, sum, total, discount } = order;

  if (process.env.ADMIN_ID) {
    const name = esc(user.first_name || "Без имени");
    const nick = user.username ? `@${esc(user.username)}` : "нет username";
    await api.sendMessage(
      process.env.ADMIN_ID,
      `🔔 <b>НОВЫЙ ЗАКАЗ</b>\nОт: ${name} (${nick})\n\n${lines}\nСкидка: ${discount}%\n<b>Итого: ${total} ₽</b>`,
      { parse_mode: "HTML" }
    );
  }

  let check = "🎉 <b>ЗАКАЗ ПРИНЯТ!</b> 🎉\n\n" + lines;
  if (discount > 0) check += `\nСумма: ${sum} ₽\n🎁 Скидка ${discount}%: −${sum - total} ₽\n`;
  check += `\n💵 <b>Итого к оплате: ${total} ₽</b>\n\nГотовим твой кайф! 🚀`;
  await api.sendMessage(user.id, check, { parse_mode: "HTML" });
}

module.exports = { MENU, buildOrder, sendReceipts };
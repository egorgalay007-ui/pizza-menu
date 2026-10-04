const { Bot, InlineKeyboard, webhookCallback } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  const kb = new InlineKeyboard().webApp("🍕 Открыть меню 🍔", process.env.WEB_APP_URL);
  await ctx.reply(
    "Привет! 😎\n\nВыбирай пиццу и бургеры, а в корзине открой подарок и выиграй скидку 🎁",
    { reply_markup: kb }
  );
});

bot.on("message", async (ctx) => {
  await ctx.reply("Нажми /start, чтобы открыть меню 🍕");
});

// secretToken: Telegram будет присылать секрет, остальные запросы отклоняются
module.exports = webhookCallback(bot, "https", {
  secretToken: process.env.WEBHOOK_SECRET
});
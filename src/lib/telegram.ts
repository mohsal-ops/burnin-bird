// src/lib/telegram.ts
export async function sendTelegramMessage(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to send Telegram message:", text);
    } else {
      console.log("✅ Telegram message sent successfully");
    }
  } catch (err) {
    console.error("Error sending Telegram message:", err);
  }
}

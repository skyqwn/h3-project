import type { Lead, NotifyChannel } from "../types";

function formatMessage(lead: Lead): string {
  return (
    "🔔 H3 새 문의\n" +
    `이름: ${lead.name}\n` +
    `이메일: ${lead.email}\n` +
    `회사: ${lead.company || "—"}\n` +
    `언어: ${lead.locale}\n\n` +
    lead.message
  );
}

export const telegramChannel: NotifyChannel = {
  name: "telegram",
  async send(lead: Lead): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.info(
        "[notify:telegram] not configured (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID missing), skipping"
      );
      return;
    }

    const body = new URLSearchParams({
      chat_id: chatId,
      text: formatMessage(lead),
    });

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { method: "POST", body }
    );

    if (!res.ok) {
      throw new Error(
        `[notify:telegram] sendMessage failed with HTTP ${res.status}`
      );
    }
  },
};

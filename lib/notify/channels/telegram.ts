import type { Lead, NotifyChannel } from "../types";

const PURPOSE_LABEL: Record<Lead["purpose"], string> = {
  product: "제품·견적 문의",
  technical: "기술 상담",
  partnership: "협력·파트너십",
  etc: "기타",
};

function formatMessage(lead: Lead): string {
  return (
    "🔔 H3 새 문의\n" +
    `담당자: ${lead.contactName}\n` +
    `회사: ${lead.company || "—"}\n` +
    `전화: ${lead.phone}\n` +
    `이메일: ${lead.email}\n` +
    `목적: ${PURPOSE_LABEL[lead.purpose]}\n` +
    `첨부: ${lead.attachmentName || "—"}\n` +
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

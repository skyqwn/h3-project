import type { Lead, NotifyChannel } from "./types";
import { telegramChannel } from "./channels/telegram";

// Add future channels (auto-reply, slack, db) to this array. The contact
// Server Action never changes when a channel is added.
const defaultChannels: NotifyChannel[] = [telegramChannel];

// Best-effort fan-out: every channel's failure is isolated and logged;
// this never rejects, so callers can `await notify(lead)` safely.
export async function runChannels(
  lead: Lead,
  channels: NotifyChannel[]
): Promise<void> {
  await Promise.all(
    channels.map(async (channel) => {
      try {
        await channel.send(lead);
      } catch (err) {
        console.error(`[notify:${channel.name}] failed:`, err);
      }
    })
  );
}

export async function notify(lead: Lead): Promise<void> {
  await runChannels(lead, defaultChannels);
}

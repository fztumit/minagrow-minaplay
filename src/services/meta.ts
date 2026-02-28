import crypto from 'node:crypto';

export type InboundMessage = {
  channel: 'whatsapp' | 'meta';
  senderId: string;
  phone: string | null;
  text: string;
  timestamp: string;
};

export function verifyWebhookChallenge(params: {
  mode?: string;
  token?: string;
  challenge?: string;
  expectedToken: string;
}): string | null {
  const { mode, token, challenge, expectedToken } = params;

  if (mode !== 'subscribe') return null;
  if (!token || token !== expectedToken) return null;
  if (!challenge) return null;

  return challenge;
}

export function verifyMetaSignature(params: {
  rawBody: Buffer;
  signatureHeader?: string;
  appSecret?: string;
}): boolean {
  const { rawBody, signatureHeader, appSecret } = params;

  if (!appSecret) return true;
  if (!signatureHeader) return false;

  const [algo, incomingHash] = signatureHeader.split('=');
  if (algo !== 'sha256' || !incomingHash) return false;

  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const incomingBuffer = Buffer.from(incomingHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (incomingBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(incomingBuffer, expectedBuffer);
}

function parseWhatsapp(payload: any): InboundMessage[] {
  const events: InboundMessage[] = [];

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      const contacts = value?.contacts ?? [];
      const contactByWaId = new Map<string, string>();

      for (const c of contacts) {
        if (c?.wa_id) {
          contactByWaId.set(c.wa_id, c.wa_id);
        }
      }

      for (const msg of value?.messages ?? []) {
        if (msg?.type !== 'text' || !msg?.text?.body) continue;

        const senderId = String(msg.from ?? 'unknown');

        events.push({
          channel: 'whatsapp',
          senderId,
          phone: contactByWaId.get(senderId) ?? senderId,
          text: msg.text.body,
          timestamp: msg.timestamp
            ? new Date(Number(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString()
        });
      }
    }
  }

  return events;
}

function parseMetaDM(payload: any): InboundMessage[] {
  const events: InboundMessage[] = [];

  for (const entry of payload?.entry ?? []) {
    for (const messaging of entry?.messaging ?? []) {
      const text = messaging?.message?.text;
      if (!text) continue;

      const senderId = String(messaging?.sender?.id ?? 'unknown');
      const timestampMs = Number(messaging?.timestamp ?? Date.now());

      events.push({
        channel: 'meta',
        senderId,
        phone: null,
        text,
        timestamp: new Date(timestampMs).toISOString()
      });
    }
  }

  return events;
}

export function parseInboundMessages(
  payload: any,
  channel: 'whatsapp' | 'meta'
): InboundMessage[] {
  return channel === 'whatsapp' ? parseWhatsapp(payload) : parseMetaDM(payload);
}

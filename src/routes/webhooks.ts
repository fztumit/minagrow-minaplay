import { Router } from 'express';
import { z } from 'zod';
import { Env } from '../config/env';
import { extractFromMessage } from '../domain/extract';
import { segmentLead } from '../domain/segmentation';
import { addFollowUpTasks } from '../db';
import {
  parseInboundMessages,
  verifyMetaSignature,
  verifyWebhookChallenge
} from '../services/meta';
import { ZohoService } from '../services/zoho';

const verifySchema = z.object({
  'hub.mode': z.string().optional(),
  'hub.verify_token': z.string().optional(),
  'hub.challenge': z.string().optional()
});

async function processMessages(params: {
  channel: 'whatsapp' | 'meta';
  payload: unknown;
  zoho: ZohoService;
}): Promise<void> {
  const messages = parseInboundMessages(params.payload, params.channel);

  for (const message of messages) {
    const extraction = extractFromMessage(message.text);
    const segmentation = segmentLead({
      qty: extraction.qty,
      productCode: extraction.productCode
    });

    try {
      const lead = await params.zoho.upsertLeadByPhone({
        company: 'Bireysel Müşteri',
        lastName: `Kisi-${message.senderId}`,
        phone: message.phone ?? undefined,
        description: message.text,
        leadSource: message.channel === 'whatsapp' ? 'WhatsApp' : 'Meta DM',
        productCode: extraction.productCode,
        qty: extraction.qty,
        logoRequested: extraction.logoRequested,
        segment: segmentation.segment,
        stage: segmentation.stage
      });

      // MVP varsayimi: Teklif Verilecek asamasina giren kayitlar icin takip task'i aciyoruz.
      if (segmentation.stage === 'Teklif Verilecek') {
        const localTasks = await addFollowUpTasks(lead.id);

        for (const task of localTasks) {
          try {
            await params.zoho.createTaskForLead(lead.id, task.dueDate, task.title);
          } catch {
            // Zoho task acilamasa da local db'de kayit devam eder.
          }
        }
      }
    } catch (error) {
      console.error('zoho upsert error, webhook accepted for retry', error);
    }
  }
}

export function buildWebhookRouter(env: Env, zoho: ZohoService): Router {
  const router = Router();

  router.get('/whatsapp', (req, res) => {
    const parsed = verifySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).send('invalid verify params');
    }

    const challenge = verifyWebhookChallenge({
      mode: parsed.data['hub.mode'],
      token: parsed.data['hub.verify_token'],
      challenge: parsed.data['hub.challenge'],
      expectedToken: env.META_VERIFY_TOKEN
    });

    if (!challenge) {
      return res.status(403).send('forbidden');
    }

    return res.status(200).send(challenge);
  });

  router.get('/meta', (req, res) => {
    const parsed = verifySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).send('invalid verify params');
    }

    const challenge = verifyWebhookChallenge({
      mode: parsed.data['hub.mode'],
      token: parsed.data['hub.verify_token'],
      challenge: parsed.data['hub.challenge'],
      expectedToken: env.META_VERIFY_TOKEN
    });

    if (!challenge) {
      return res.status(403).send('forbidden');
    }

    return res.status(200).send(challenge);
  });

  router.post('/whatsapp', async (req, res) => {
    try {
      await processMessages({
        channel: 'whatsapp',
        payload: req.body,
        zoho
      });
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('whatsapp webhook error', error);
      return res.status(200).json({ ok: true, warning: 'processed_with_errors' });
    }
  });

  router.post('/meta', async (req, res) => {
    const rawBody = (req as any).rawBody as Buffer | undefined;
    const signature = req.header('x-hub-signature-256') ?? undefined;

    const signatureValid = verifyMetaSignature({
      rawBody: rawBody ?? Buffer.from(JSON.stringify(req.body)),
      signatureHeader: signature,
      appSecret: env.META_APP_SECRET
    });

    if (!signatureValid) {
      return res.status(401).json({ ok: false, error: 'invalid signature' });
    }

    try {
      await processMessages({
        channel: 'meta',
        payload: req.body,
        zoho
      });
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('meta webhook error', error);
      return res.status(500).json({ ok: false });
    }
  });

  return router;
}

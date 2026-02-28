import axios, { AxiosInstance } from 'axios';
import { Env } from '../config/env';

export type LeadPayload = {
  company: string;
  lastName: string;
  phone?: string;
  city?: string;
  description: string;
  leadSource: string;
  productCode?: string | null;
  qty?: number | null;
  segment: string;
  stage: string;
};

export class ZohoService {
  private readonly env: Env;
  private readonly enabled: boolean;

  private accessToken: string | null = null;

  private accessTokenExpiresAt = 0;

  private readonly client: AxiosInstance;

  constructor(env: Env) {
    this.env = env;
    this.enabled = env.ZOHO_ENABLED;
    this.client = axios.create({
      baseURL: env.ZOHO_API_DOMAIN,
      timeout: 15000
    });
  }

  private getAccountsTokenUrl(): string {
    const apiUrl = new URL(this.env.ZOHO_API_DOMAIN);
    const normalizedHost = apiUrl.hostname.replace(/^www\./, '');
    const suffix = normalizedHost.split('zohoapis.')[1];
    if (!suffix) {
      throw new Error(`Unsupported Zoho API domain: ${this.env.ZOHO_API_DOMAIN}`);
    }
    return `https://accounts.zoho.${suffix}/oauth/v2/token`;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private async refreshAccessTokenIfNeeded(): Promise<string> {
    if (!this.enabled) {
      throw new Error('Zoho integration is disabled');
    }
    if (!this.env.ZOHO_CLIENT_ID || !this.env.ZOHO_CLIENT_SECRET || !this.env.ZOHO_REFRESH_TOKEN) {
      throw new Error('Missing Zoho credentials');
    }

    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiresAt - 10_000) {
      return this.accessToken;
    }

    const params = new URLSearchParams({
      refresh_token: this.env.ZOHO_REFRESH_TOKEN,
      client_id: this.env.ZOHO_CLIENT_ID,
      client_secret: this.env.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token'
    });

    const response = await axios.post(this.getAccountsTokenUrl(), params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const token = response.data.access_token as string;
    if (!token) {
      throw new Error(`Zoho token refresh failed: ${JSON.stringify(response.data)}`);
    }
    const expiresIn = Number(response.data.expires_in ?? 3600);

    this.accessToken = token;
    this.accessTokenExpiresAt = now + expiresIn * 1000;

    return token;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.refreshAccessTokenIfNeeded();
    return {
      Authorization: `Zoho-oauthtoken ${token}`
    };
  }

  async findLeadByPhone(phone: string): Promise<{ id: string } | null> {
    if (!this.enabled) return null;
    const headers = await this.authHeaders();

    const response = await this.client.get('/crm/v2/Leads/search', {
      headers,
      params: {
        criteria: `(Phone:equals:${phone})`
      }
    });

    const first = response.data?.data?.[0];
    if (!first?.id) return null;

    return { id: String(first.id) };
  }

  private mapLead(payload: LeadPayload): Record<string, unknown> {
    return {
      Company: payload.company,
      Last_Name: payload.lastName,
      Phone: payload.phone,
      City: payload.city,
      Description: payload.description,
      Lead_Source: payload.leadSource,
      product_code: payload.productCode ?? null,
      qty: payload.qty ?? null,
      segment: payload.segment,
      stage: payload.stage
    };
  }

  async upsertLeadByPhone(payload: LeadPayload): Promise<{ id: string; action: 'created' | 'updated' }> {
    if (!this.enabled) {
      const fallbackId = payload.phone ? `local-${payload.phone}` : `local-${Date.now()}`;
      return { id: fallbackId, action: 'created' };
    }
    const headers = await this.authHeaders();

    if (payload.phone) {
      try {
        const existing = await this.findLeadByPhone(payload.phone);
        if (existing) {
          await this.client.put(
            '/crm/v2/Leads',
            {
              data: [{ id: existing.id, ...this.mapLead(payload) }]
            },
            { headers }
          );

          return { id: existing.id, action: 'updated' };
        }
      } catch {
        // Kayit yok veya arama hatasi durumunda create yoluna dus.
      }
    }

    const response = await this.client.post(
      '/crm/v2/Leads',
      {
        data: [this.mapLead(payload)]
      },
      { headers }
    );

    const id = String(response.data?.data?.[0]?.details?.id ?? '');
    return { id, action: 'created' };
  }

  async createTaskForLead(leadId: string, dueDate: string, subject: string): Promise<void> {
    if (!this.enabled) return;
    const headers = await this.authHeaders();

    await this.client.post(
      '/crm/v2/Tasks',
      {
        data: [
          {
            Subject: subject,
            Due_Date: dueDate,
            What_Id: leadId,
            Status: 'Not Started',
            Priority: 'High'
          }
        ]
      },
      { headers }
    );
  }
}

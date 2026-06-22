import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { AmoCrmUsersResponse } from '@shared/dto/amo-crm-users-response.dto';
import { AmoCrmLead, AmoCrmLeadsResponse } from '@shared/dto/amo-crm-leads-response.dto';
import dayjs from 'dayjs';
import { InjectRepository } from '@nestjs/typeorm';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AmocrmService implements OnModuleInit {
  constructor(
    @InjectRepository(CrmProfile) private readonly crmProfileRepo: Repository<CrmProfile>,
    private readonly config: ConfigService,
  ) {}

  apiClient: AxiosInstance;

  onModuleInit() {
    const proxyUrl = this.config.get<string>('PROXY_URL');
    this.apiClient = axios.create({
      baseURL: this.config.getOrThrow<string>('AMOCRM_API_URL'),
      ...(proxyUrl && { httpsAgent: new HttpsProxyAgent(proxyUrl) }),
    });

    this.apiClient.interceptors.request.use((config) => {
      config.headers['Authorization'] = `Bearer ${this.config.getOrThrow<string>('AMOCRM_API_KEY')}`;

      return config;
    });
  }

  async getUsers() {
    const res = await this.apiClient.get('users');
    return res.data as AmoCrmUsersResponse;
  }

  async getLeadsCount(accountId: string | null, startDate: Date, endDate: Date) {
    const now = dayjs();
    const startDateTime = Math.floor(dayjs(startDate).startOf('month').toDate().getTime() / 1000);
    const endDateTime = Math.floor(dayjs(endDate).toDate().getTime());
    const fetch = async (url: string, count: number = 0) => {
      const res = await this.apiClient.get(url);
      const data = res.data as AmoCrmLeadsResponse;

      if (res.status === 204) {
        return 0;
      }

      if (data._links.next) {
        return fetch(data._links.next.href, count + data._embedded.leads.length);
      } else {
        return count + data._embedded.leads.length;
      }
    };

    return fetch(
      `leads?order[created_at]=desc&` +
        `filter[created_at][from]=${startDateTime}&` +
        `filter[created_at][end]=${endDateTime}&` +
        (accountId ? `filter[responsible_user_id]=${accountId}` : ''),
    );
  }

  async getLead(id: string) {
    const res = await this.apiClient.get(`leads/${id}`);
    return res.data as AmoCrmLead;
  }

  async syncLeadCount() {
    try {
      const accounts = await this.crmProfileRepo.find();
      const now = dayjs();
      const startDate = now.startOf('month').toDate();
      const endDate = now.toDate();

      for (const account of accounts) {
        const leadCount = await this.getLeadsCount(
          account.accountId !== '0' ? account.accountId : null,
          startDate,
          endDate,
        );

        await this.crmProfileRepo.save({
          ...account,
          leadCount,
        });
      }
    } catch (e) {
      console.error('Error counting leads:', e.message);
    }
  }
}

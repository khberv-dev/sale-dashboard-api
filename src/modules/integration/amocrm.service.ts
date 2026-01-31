import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AmoCrmUsersResponse } from '@shared/dto/amo-crm-users-response.dto';
import { AmoCrmLeadsResponse } from '@shared/dto/amo-crm-leads-response.dto';
import dayjs from 'dayjs';

@Injectable()
export class AmocrmService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  apiClient: AxiosInstance;

  onModuleInit() {
    this.apiClient = axios.create({
      baseURL: this.config.getOrThrow<string>('AMOCRM_API_URL'),
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

  async getLeadsCount(accountId: string) {
    const now = dayjs();
    const startDate = Math.floor(now.startOf('month').toDate().getTime() / 1000);
    const endDate = Math.floor(now.toDate().getTime());
    const fetch = async (url: string, count: number = 0) => {
      const res = await this.apiClient.get(url);
      const data = res.data as AmoCrmLeadsResponse;

      if (data._links && data._links.next) {
        return fetch(data._links.next.href, count + data._embedded.leads.length);
      } else {
        return count + data._embedded.leads.length;
      }
    };

    return fetch(
      `leads?order[created_at]=desc&` +
        `filter[created_at][from]=${startDate}&` +
        `filter[created_at][end]=${endDate}&` +
        `filter[responsible_user_id]=${accountId}`,
    );
  }
}

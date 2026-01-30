import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { hashMD5Object } from '@/utils/hash.util';
import { objectToQuery } from '@/utils/lib.util';
import { SipuniCallItem } from '@shared/dto/sipuni-call-item.dto';
import dayjs from 'dayjs';

@Injectable()
export class SipuniService implements OnModuleInit {
  apiClient: AxiosInstance;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.apiClient = axios.create({
      baseURL: process.env.SIPUNI_API_URL,
    });
  }

  async fetchData(endpoint: string, params: object) {
    const hash = hashMD5Object({ ...params, secret: this.config.getOrThrow<string>('SIPUNI_API_KEY') });
    const query = objectToQuery({ ...params, hash });
    const res = await this.apiClient.get(endpoint + '?' + query);

    return res.data as string;
  }

  parseCallData(data: string) {
    const lines = data.split('\n');
    const result: SipuniCallItem[] = [];

    for (let i = 1; i < lines.length - 1; i++) {
      result.push(new SipuniCallItem(lines[i]));
    }

    return result;
  }

  async getCallStats() {
    const response = this.fetchData('statistic/export/all', {
      limit: 200000,
      order: 'desc',
      page: 1,
      user: this.config.getOrThrow<string>('SIPUNI_API_USER'),
    });

    return this.parseCallData(await response);
  }

  async calculateCallDurations() {
    const now = dayjs();
    const result: Map<string, number> = new Map();
    const calls = await this.getCallStats();

    calls.forEach((call) => {
      if (dayjs(call.time).isSame(now, 'month')) {
        result.set(call.from, (result.get(call.from) || 0) + call.callDuration);
        result.set(call.to, (result.get(call.from) || 0) + call.callDuration);
        result.set(call.answeredBy, (result.get(call.from) || 0) + call.callDuration);
      }
    });

    return result;
  }
}

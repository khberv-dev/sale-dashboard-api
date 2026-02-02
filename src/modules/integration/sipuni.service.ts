import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { hashMD5Object } from '@/utils/hash.util';
import { objectToQuery } from '@/utils/lib.util';
import { SipuniCallItem } from '@shared/dto/sipuni-call-item.dto';
import dayjs from 'dayjs';
import { InjectRepository } from '@nestjs/typeorm';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SipuniService implements OnModuleInit {
  apiClient: AxiosInstance;

  constructor(
    @InjectRepository(CrmProfile) private readonly crmProfileRepo: Repository<CrmProfile>,
    private readonly config: ConfigService,
  ) {}

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

  async calculateCallDurations(startDate: Date, endDate: Date) {
    const _startDate = dayjs(startDate);
    const _endDate = dayjs(endDate);
    const result: Map<string, number> = new Map();
    const calls = await this.getCallStats();

    calls.forEach((call) => {
      if (dayjs(call.time).isAfter(_startDate) && dayjs(call.time).isBefore(_endDate)) {
        if (call.from.length < 5) {
          result.set(call.from, (result.get(call.from) || 0) + call.callDuration);
        }
        if (call.to.length < 5) {
          result.set(call.to, (result.get(call.to) || 0) + call.callDuration);
        }
        if (call.answeredBy.length < 5) {
          result.set(call.answeredBy, (result.get(call.answeredBy) || 0) + call.callDuration);
        }
      }
    });

    return result;
  }

  async syncCallDuration() {
    try {
      const startDate = dayjs().startOf('day');
      const endDate = startDate.endOf('day');
      const callData = await this.calculateCallDurations(startDate.toDate(), endDate.toDate());
      const accounts = await this.crmProfileRepo.find();

      for (const account of accounts) {
        if (account.sipNumber) {
          await this.crmProfileRepo.save({
            ...account,
            callDuration: callData.get(account.sipNumber),
          });
        }
      }
    } catch (e) {
      console.log('Error calculating call durations:', e);
    }
  }
}

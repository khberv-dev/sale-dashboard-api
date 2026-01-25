import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract } from '@shared/entities/contract.entity';
import { Repository } from 'typeorm';
import { CreateContractSignRequest } from '@modules/contract/dto/create-contract-sign-request.dto';
import { CaptchaService } from '@modules/contract/captcha.service';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract) private readonly contractRepository: Repository<Contract>,
    private readonly captchaService: CaptchaService,
  ) {}

  async createSign(data: CreateContractSignRequest) {
    await this.captchaService.validateSession(data.session, data.captcha);

    await this.contractRepository.save({
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
    });

    return {
      message: 'Qabul qilindi',
    };
  }

  getAll() {
    return this.contractRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '@shared/entities/contract.entity';
import { ContractService } from '@modules/contract/contract.service';
import { CaptchaService } from '@modules/contract/captcha.service';
import { ContractController } from '@modules/contract/contract.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Contract])],
  controllers: [ContractController],
  providers: [ContractService, CaptchaService],
})
export class ContractModule {}

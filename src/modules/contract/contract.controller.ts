import { Body, Controller, Get, Post } from '@nestjs/common';
import { ContractService } from '@modules/contract/contract.service';
import { CaptchaService } from '@modules/contract/captcha.service';
import { CreateContractSignRequest } from '@modules/contract/dto/create-contract-sign-request.dto';
import { DefaultAuthGuard } from '@common/guards/default-auth.guard';
import { IsAdmin } from '@common/decorators/is-admin.decorator';

@Controller('contract')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Get('generate')
  generateCaptcha() {
    return this.captchaService.generate();
  }

  @Post('sign')
  signContract(@Body() body: CreateContractSignRequest) {
    return this.contractService.createSign(body);
  }

  @DefaultAuthGuard
  @IsAdmin()
  @Get('all')
  getAll() {
    return this.contractService.getAll();
  }
}

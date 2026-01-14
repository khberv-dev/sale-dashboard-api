import { Controller, Get, ParseIntPipe, Put, Query, Req } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { DefaultAuthGuard } from '@common/guards/default-auth.guard';

@DefaultAuthGuard
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.userService.getUserInfo(req.user.id);
  }

  @Get('month-plan')
  getMonthPlan(@Req() req: any) {
    return this.userService.getMonthPlan(req.user.id);
  }

  @Put('set-month-plan')
  setMonthPlan(@Query('plan', ParseIntPipe) plan: number, @Req() req: any) {
    return this.userService.setMonthPlan(req.user.id, plan);
  }
}

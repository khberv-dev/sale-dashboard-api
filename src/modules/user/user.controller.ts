import { Body, Controller, Get, ParseIntPipe, Post, Put, Query, Req } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { DefaultAuthGuard } from '@common/guards/default-auth.guard';
import { UpdatePasswordRequest } from '@modules/user/dto/update-password-request.dto';
import { IsAdmin } from '@common/decorators/is-admin.decorator';
import { RegisterAttendanceRequest } from '@modules/user/dto/register-attendance-request.dto';

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

  @IsAdmin()
  @Put('set-month-plan')
  setMonthPlan(@Query('plan', ParseIntPipe) plan: number, @Req() req: any) {
    return this.userService.setMonthPlan(req.user.id, plan);
  }

  @IsAdmin()
  @Post('register-attendance')
  registerAttendance(@Body() body: RegisterAttendanceRequest) {
    return this.userService.registerAttendance(body);
  }

  @IsAdmin()
  @Get('attendances')
  getTodayAttendances() {
    return this.userService.getTodayAttendances();
  }

  @Post('update-password')
  updatePassword(@Req() req: any, @Body() body: UpdatePasswordRequest) {
    return this.userService.updatePassword(req.user.id, body);
  }
}

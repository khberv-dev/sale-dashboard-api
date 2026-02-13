import { Body, Controller, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ManagerService } from '@modules/user/manager.service';
import { IsAdmin } from '@common/decorators/is-admin.decorator';
import { CreateManagerRequest } from '@modules/user/dto/create-manager-request.dto';
import { DefaultAuthGuard } from '@common/guards/default-auth.guard';
import { UpdateUserRequest } from '@modules/user/dto/update-user-request.dto';
import { fileUploadInterceptor } from '@common/interceptors/file-upload.interceptor';
import { UserService } from '@modules/user/user.service';
import { AddCallRequest } from '@modules/user/dto/add-call-request.dto';

@DefaultAuthGuard
@IsAdmin()
@Controller('manager')
export class ManagerController {
  constructor(
    private readonly managerService: ManagerService,
    private readonly userService: UserService,
  ) {}

  @Get('all')
  getManagers() {
    return this.managerService.getManagers();
  }

  @Post('create')
  createManager(@Body() body: CreateManagerRequest) {
    return this.managerService.createManager(body);
  }

  @Put('update/:managerId')
  updateManager(@Body() body: UpdateUserRequest, @Param('managerId') managerId: string) {
    return this.userService.updateUser(managerId, body);
  }

  @Post('upload-avatar/:managerId')
  @UseInterceptors(fileUploadInterceptor('avatar'))
  uploadManagerAvatar(@Param('managerId') managerId: string, @UploadedFile() file: Express.Multer.File) {
    return this.userService.updateUserAvatar(managerId, file.filename);
  }

  @Post('add-call')
  addCall(@Body() body: AddCallRequest) {
    return this.managerService.addCall(body);
  }
}

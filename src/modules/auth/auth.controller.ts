import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '@modules/auth/auth.service';
import { SignInRequest } from '@modules/auth/dto/sign-in-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  signIn(@Body() body: SignInRequest) {
    return this.authService.signIn(body);
  }
}

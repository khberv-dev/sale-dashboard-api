import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { SignInRequest } from '@modules/auth/dto/sign-in-request.dto';
import { User } from '@shared/entities/user.entity';
import { checkPassword } from '@/utils/hash.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private async validateUserUsername(username: string, password: string) {
    const user = await this.userRepo.findOne({
      where: {
        username,
      },
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await checkPassword(password, user.password);

    return isValidPassword ? user : null;
  }

  async signIn(data: SignInRequest) {
    const signedUser = await this.validateUserUsername(data.username, data.password);

    if (!signedUser) {
      throw new BadRequestException('Login yoki parol xato');
    }

    const token = this.jwtService.sign({
      sub: signedUser.id,
      role: signedUser.role.toString(),
    });

    return {
      token,
    };
  }
}
